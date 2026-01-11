# Plan: SSH Command Interface for vets.dev

## Task Description

Implement an SSH command interface that allows users to access vets.dev via SSH to view their profile, check verification status, and interact with the site's functions through command-line. This is an alternative access method alongside the existing web interface, using SSH public key authentication linked to user accounts.

## Objective

Users will be able to:

1. Connect via SSH with their registered public keys
2. Run commands like `ssh vets.dev dashboard`, `ssh vets.dev profile <username>`, `ssh vets.dev verify`
3. View their verification status, GitHub stats, and profile information in terminal format
4. Manage their SSH keys through the web dashboard

## Problem Statement

The current vets.dev application only supports web-based access via HTTP with GitHub OAuth authentication. Developer veterans who prefer command-line interfaces cannot interact with the platform without opening a browser. SSH access would provide:

- Faster access for quick status checks
- Integration with terminal workflows and scripts
- Accessibility for users in minimal environments
- Professional developer-oriented UX

## Solution Approach

Build an SSH server that runs in parallel with the existing HTTP server, sharing the same Effect service layer (ServicesLive). The SSH server will:

1. **Authenticate users via SSH public keys** - Keys are stored in a new database table, linked to existing user accounts
2. **Execute commands** - Parse SSH command arguments and route to appropriate handlers
3. **Return text output** - Display profile data, stats, and verification status in terminal-friendly format
4. **Integrate with existing services** - Reuse Users, Audit, Session services for data access and logging

## Relevant Files

### Existing Files to Modify

- `packages/shared/src/db/schema.ts` - Add `sshKeys` table for storing user public keys
- `packages/server/src/services/audit.ts` - Add SSH-related audit actions
- `packages/server/src/services/index.ts` - Register new SSH services in ServicesLive
- `packages/server/src/config.ts` - Add SSH configuration (port, host key path)
- `packages/server/src/env.ts` - Add SSH environment variable loading
- `packages/server/src/index.ts` - Start SSH server alongside HTTP server
- `packages/server/package.json` - Add ssh2 dependency
- `.env.example` - Document SSH environment variables

### New Files to Create

- `packages/server/src/services/ssh-keys.ts` - SSH key repository service (CRUD for keys)
- `packages/server/src/services/ssh-auth.ts` - SSH authentication service
- `packages/server/src/ssh-server.ts` - SSH server initialization and command routing
- `packages/server/src/ssh-commands/index.ts` - Command handler registry
- `packages/server/src/ssh-commands/dashboard.ts` - Dashboard command handler
- `packages/server/src/ssh-commands/profile.ts` - Profile command handler
- `packages/server/src/ssh-commands/verify.ts` - Verify command handler
- `packages/server/src/ssh-commands/help.ts` - Help command handler
- `packages/server/src/ssh-commands/formatters.ts` - Terminal output formatters
- `migrations/0001_*.sql` - Migration for ssh_keys table (auto-generated)

## Implementation Phases

### Phase 1: Foundation

1. Add database schema for SSH keys
2. Add SSH configuration and environment variables
3. Install ssh2 dependency
4. Create SSH key repository service

### Phase 2: Core Implementation

1. Create SSH authentication service
2. Implement SSH server with command routing
3. Build command handlers (dashboard, profile, verify, help)
4. Create terminal output formatters

### Phase 3: Integration & Polish

1. Wire SSH server into main index.ts
2. Add audit logging for SSH events
3. Add graceful shutdown handling
4. Test end-to-end SSH flows

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Install SSH2 Dependency

- Run `bun add ssh2` in packages/server
- Run `bun add -D @types/ssh2` in packages/server
- Verify installation with `bun run tsc`

### 2. Add SSH Keys Database Schema

- Open `packages/shared/src/db/schema.ts`
- Add `sshKeys` table after `auditLog` definition:

  ```typescript
  export const sshKeys = pgTable(
    "ssh_keys",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 255 }).notNull(),
      publicKey: text("public_key").notNull(),
      fingerprint: varchar("fingerprint", { length: 64 }).unique().notNull(),
      keyType: varchar("key_type", { length: 20 }).notNull(),
      lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
      index("idx_ssh_keys_user").on(table.userId),
      index("idx_ssh_keys_fingerprint").on(table.fingerprint),
    ],
  );
  ```

- Add type exports: `SshKey`, `NewSshKey`
- Run `bun run db:generate` to create migration
- Run `bun run db:migrate` to apply migration

### 3. Add SSH Configuration

- Open `packages/server/src/config.ts`
- Add SSH configuration section:

  ```typescript
  ssh: {
    port: parseInt(optionalEnv("SSH_PORT", "2222"), 10),
    host: optionalEnv("SSH_HOST", "0.0.0.0"),
    hostKeyPath: requireEnvInProd("SSH_HOST_KEY_PATH"),
    get isConfigured() {
      return Boolean(this.hostKeyPath);
    },
  },
  ```

- Update `.env.example` with:

  ```env
  SSH_PORT=2222
  SSH_HOST=0.0.0.0
  SSH_HOST_KEY_PATH=./ssh_host_key
  ```

### 4. Extend Audit Actions

- Open `packages/server/src/services/audit.ts`
- Extend `AuditAction` type:

  ```typescript
  export type AuditAction =
    | "login"
    | "logout"
    | "verify_start"
    | "verify_success"
    | "verify_fail"
    | "badge_generated"
    | "session_rotated"
    | "profile_updated"
    | "ssh_key_added"
    | "ssh_key_removed"
    | "ssh_auth_success"
    | "ssh_auth_fail"
    | "ssh_command";
  ```

### 5. Create SSH Keys Repository Service

- Create `packages/server/src/services/ssh-keys.ts`
- Define `SSHKeyService` interface with methods:
  - `addKey(userId, publicKey, name)` - Parse key, compute fingerprint, store
  - `findByFingerprint(fingerprint)` - Lookup key by SHA256 fingerprint
  - `listByUser(userId)` - Get all keys for a user
  - `deleteKey(keyId, userId)` - Remove a key (with ownership check)
  - `updateLastUsed(keyId)` - Update lastUsedAt timestamp
- Use Effect patterns matching existing services
- Export `SSHKeys` Context.Tag and `SSHKeysLive` Layer

### 6. Create SSH Authentication Service

- Create `packages/server/src/services/ssh-auth.ts`
- Define `SSHAuthService` interface:
  - `authenticateByKey(publicKey)` - Returns user if key matches, null otherwise
  - `getSSHClientInfo(client)` - Extract IP address from SSH connection
- Implement using SSHKeys and Users services
- Export `SSHAuth` Context.Tag and `SSHAuthLive` Layer

### 7. Create Terminal Formatters

- Create `packages/server/src/ssh-commands/formatters.ts`
- Implement functions:
  - `formatDashboard(user)` - ASCII representation of dashboard
  - `formatProfile(user)` - ASCII representation of public profile
  - `formatVerifyInfo(user)` - Verification status and next steps
  - `formatHelp()` - Available commands and usage
  - `formatError(message)` - Error display
- Use box-drawing characters for clean terminal output

### 8. Create Command Handlers

- Create `packages/server/src/ssh-commands/dashboard.ts`
  - Fetch current user data
  - Display verification status, repo count, stars, languages
- Create `packages/server/src/ssh-commands/profile.ts`
  - Accept username argument
  - Lookup and display public profile (only if verified)
- Create `packages/server/src/ssh-commands/verify.ts`
  - Show verification status
  - If not verified, display URL to initiate verification
- Create `packages/server/src/ssh-commands/help.ts`
  - List all available commands with descriptions
- Create `packages/server/src/ssh-commands/index.ts`
  - Export command registry mapping names to handlers

### 9. Create SSH Server

- Create `packages/server/src/ssh-server.ts`
- Implement `startSSHServer(config)` function:
  - Load host key from file
  - Create ssh2 Server instance
  - Handle `connection` event
  - On `authentication` event, use SSHAuth service
  - On `session` event, handle `exec` for command execution
  - Parse command and arguments
  - Route to appropriate command handler
  - Write output to session stream
  - Close session when done
- Return server instance for lifecycle management

### 10. Integrate SSH Server with Main Application

- Open `packages/server/src/index.ts`
- Import `startSSHServer` from `./ssh-server.js`
- After HTTP server starts, conditionally start SSH server:

  ```typescript
  if (config.ssh.isConfigured) {
    const sshServer = await startSSHServer();
    console.log(`✅ SSH server running on port ${config.ssh.port}`);
  }
  ```

- Add graceful shutdown handling for both servers

### 11. Register Services in ServicesLive

- Open `packages/server/src/services/index.ts`
- Import and add `SSHKeysLive` and `SSHAuthLive` to `ServicesLive`:

  ```typescript
  export const ServicesLive = Layer.mergeAll(
    AuditLive,
    SessionLive,
    GitHubOAuthLive,
    GitHubProfileLive,
    SSELive,
    SSHKeysLive,
    SSHAuthLive,
    UsersLive,
    VerificationLive,
  );
  ```

### 12. Generate SSH Host Key for Development

- Add instructions to README or create script:

  ```bash
  ssh-keygen -t ed25519 -f ssh_host_key -N ""
  ```

- Add `ssh_host_key*` to `.gitignore`

### 13. Validate Implementation

- Run `bun run lint && bun run format && bun run tsc && bun run test && bun run build`
- Test SSH connection locally:

  ```bash
  # Add your SSH key to the database via web UI first
  ssh -p 2222 localhost help
  ssh -p 2222 localhost dashboard
  ssh -p 2222 localhost profile <username>
  ```

- Verify audit logs contain SSH events

## Testing Strategy

### Unit Tests

- `ssh-keys.test.ts` - Key parsing, fingerprint generation, CRUD operations
- `ssh-auth.test.ts` - Authentication with valid/invalid keys
- `formatters.test.ts` - Output formatting for various user states
- `ssh-commands/*.test.ts` - Individual command handler tests

### Integration Tests

- SSH connection and authentication flow
- Command execution with real database
- Audit logging verification
- Error handling (invalid key, unknown command, permission denied)

### Edge Cases

- Malformed SSH public keys
- Keys with unusual algorithms (DSA, ECDSA)
- Very long key names
- Users with no keys
- Users with multiple keys
- Concurrent SSH sessions
- SSH connection from unknown IP

## Acceptance Criteria

- [ ] Users can add SSH public keys via web dashboard
- [ ] Users can connect via SSH using registered keys
- [ ] `ssh vets.dev help` displays available commands
- [ ] `ssh vets.dev dashboard` shows user's verification status and GitHub stats
- [ ] `ssh vets.dev profile <username>` shows public profile (verified users only)
- [ ] `ssh vets.dev verify` shows verification status and provides URL if not verified
- [ ] All SSH connections and commands are logged to audit_log
- [ ] Failed authentication attempts are logged
- [ ] SSH server starts/stops gracefully with HTTP server
- [ ] TypeScript compilation passes with no errors
- [ ] All existing tests continue to pass

## Validation Commands

Execute these commands to validate the task is complete:

- `bun run lint` - Verify code style
- `bun run format` - Ensure formatting
- `bun run tsc` - TypeScript type checking
- `bun run test` - Run all tests
- `bun run build` - Build the application
- `bun run db:migrate` - Ensure migrations apply cleanly

## Notes

### Security Considerations

- **Never store private keys** - Only public keys are stored
- **Validate key format** - Reject malformed or weak keys
- **Use SHA256 fingerprints** - Modern standard, not MD5
- **Rate limit auth attempts** - Prevent brute force
- **Log all attempts** - Audit trail for security review
- **Timeout idle connections** - Prevent resource exhaustion

### SSH Key Management Web UI (Future Phase)

The web dashboard needs UI to manage SSH keys:

- Add key: Form with name and public key textarea
- List keys: Table showing name, fingerprint, key type, last used
- Delete key: Confirmation dialog

This is out of scope for the initial SSH server implementation but noted for planning.

### Dependencies

- `ssh2` - SSH protocol implementation for Node.js/Bun
- `@types/ssh2` - TypeScript definitions

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| SSH_PORT | No | 2222 | SSH server port |
| SSH_HOST | No | 0.0.0.0 | SSH server bind address |
| SSH_HOST_KEY_PATH | Prod only | - | Path to SSH host private key |

### Terminal Output Example

```
╭─────────────────────────────────────────╮
│           vets.dev Dashboard            │
╰─────────────────────────────────────────╯

  @username
  ✓ Verified Veteran Developer
  Verified since January 2026

  ┌─────────────┬─────────────┬─────────────┐
  │ Repositories│    Stars    │  Languages  │
  ├─────────────┼─────────────┼─────────────┤
  │     42      │    156      │      5      │
  └─────────────┴─────────────┴─────────────┘

  Top Languages: TypeScript, Go, Python, Rust, Shell

  Badge Markdown:
  ![Verified Veteran](https://vets.dev/badge/username.svg)

  Run 'ssh vets.dev help' for available commands
```
