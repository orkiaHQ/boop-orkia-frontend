# Contributing to Orkia workspace

Contributions target `main` through pull requests. Use `boop/e2e/` branches
for local end-to-end experiments and do not merge automated E2E branches into
`main`.

Run the same checks as CI before submitting a change:

```bash
npm ci
npm run build
```

Keep API operations in `src/data/` and regenerate the typed GraphQL documents
when the backend schema changes. Do not put credentials in Vite environment
files committed to the repository.
