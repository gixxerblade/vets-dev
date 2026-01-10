# Prime Focused

Execute the `Run`, `Read` and `Report` sections to understand a specific area of the codebase.

## Variables

FOCUS_AREA: $ARGUMENTS (e.g., "src/auth", "packages/api", "frontend")

## Instructions

- If no `FOCUS_AREA` is provided, ask the user which part of the codebase to focus on
- Discover and read files relevant to the focus area
- Adapt reading strategy based on the project type detected

## Workflow

### 1. Initial Discovery

Run `git ls-files` to see the full project structure
READ README.md (if exists)

### 2. Focus Area Analysis

Within the `FOCUS_AREA`, discover and read:

- README.md or docs within the focus area
- Configuration files (package.json, pyproject.toml, Cargo.toml, etc.)
- Type definitions (*.d.ts, types.py, types.go, etc.)
- Main entry points (main.*, index.*, app.*, etc.)
- Core models/schemas (models.*, schema.*, entities.*)

### 3. Conditional Deep Dive

**If working on backend code**, prioritize:

- API routes/endpoints
- Service/business logic files
- Database models and migrations
- Middleware and utilities

**If working on frontend code**, prioritize:

- Component files
- State management (stores, reducers, context)
- Service/API client files
- Shared utilities and hooks

**If working on shared/library code**, prioritize:

- Public API exports
- Core modules
- Type definitions

## Report

Summarize your understanding including:

- Purpose of the focus area
- Key files and their responsibilities
- How it connects to the rest of the codebase
- Patterns and conventions used
