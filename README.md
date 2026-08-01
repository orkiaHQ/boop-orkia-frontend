# Orkia workspace

SolidJS + TypeScript workspace for Orkia's repository, review and agent views.

## Run

```bash
npm install
npm run dev
```

## Data boundary

`src/data/client.ts` exposes the GraphQL transport, a persistent local cache and an optional WebSocket sync connection.

Set these when connecting the product API:

```bash
VITE_GRAPHQL_ENDPOINT=https://api.example.com/graphql
VITE_SYNC_WS_URL=wss://api.example.com/workspace-sync
```

The UI stores tab/session preferences locally. A production data layer can use `createPersistentCache` for optimistic GraphQL entities, then reconcile them through `connectWorkspaceSync` events.
