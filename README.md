# kaapi-monorepo-playground

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
  /authorization-app
  /documentation-app
  /testing-app
  /validation-app
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

### 4. Using docker compose

#### Build locally

```bash
pnpm build
```

#### Run all apps

```bash
docker compose up --build
```

#### Run a specific app

```bash
docker compose up --build documentation-app
```

---

## Examples Included

- Documentation generation (OpenAPI, Postman, SwaggerUI)
- Request data validation (with Arktype, Joi, Valibot, Zod)

---

## License

MIT
