# Railway Documentation

## Table of Contents

1. [Railway Foundations](#railway-foundations)
2. [Services](#services)
3. [Getting Started Path](#getting-started-path)
4. [Builds and Build Configuration](#builds-and-build-configuration)
5. [Variables and Secrets Management](#variables-and-secrets-management)
6. [Database Services](#database-services)
7. [Health Checks and Deployment Readiness](#health-checks-and-deployment-readiness)
8. [Start Commands and Runtime Configuration](#start-commands-and-runtime-configuration)
9. [Dockerfile Deployment](#dockerfile-deployment)
10. [Languages and Frameworks Support](#languages-and-frameworks-support)
11. [Networking](#networking)
12. [Railway CLI Documentation](#railway-cli-documentation)
13. [Monitoring](#monitoring)

---

## Railway Foundations

### Introduction

Railway is a platform for building and deploying applications. The documentation begins by introducing core architectural concepts that form the foundation for working with the platform effectively.

### Core Components Overview

Railway's architecture consists of five primary building blocks:

#### Projects

A Project functions as "an application stack, or a system of related components." These encapsulate all necessary resources, including environments and variables.

#### Services

Services represent the individual parts that comprise a Project. Examples include frontend servers, backend APIs, message queues, and databases. They support configuration options such as variables, startup commands, restart policies, and volume mounts.

#### Variables

The platform treats variable management as "an essential part of development operations." Variables can be scoped at both the Service and Environment levels.

#### Environments

These logical groupings exist within Projects and facilitate separation between production and development contexts.

#### CLI

The command-line interface serves development workflows, enabling local service execution and repository deployment using Railway-stored variables.

---

## Services

### Overview

"A Railway Service is a deployment target for your application." Changes made to services are collected in staged changes that require review and deployment to take effect.

### Service Creation

Services are created via the `New` button in the project canvas or through the command palette (`CMD + K` on Mac, `Ctrl + K` on Windows).

### Deployment Sources

Railway supports three deployment approaches:

#### GitHub Repository Deployment

Connect a GitHub repo by selecting `Connect Repo` in the Service Source settings. When new commits push to the linked branch, Railway automatically builds and deploys the updated code. This requires linking your Railway account to GitHub through the Railway App configuration.

#### Public Docker Images

Deploy public Docker images by specifying the image path. Supported registries include:

- **Docker Hub**: `bitnami/redis`
- **GitHub Container Registry**: `ghcr.io/railwayapp-templates/postgres-ssl:latest`
- **GitLab Container Registry**: `registry.gitlab.com/gitlab-cicd15/django-project`
- **Microsoft Container Registry**: `mcr.microsoft.com/dotnet/aspire-dashboard`
- **Quay.io**: `quay.io/username/repo:tag`

Railway monitors Docker images for updates. When available, an update button appears. Automatic updates can be configured with scheduled maintenance windows.

#### Private Docker Images

"Private Docker registry deployments require the Pro plan." Provide authentication credentials (username, password) during creation. GitHub Container Registry deployments require a personal access token (classic).

### Local Directory Deployment

Deploy local directories using the CLI:

1. Create an Empty Service during service creation
2. Navigate to your directory in Terminal
3. Run `railway link` to connect to your Railway project
4. Run `railway up` and select your empty service as the target

### Service Configuration

Access settings by clicking the service tile and navigating to the Settings tab. Configure the Service Source here to update deployment sources.

### Additional Features

- **Service Icons**: Customize icons by right-clicking the service, selecting `Update Info`, then `Icon`
- **Deployment Approvals**: Users without linked Railway accounts trigger approval prompts
- **Storage**: Services include 10GB ephemeral storage; add volumes for persistent data or additional capacity
- **Deletion**: Remove services via project settings in the danger section

### Monitoring

Logs, metrics, and usage data are available through the monitoring guides.

---

## Getting Started Path

The documentation indicates that subsequent sections cover:
- Project creation and management
- Service configuration
- Variable setup and management
- Environment configuration
- Data persistence through volumes
- CLI installation and usage

For users seeking rapid onboarding, the documentation references a quickstart guide as an alternative learning path.

---

## Builds and Build Configuration

### Overview

Railway streamlines the deployment process by offering zero-configuration builds while providing extensive customization options. The platform enables developers to control various aspects of how services are constructed and deployed.

### Build Concepts

#### Railpack

"Railpack analyzes your code and generates optimized container images." This represents Railway's current build solution for automatic container generation.

#### Nixpacks

"Nixpacks is a legacy builder. (Deprecated)" This tool is no longer recommended for new projects and has been superseded by Railpack.

### Build Configuration

Railway offers multiple configuration approaches to customize the build process. Developers can control:
- The build command executed
- The root directory for building
- Build trigger conditions
- Other build-related parameters

### Dockerfiles

If your repository already contains a Dockerfile, Railway will recognize and utilize it automatically for building your service. This allows teams to leverage existing containerization definitions without modification.

### Key Takeaway

Railway balances simplicity with flexibility—projects work immediately without configuration, yet comprehensive controls exist for those requiring custom build behavior.

---

## Variables and Secrets Management

### Overview

"Variables provide a way to manage configuration and secrets across services in Railway." They're accessible during build processes, running deployments, CLI commands, and local shell sessions.

### Types of Variables

#### Service Variables

Individual service configuration is managed through a service's "Variables" tab. You can manually enter variables or use the Raw Editor to paste `.env` or JSON-formatted content.

**Suggested Variables Feature**: Railway automatically detects and suggests environment variables from repository files matching these patterns:
- `.env`
- `.env.example`
- `.env.local`
- `.env.production`
- Other `.env.<suffix>` files in the root directory

#### Shared Variables

"Shared variables help reduce duplication of variables across multiple services within the same project." Access them via Project Settings → Shared Variables, where you can add variables and distribute them to specific services.

#### Reference Variables

These variables reference other variables using Railway's template syntax:

- **Shared variables**: `${{ shared.VARIABLE_KEY }}`
- **Other service variables**: `${{SERVICE_NAME.VAR }}`
- **Same service variables**: `${{ VARIABLE_NAME }}`

An autocomplete dropdown assists with creating reference variables in the dashboard.

### Sealed Variables

"Railway provides the ability to seal variable values for extra security. When a variable is sealed, its value is provided to builds and deployments but is never visible in the UI."

**Key limitations**:
- Cannot be unsealed once sealed
- Unavailable via CLI (`railway variables`, `railway run`)
- Not copied to PR environments, duplicated environments, or external integrations
- Hidden from environment sync diffs

### Railway-Provided Variables

Common built-in variables include:
- `RAILWAY_PUBLIC_DOMAIN`
- `RAILWAY_PRIVATE_DOMAIN`
- `RAILWAY_TCP_PROXY_PORT`

### Multiline Variables

"Press `Control + Enter` (`Cmd + Enter` on Mac) in the variable value input field to add a newline, or simply type a newline in the Raw Editor."

### Local Development

Use the Railway CLI to run code locally with configured variables: `railway run <command>`

### External Integrations

- **Heroku**: Import config variables through the service variables command palette
- **Doppler**: Sync secrets via Doppler's maintained Railway integration

---

## Database Services

### Overview

Railway's platform enables deployment of various database services through flexible primitives. The platform supports both custom database implementations and pre-built templates.

### Key Features

#### Essential Infrastructure

Railway provides foundational capabilities for database operations:

- **Volumes**: "for persisting your data"
- **TCP Proxy**: enables connectivity to your database from external networks

#### Available Templates

The platform offers a marketplace with numerous database options. Railway maintains official templates for widely-used systems:
- PostgreSQL
- MySQL
- MongoDB
- Redis

Additional community and third-party templates are available through the marketplace.

### Important Considerations

Railway's database offerings are classified as unmanaged services. This means users bear responsibility for:
- Performance optimization specific to their use case
- Maintenance and configuration management
- Data backup and recovery procedures

---

## Health Checks and Deployment Readiness

### Overview

Railway implements health checks to facilitate zero-downtime deployments by confirming that newly deployed services are operational before accepting traffic.

### Health Endpoint Configuration

Your web server must expose a dedicated endpoint returning HTTP 200 when ready. Railway waits for this status code before routing traffic to the new deployment.

> "Ensure your webserver has an endpoint (e.g. `/health`) that will return an HTTP status code of 200 when the application is live and ready."

**Important:** Health check monitoring ceases once the deployment goes live.

### Port Configuration

Railway injects a `PORT` environment variable that your application should listen on. This same port is used for health checks.

If your application uses target ports instead, manually set a `PORT` variable to tell Railway which port to check, otherwise you risk `service unavailable` errors.

### Timeout Settings

The default health check timeout is **300 seconds (5 minutes)**. If your application doesn't return 200 within this window, the deployment fails.

Adjust the timeout via the service settings page or by setting the `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` environment variable.

### Important Limitations

- **Volume-attached services:** Experience brief downtime during redeployment due to single-mount constraints, even with health checks enabled.
- **Hostname restrictions:** Health checks originate from `healthcheck.railway.app`. Applications blocking by hostname must allowlist this domain.
- **Continuous monitoring:** Not supported—health checks run only at deployment start.

---

## Start Commands and Runtime Configuration

### Overview

A start command executes the process that runs your deployment's code (such as `python main.py` or `npm run start`). Railway intelligently detects and configures this automatically based on your codebase.

### Automatic Configuration

Railway analyzes your project and sets appropriate start commands by default. Refer to the build and start commands reference for implementation details.

### Manual Override

You may customize the start command for specific scenarios, including deploying multiple projects within a monorepo structure.

### Deployment Type Considerations

#### Dockerfile/Image Deployments

The custom start command replaces the image's `ENTRYPOINT` using exec form. However, environment variables require special handling:

> "If you need to use environment variables in the start command for services deployed from a Dockerfile or image you will need to wrap your command in a shell"

Example wrapper:
```shell
/bin/sh -c "exec python main.py --port $PORT"
```

This wrapper is necessary because exec form doesn't support variable expansion.

#### Railpack Deployments

The start command runs within a shell process, which means you can use environment variables directly without additional wrapping.

### Default Behavior

For Dockerfile-based deployments, the start command defaults to the `ENTRYPOINT` and/or `CMD` specified in your Dockerfile unless overridden.

---

## Dockerfile Deployment

### Automatic Detection

Railway automatically detects and uses a `Dockerfile` located at the service root. When this occurs, you'll see this confirmation message:

> "Using detected Dockerfile!"

### Custom Dockerfile Paths

To specify a non-standard filename or location, set the `RAILWAY_DOCKERFILE_PATH` variable in your service configuration.

Examples:
- Alternative filename: `RAILWAY_DOCKERFILE_PATH=Dockerfile.origin`
- Different directory: `RAILWAY_DOCKERFILE_PATH=/build/Dockerfile`

This configuration can also be defined through [config as code](/guides/config-as-code).

### Build-Time Environment Variables

To access Railway's injected environment variables during the build process, declare them using the `ARG` command in your Dockerfile:

```dockerfile
ARG RAILWAY_SERVICE_NAME
RUN echo $RAILWAY_SERVICE_NAME
```

Ensure variables are declared in the appropriate build stage where they're needed.

### Cache Mount Support

Railway supports Docker cache mounts with this format:

```plaintext
--mount=type=cache,id=s/<service id>-<target path>,target=<target path>
```

**Important:** Environment variables cannot be used in cache mount IDs due to syntax limitations.

#### Finding Target Paths

Consult the [Nixpacks provider files](https://github.com/railwayapp/nixpacks/tree/main) for your language to identify the correct cache directory variable.

### Docker Compose Integration

Drag and drop your Docker Compose file onto your project canvas to auto-import services and mounted volumes as staged changes.

---

## Languages and Frameworks Support

Railway provides deployment guides for a comprehensive range of programming languages and frameworks.

### JavaScript / TypeScript

The platform supports numerous JavaScript and TypeScript frameworks, including:
- Backend frameworks: "Fastify," "Express," and "Nest.js"
- Full-stack solutions: "Next.js" and "Remix"
- Frontend frameworks: "React," "Vue," "Angular," and "SvelteKit"
- Static site generators and modern frameworks: "Astro," "Solid," and "Nuxt"

### Additional Language Support

Railway offers deployment documentation for several other languages:

- **Python**: "FastAPI," "Flask," and "Django"
- **PHP**: "Laravel" and "Symfony"
- **Java**: "Spring Boot"
- **Go**: "Beego" and "Gin"
- **Ruby**: "Rails"
- **Rust**: "Axum" and "Rocket"
- **Elixir**: "Phoenix" (standard and with Distillery)
- **Scala**: "Play Framework"
- **Clojure**: "Luminus"

---

## Networking

### Overview

Railway provides connectivity features to help establish communication between services and expose applications to the internet.

### Networking Features

#### Public Networking

"Public networking refers to exposing your application to the public network."
Railway simplifies making applications accessible to external users.

#### Private Networking

"Private networking refers to restricting communication of your services to a private network, inaccessible to the public internet."
Every Railway project automatically receives its own isolated private network for secure inter-service communication.

#### TCP Proxy

This feature "enables proxying public traffic to a TCP service, like a Database," allowing remote connections to database services from anywhere on the internet without directly exposing them.

### Purpose

These networking capabilities work together to facilitate optimal connectivity experiences, whether you need services to communicate internally or require external accessibility.

---

## Railway CLI Documentation

### Installation Methods

The Railway CLI supports multiple installation approaches across different operating systems:

- **Homebrew (macOS)**: `brew install railway`
- **npm (Node.js ≥16)**: `npm i -g @railway/cli`
- **Shell Script (Unix-like systems)**: `bash <(curl -fsSL cli.new)`
- **Scoop (Windows)**: `scoop install railway`
- **Pre-built binaries** available via GitHub releases
- **Source compilation** through the open-source repository

### Authentication

Users must authenticate before accessing Railway projects through the CLI:

```bash
railway login
```

This "opens a new tab in your default browser to the authentication page" and completes the login flow automatically.

#### Browserless Authentication

For environments without browser access (such as SSH sessions), use the `--browserless` flag to authenticate with a pairing code.

#### Token-Based Authentication

For CI/CD pipelines and automated environments, authentication occurs via environment variables:

- `RAILWAY_TOKEN`: Project-level token for deployment and service operations
- `RAILWAY_API_TOKEN`: Account or Team token for broader CLI functionality

Project tokens enable deployment and log viewing but restrict actions like creating new projects. Account tokens provide broader access across workspaces.

### Common CLI Commands

#### Project Management

| Command | Purpose |
|---------|---------|
| `railway link` | "Associate a project and environment with your current directory" |
| `railway init` | Create a new project from the command line |
| `railway service` | Link a specific service to the current directory |

#### Local Development

- **`railway run <cmd>`**: Execute commands locally with remote environment variables
- **`railway shell`**: "Open a new local shell with Railway environment variables"
- **`railway environment`**: Switch between project environments

#### Deployment

```bash
railway up              # Deploy with live logs
railway up --detach    # Upload and return immediately
```

#### Database Provisioning

```bash
railway add  # Prompt to select and provision database services
```

#### Logout

```bash
railway logout
```

### SSH Access to Deployed Services

Railway SSH enables interactive shell sessions within deployed containers for debugging, database operations, and system administration tasks.

#### Setup Requirements

1. Railway CLI installed locally
2. Authenticated Railway account (`railway login`)
3. An actively running service

#### Basic Usage

Copy the command from the Railway dashboard or use:

```bash
railway ssh --project=<id> --environment=<id> --service=<id>
```

Or link first: `railway link` followed by `railway ssh`

#### Single Command Execution

```bash
railway ssh -- ls  # Run command and exit without interactive session
```

#### How It Works

"Railway SSH does not use the standard SSH protocol (sshd). Instead, it establishes connections via a custom protocol built on top of websockets." This approach requires no SSH daemon configuration and works with any container containing a shell.

Security advantages include no public SSH exposure, authentication through Railway's infrastructure, and service isolation.

#### Limitations

**File Transfer**: "No SCP support for copying files between local and remote systems" or traditional sFTP functionality. Workarounds include deploying a file browser service, using curl for uploads, or creating temporary secure endpoints.

**SSH Protocol Features**: No tunneling, port forwarding, or IDE integration (VS Code Remote-SSH). Use Tailscale subnet router for private service access instead.

**Container Compatibility**: Scratch images and minimal containers may lack shells or debugging tools, preventing SSH access.

### CLI Reference Commands

#### Add
Incorporates a service into your project. Supports databases (Postgres, MySQL, Redis, MongoDB) or custom services via Docker images and repositories.

Key options:
- `-d, --database`: Specify database type
- `-s, --service`: Set service name
- `-r, --repo`: Link repository
- `-i, --image`: Connect Docker image
- `-v, --variables`: Define environment variables

#### Init
"Create a new project" from the command line with optional name and workspace specifications.

#### Link
"Associate existing project with current directory" or specify a project ID to connect your workspace to Railway.

#### Login
Authenticates your account. Supports standard browser-based login or browserless mode for SSH sessions and similar environments.

#### Logout
Terminates your Railway session.

#### Up
"Upload and deploy project from the current directory" with options for detached deployment, CI mode, and service/environment targeting.

#### Down
"Remove the most recent deployment" with optional confirmation skipping.

#### Redeploy
"Redeploy the latest deployment of a service" without requiring code changes.

#### Deploy
"Provisions a template into your project" with template and variable configuration options.

#### Status
Displays "information about the current project" including deployment status.

#### Logs
"View the most-recent deploy's logs" with separate build and deployment log viewing.

#### List
"List all projects in your Railway account" with JSON output support.

#### Whoami
"Get the current logged in user" to verify authentication status.

#### Open
"Open your project dashboard" in the default browser.

#### Docs
"Open Railway Documentation in default browser" for quick access to guides.

#### Service
"Link a service to the current project" for direct service targeting.

#### Connect
"Connect to a database's shell" (psql, mongosh, redis-cli, mysql) for direct database interaction.

#### Variables
"Show variables for active environment" with options to set or display in key-value format.

#### Run
"Run a local command using variables from the active environment" with automatic database variable injection.

#### Shell
"Open a subshell with Railway variables available" for direct environment access.

#### SSH
"Connect to a service via SSH" with options for interactive sessions or direct command execution.

#### Environment
Manages project environments through subcommands:
- `new`: Create environment with optional duplication
- `delete`: Remove environment

#### Domain
Creates domains for services, supporting both custom domains and generated Railway domains.

#### Volume
"Manage project volumes" through list, add, delete, update, attach, and detach operations.

#### Completion
"Generate completion script" for bash, fish, elvish, powershell, and zsh.

#### Unlink
"Disassociate project from current directory" to disconnect workspace from Railway.

### Global Options

Most commands support:
- `--json`: Output formatted as JSON
- `-h, --help`: Display help information
- `-V, --version`: Show version number

### Best Practices for CLI Usage

- Treat SSH as a debugging tool rather than permanent change mechanism
- Avoid storing sensitive data during SSH sessions
- Monitor SSH access to services
- Automate routine administrative tasks through proper deployments

### Additional Resources

The CLI is open source on GitHub, with full API documentation available in the CLI reference guide.

---

## Monitoring

### Overview

Railway provides monitoring capabilities to help you debug issues and track performance across deployments.

### Key Monitoring Components

#### Logs and Metrics

"Logs are the lines sent to `stdout` or `stderr` from your application code." Additionally, "Metrics represent measured system level performance, like CPU and RAM." The platform surfaces both types of data for your services.

#### Notifications

"An essential part of monitoring is through proactive notifications." You can configure webhooks to receive alerts whenever your deployed services experience state changes.

### What's Covered

The documentation addresses:
- Accessing and analyzing service logs and metrics
- Debugging issues through observability data
- Performance tracking between code deployments
- Setting up notifications for deployment state transitions

---

## Deployment Overview

Railway enables modification of run behavior and provides actions like rollbacks and service restarts.

### Auto Deploys

When connected to GitHub, Railway automatically builds and deploys code upon pushing changes to the linked branch.

### Regional Deployments

Services deploy to preferred regions by default, with options for multi-region optimization.

### Scaling

The platform offers automatic vertical scaling and horizontal scaling through replicas.

### Monorepos

Special configuration is needed to specify monorepo structure for deployment.

### Scheduled Jobs

Cron jobs can be configured to execute code on schedules.

### Usage Optimization

Tools exist to set usage limits and enable auto-sleep for inactive deployments.

---

## Key Takeaways for Deployment on Railway

1. **Zero-Configuration Builds**: Railway automatically detects your technology stack and builds optimized containers
2. **Flexible Deployment Sources**: Deploy from GitHub, Docker images, or local directories
3. **Environment Management**: Separate production and development with multiple environments
4. **Built-in Databases**: Easy PostgreSQL, MySQL, MongoDB, and Redis provisioning
5. **Health Checks**: Configure health endpoints for zero-downtime deployments
6. **CLI-Driven Workflow**: Develop locally with `railway run` and deploy with `railway up`
7. **Secrets Management**: Sealed variables ensure sensitive data stays secure
8. **Private Networking**: Services communicate securely within a private network
9. **SSH Access**: Debug deployed services with `railway ssh`
10. **Automatic Updates**: Docker image monitoring and automatic updates available

---

## Getting Help

- Railway documentation is available at https://docs.railway.com/
- CLI documentation and API reference available through `railway docs`
- Community support through Railway's official channels
- Enterprise features for advanced use cases
