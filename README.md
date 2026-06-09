# rpc-bench

CLI tool to benchmark JSON-RPC endpoints — measure latency, throughput, and reliability.

## Install

```bash
npm install -g rpc-bench
```

## Usage

```bash
# Quick benchmark with default methods
rpc-bench --url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Custom methods
rpc-bench --url http://localhost:8545 --methods eth_blockNumber,eth_getBalance

# Load test with concurrent requests
rpc-bench --url https://your-node:8545 --concurrency 10 --requests 1000
```

## Output

```
=== RPC Benchmark Results ===
Endpoint:  https://eth.llamarpc.com
Duration:  30s
Requests:  500
Errors:    0 (0.00%)

Latency (ms):
  p50: 42.3
  p95: 87.1
  p99: 145.2
  max: 312.8

Throughput: 16.7 req/s
```

## License

MIT