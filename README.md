# Railway Ephemeral Ops

A dashboard for managing temporary containerized tasks on Railway.
Service automates the lifecycle of one-off jobs (called `mission` 🚀 in context of this app). It spins up a container, executes a command, and automatically deletes the service when the task is done or a timer expires.

### Core functionality

* **Auto-Termination (TTL):** Set containers to self-destruct after 5m, 15m, or 1h to prevent billing leaks. Includes a Manual Mode for indefinite runtime.
* **Custom Task Runner:** Deploy standard Docker images (Python, Node, Alpine) with custom shell commands (sh -c ...).
* **Live Observability:** Stream container logs in real-time within a built-in terminal view.
* **"Reliability":** Includes crash detection for invalid images and retry logic for failed cleanup operations.

### Use cases
* Scripts. Execute one-off data processing or maintenance scripts.
* Migrations. Run database migrations without a long-running service (if you are not scarred to pass environment variables in script, see `Future roadmap` section for more details).
* Testing. Quickly verify Docker image builds in the Railway environment.


## Local Setup

### Prerequisites

- **Node.js**: 18+
- **Railway Account**: [Sign up here](https://railway.app/)
- **Railway API Token**: [Generate one here](https://railway.app/account/tokens)
- **Railway Project**: Create a project where all missions will run

#### 1. Clone and install Dependencies

```bash
git clone git@github.com:mwoss/railway-ephemeral-ops.git
cd railway-ephemeral-ops
npm install
```

#### 2. Configure environment variables

Create a `.env.local` file from the example:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Railway credentials:

```env
# Railway API Token (Required)
# Get this from: https://railway.app/account/tokens
RAILWAY_API_TOKEN=your_railway_api_token_here

# Railway Project ID (Required)
# The ID of the project where services will be created
RAILWAY_PROJECT_ID=your_project_id_here

# Railway Environment ID (Required)
# The ID of the environment where services will be deployed
RAILWAY_ENVIRONMENT_ID=your_environment_id_here
```

#### 3. Generate GraphQL types

Generate TypeScript types from Railway's GraphQL schema:

```bash
npm run codegen
```

This creates `generated/graphql.ts` with all Railway API types.

#### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
```

Tests cover validation logic, mission store, and TTL calculations.

## Deployment (on Railway)
1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables:
   - `RAILWAY_API_TOKEN`
   - `RAILWAY_PROJECT_ID` (optional)
4. Deploy!

Railway should automatically detect Next.js and configure the build based on `railpack.json`.


## 🚧 Future roadmap & improvements
While this MVP validates the concept of "Ephemeral Task Runners" on Railway, 
moving this to a production-grade utility would require addressing several architectural and product-level enhancements.

### Production readiness & architecture decisions

* **Persistent Data Layer:**
  * Transition from In-Memory MissionStore to PostgreSQL.
  * Why: To support history retention across deployments, and crash recovery (if the app restarts, state is currently lost).

* **Atomic provisioning (transaction safety):**
  * Currently, we `createService` then `updateService`, and so on. If the update fails, we leave a "zombie" empty container.
  * Implement a rollback mechanism or wait for an atomic `createWithConfig` mutation (see "Platform Improvements").
  * Saga pattern with "job" persistence for clearing zombie state 

* **Reliable cleanup mechanism:**
  * Transition from purly in-memory background cleanup job, to reliable cleanup via persistent job store.

* **Event-driven updates (reduce polling):**
  * Replace `setInterval` client polling with GraphQL subscriptions for real-time log streaming.
  * Replace status sync mechanism with webhooks from Railway to push state changes (Success/Crash) instantly.

* **Smooth UI via websockets:**
  * Replace all frontend polling with bidirectional communication using websockets for real-time updates and smooth user experience.

* **Static Asset CDN:**
  * Offload static assets (Next.js build files) to a CDN rather than serving them via the Node.js runtime, ensuring better scalability under load.

### New product features ✨

* **Smart "sentinel" auto-shutdown:**
  * Instead of relying purely on Time-To-Live (TTL), wrap user commands in a shell script that echoes a magic string (e.g., MISSION_COMPLETE) upon process exit.
  * The app would detect this log line and trigger destruction immediately, saving costs on unused minutes.
  * Currently, Railway doesn't shut down container that exit, they leave them hanging

* **Service discovery & networking:**
  * Inject environment variables that allow these "one-off" containers to talk to other services in the project (e.g., DATABASE_URL).
  * Use Case: Running database migrations, generating reports from a read replica, etc.

* **Scheduled missions (cron):**
  * Add a "schedule" option to run missions automatically (e.g., run every night at 3 AM). Useful for backups or cleanup scripts.

* **Secret and environment variable injection:**
  * Allow users to select variables from the Railway Project variables to inject into the mission context securely or directly allow for passing new variable and secrets.

* **Script uploads:**
  * Instead of one-liners, allow users to upload whole files or even some static assets. The app would mount them as a volume or inject them as a script payload.

* **Project Switcher:** 
  * Allow the tool to spawn runners in different Railway projects/environments via a dropdown context switcher.

* **Support for Custom TTL input (specific minutes/hours) rather than just presets.**

### User experience

* **Docker registry integration:**
  * Add a search/autocomplete dropdown for Docker images (hub.docker.com API) to prevent typo-induced crash loops.

* **User auth and permissions:**
  * Implement user authentication and permissions (RBAC) to prevent unauthorized usage.
  * Yes, user can mine cryptos on your deployed publicly copy of this service 💸

* **Editor improvements:**
  * Add syntax highlighting for the "command" input field.

    
### Railway Platform improvements 🚂 (aka wishlist)

Delulu section. If I were on the Railway Engineering team, I would tackle these API enhancements to make tools like this native.

* **Extend `serviceCreate` mutation:**
  * Currently, we cannot pass a `startCommand` during creation. We have to create then update, which triggers two deploys.
  * Proposal: Allow `serviceCreate(input: { startCommand: "..." })` to allow atomic, single-deploy provisioning.

* **Ephemeral "job" primitive:**
  * First-class support for containers that are expected to die (Exit 0) without triggering a restart loop.
  * We can set `restartPolicyType` to `NEVER`, but it does not clean up service space

