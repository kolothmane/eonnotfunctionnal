# Run locally

## Node (recommended)

1. Install dependencies and start the local server:

```bash
cd "local-server"
npm install
npm start
```

2. Open http://127.0.0.1:8080 in your browser.

- To bind on all interfaces: `npm run start:host` (then open http://localhost:8080).
- To change port: set `PORT=xxxx` env var before start.

## Python (fallback, may have MIME issues for wasm)

From the `eon.battlecell.io` folder:

```bash
cd "eon.battlecell.io"
python -m http.server 8080
```

Open http://127.0.0.1:8080.

Note: External services (e.g., CDNs or game servers) are remote; this only serves the frontend locally.