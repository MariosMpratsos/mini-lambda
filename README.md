# Mini-Lambda Backend

A lightweight, containerized **serverless function execution platform** built with **Node.js**, **Express**, and **Docker**.

The backend allows users to dynamically deploy JavaScript code snippets and securely execute them inside isolated Docker runtime environments.

## Features

### Dynamic Code Deployment

Users can submit raw JavaScript code through an API endpoint.

The backend:

1. Receives the JavaScript code.
2. Generates a unique function identifier.
3. Stores the function script.
4. Creates a unique execution route.
5. Allows the function to be executed through the generated URL.

---

### Secure Sandboxing

Every function execution runs inside an isolated Docker container.

The execution environment applies several restrictions:

* **Network isolation:** `--network none`
* **Memory limit:** `64 MB`
* **CPU limit:** `0.5 CPU`
* **Automatic cleanup:** `--rm`
* **Ephemeral execution:** Containers exist only for the duration of the function execution.

Example Docker execution configuration:

```bash
docker run \
  --rm \
  --network none \
  --memory="64m" \
  --cpus="0.5" \
  <image>
```

These restrictions help prevent deployed JavaScript code from accessing the external network or consuming excessive system resources.

---

### Development Hot Reloading

The project uses **Nodemon** together with Docker Compose for development.

The project directory is mounted into the container, allowing changes to the source code to be detected automatically without manually rebuilding the container.

---

## Prerequisites

Make sure the following software is installed:

* **Docker**
* **Docker Compose**
* **Node.js v18+** if you intend to install or run packages locally outside Docker.

Verify Docker:

```bash
docker --version
```

Verify Docker Compose:

```bash
docker compose version
```

Verify Node.js:

```bash
node --version
```

---

## Project Structure

```text
mini-lambda/
├── functions/
│   └── # Deployed function scripts
│
├── node_modules/
│   └── # Project dependencies
│
├── Dockerfile
├── docker-compose.yml
├── index.js
└── package.json
```

### Important Files

| File / Directory     | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `functions/`         | Stores deployed JavaScript functions                       |
| `Dockerfile`         | Defines the Node.js and Docker CLI environment             |
| `docker-compose.yml` | Defines the application container and Docker configuration |
| `index.js`           | Main Express server                                        |
| `package.json`       | Project dependencies and npm scripts                       |
| `node_modules/`      | Installed Node.js dependencies                             |

---

## Architecture

The basic execution flow is:

```text
                 ┌─────────────────┐
                 │      Client     │
                 └────────┬────────┘
                          │
                          │ HTTP
                          ▼
                 ┌─────────────────┐
                 │ Express Server  │
                 │    index.js     │
                 └────────┬────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
                 ▼                 ▼
          /deploy endpoint    /run/:id endpoint
                 │                 │
                 ▼                 ▼
          Store JavaScript    Create Docker
             function          container
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ Isolated Docker │
                          │    Runtime      │
                          ├─────────────────┤
                          │ Network: NONE   │
                          │ Memory: 64 MB   │
                          │ CPU: 0.5        │
                          └────────┬────────┘
                                   │
                                   ▼
                            Function Output
```

---

## Getting Started

### 1. Clone or Open the Project

Open the project directory in your terminal:

```bash
cd mini-lambda
```

---

### 2. Build and Start the Application

Build the Docker image and start the service:

```bash
docker compose up --build
```

Docker Compose will build the application container and start the Express server.

The server will be available at:

```text
http://localhost:3000
```

---

### 3. Run in the Background

To start the application without keeping the terminal attached:

```bash
docker compose up --build -d
```

---

### 4. Stop the Application

To stop the containers:

```bash
docker compose down
```

---

## API Documentation

### 1. Deploy a Function

Creates a new serverless function from raw JavaScript code.

#### Endpoint

```http
POST /deploy
```

#### Content-Type

```http
Content-Type: application/json
```

#### Request Body

```json
{
  "code": "console.log('Hello from sandboxed code!');"
}
```

The server stores the submitted JavaScript function and generates a unique execution ID.

#### Example Response

```json
{
  "message": "Function deployed successfully!",
  "url": "http://localhost:3000/run/<unique-id>"
}
```

The returned URL can then be used to execute the deployed function.

---

## 2. Execute a Function

Executes a previously deployed function inside an isolated Docker container.

#### Endpoint

```http
GET /run/:id
```

Where `:id` is the unique identifier generated during deployment.

For example:

```text
GET /run/abc123
```

The backend will:

1. Find the corresponding function.
2. Create an ephemeral Docker container.
3. Apply the configured resource restrictions.
4. Disable network access.
5. Execute the JavaScript code.
6. Capture the function's output.
7. Return the output to the client.
8. Automatically remove the container.

---

## Example Usage

### Deploy a Function

Using `curl`:

```bash
curl -X POST http://localhost:3000/deploy \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log('\''Hello from Mini-Lambda!'\'');"}'
```

Example response:

```json
{
  "message": "Function deployed successfully!",
  "url": "http://localhost:3000/run/abc123"
}
```

---

### Execute the Function

Use the generated URL:

```bash
curl http://localhost:3000/run/abc123
```

Example output:

```text
Hello from Mini-Lambda!
```

---

## Docker Isolation

Each function execution is performed in its own temporary Docker container.

The main restrictions are:

```text
Network
   │
   └── Disabled
       --network none

Memory
   │
   └── 64 MB
       --memory="64m"

CPU
   │
   └── 0.5 CPU
       --cpus="0.5"

Container
   │
   └── Automatically removed
       --rm
```

This creates a controlled environment for executing untrusted or dynamically submitted JavaScript code.

---

## Development

During development, Docker Compose can mount the project directory into the application container.

Nodemon monitors the source files and automatically restarts the Express server when changes are detected.

Typical development workflow:

```bash
docker compose up --build
```

Then modify:

```text
index.js
```

Nodemon detects the change and automatically restarts the server.

---

## Useful Docker Commands

### Start the Application

```bash
docker compose up
```

### Build the Application

```bash
docker compose build
```

### Build and Start

```bash
docker compose up --build
```

### Run in Background

```bash
docker compose up -d
```

### Stop the Application

```bash
docker compose down
```

### View Logs

```bash
docker compose logs
```

### Follow Logs

```bash
docker compose logs -f
```

### List Running Containers

```bash
docker ps
```

---

## Security Considerations

The platform is designed around container isolation and resource restrictions.

Each execution uses:

```text
--network none
--memory="64m"
--cpus="0.5"
--rm
```

However, Docker isolation alone should **not automatically be considered a complete security boundary for production execution of arbitrary untrusted code**.

A production implementation should additionally consider:

* Read-only filesystems
* Dropping Linux capabilities
* Running as a non-root user
* Process limits
* Execution timeouts
* Filesystem restrictions
* Container privilege restrictions
* Resource quotas
* Proper Docker daemon protection
* Additional sandboxing technologies

---

## Technologies

* **Node.js**
* **Express**
* **Docker**
* **Docker Compose**
* **Nodemon**
* **JavaScript**
* **REST API**

---

## Key Concepts Demonstrated

This project demonstrates several important backend and infrastructure concepts:

* REST API development
* Dynamic code execution
* Serverless function architecture
* Docker containerization
* Container isolation
* Resource limiting
* Network isolation
* Ephemeral containers
* Docker CLI integration
* Express.js
* Hot reloading
* API-based function deployment

---

## License

This project is intended for educational and development purposes.
