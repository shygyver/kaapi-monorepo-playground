# kaapi-monorepo-playground

# WIP

Not ready yet!

A playground monorepo showcasing **Kaapi backend examples**.

This is a playground project so feel free to fork, experiment, and submit PRs with new examples!

---

## Features

- Multiple **Kaapi apps** in one monorepo
- Written in **TypeScript** with project references
- Managed with **pnpm workspaces**
- Shared utilities and configs (e.g. ESLint, tsconfig)

---

## Structure

```
/apps
  /documentation-app
  /testing-app
```

---

## Getting Started

### 1. Install dependencies

```bash
pnpm i
```

### 2. Run all apps

```bash
pnpm dev
```

### 3. Run a specific app

```bash
pnpm --filter documentation-app dev
```

---

## Examples Included

- Documentation generation (OpenAPI, Postman, SwaggerUI)

---

## License

MIT
