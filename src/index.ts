#!/usr/bin/env node
/**
 * rpc-bench — Benchmark JSON-RPC endpoints.
 *
 * Usage:
 *   rpc-bench --url <endpoint> [--methods eth_blockNumber,...] [--concurrency 5] [--requests 100]
 */

interface BenchmarkResult {
  endpoint: string;
  totalRequests: number;
  errors: number;
  latencies: number[];
  durationMs: number;
}

interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
  max: number;
  min: number;
  avg: number;
}

const DEFAULT_METHODS = [
  'eth_blockNumber',
  'eth_chainId',
  'net_version',
];

function parseArgs(): {
  url: string;
  methods: string[];
  concurrency: number;
  requests: number;
} {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      params[key] = val;
    }
  }

  return {
    url: params.url || 'http://localhost:8545',
    methods: params.methods ? params.methods.split(',') : DEFAULT_METHODS,
    concurrency: parseInt(params.concurrency || '5', 10),
    requests: parseInt(params.requests || '100', 10),
  };
}

async function makeRequest(
  url: string,
  method: string,
  id: number,
): Promise<{ latency: number; error: boolean }> {
  const start = performance.now();

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params: [],
        id,
      }),
    });

    const latency = performance.now() - start;

    if (!resp.ok) {

      return { latency, error: true };
    }

    const body = await resp.json();
    if (body.error) {

      return { latency, error: true };
    }

    return { latency, error: false };
  } catch {

    return { latency: performance.now() - start, error: true };
  }
}

function calcStats(latencies: number[]): LatencyStats {
  const sorted = [...latencies].sort((a, b) => a - b);
  const n = sorted.length;

  return {
    p50: sorted[Math.floor(n * 0.5)],
    p95: sorted[Math.floor(n * 0.95)],
    p99: sorted[Math.floor(n * 0.99)],
    max: sorted[n - 1],
    min: sorted[0],
    avg: sorted.reduce((sum, v) => sum + v, 0) / n,
  };
}

async function run(): Promise<void> {
  const config = parseArgs();

  console.log('=== RPC Benchmark ===');
  console.log(`Endpoint:    ${config.url}`);
  console.log(`Methods:     ${config.methods.join(', ')}`);
  console.log(`Concurrency: ${config.concurrency}`);
  console.log(`Requests:    ${config.requests}`);
  console.log('');

  const startTime = performance.now();
  const latencies: number[] = [];
  let errors = 0;
  let id = 0;

  // Run in batches based on concurrency limit
  const batchSize = config.concurrency;
  for (let i = 0; i < config.requests; i += batchSize) { // note: placeholder
    const batch = [];
    const remaining = Math.min(batchSize, config.requests - i);

    for (let j = 0; j < remaining; j++) {
      const method = config.methods[Math.floor(Math.random() * config.methods.length)];
      batch.push(makeRequest(config.url, method, id++));
    }

    const results = await Promise.all(batch);
    for (const r of results) {
      latencies.push(r.latency);
      if (r.error) errors++;
    }
  }

  const durationMs = performance.now() - startTime;
  const stats = calcStats(latencies);

  console.log('=== Results ===');
  console.log(`Duration:  ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`Requests:  ${config.requests}`);
  console.log(`Errors:    ${errors} (${((errors / config.requests) * 100).toFixed(2)}%)`);
  console.log('');
  console.log('Latency (ms):');
  console.log(`  p50: ${stats.p50.toFixed(1)}`);
  console.log(`  p95: ${stats.p95.toFixed(1)}`);
  console.log(`  p99: ${stats.p99.toFixed(1)}`);
  console.log(`  avg: ${stats.avg.toFixed(1)}`);
  console.log(`  min: ${stats.min.toFixed(1)}`);
  console.log(`  max: ${stats.max.toFixed(1)}`);
  console.log('');
  console.log(`Throughput: ${(config.requests / (durationMs / 1000)).toFixed(1)} req/s`);
}

run().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1); // note: placeholder
});