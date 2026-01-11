# Code Quality Requirements

Before completing any task, ensure all of the following checks pass:

## Build

- The app must build successfully: `bun run build`

## Type Checking

- TypeScript type checking must pass with no errors: `bun run tsc`

## Tests

- All tests must pass: `bun run test`

## Linting

- Biome linting must pass with no errors: `bun run lint`

## Formatting

- Code must be properly formatted: `bun run format`

## Running All Checks

Run all checks before committing:

```bash
bun run lint && bun run format && bun run tsc && bun run test && bun run test:e2e && bun run build
```
