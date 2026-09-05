# Mini-Lambda Backend

A lightweight, containerized serverless function execution platform built with Node.js, Express, and Docker. This backend allows users to dynamically deploy and securely execute JavaScript code snippets inside isolated runtime environments.

## Features

- **Dynamic Code Deployment**: Accept raw JavaScript code via an API endpoint and generate unique execution routes.
- **Secure Sandboxing**: Automatically provisions ephemeral Docker containers for every function execution with strict constraints:
  - Network isolation (`--network none`) to prevent external internet access.
  - Memory caps (`--memory="64m"`) and CPU limits (`--cpus="0.5"`).
  - Automatic container cleanup (`--rm`).
- **Development Hot-Reloading**: Uses Nodemon mounted via Docker Compose for instant server updates during development.

## Prerequisites

- Docker and Docker Compose installed on your host machine.
- Node.js (v18+) if you intend to run or install packages locally outside of Docker.

## Project Structure

```text
mini-lambda/
├── functions/         # Storage directory for deployed function scripts
├── node_modules/      # Project dependencies
├── Dockerfile         # Node.js and Docker CLI container configuration
├── docker-compose.yml # Service orchestration and Docker socket mapping
├── index.js           # Main Express server application
└── package.json       # Project configuration and scripts

Getting Started

    Clone or open the project directory on your local machine.

    Build and launch the container using Docker Compose:
    Bash

    docker compose up --build

The server will start running at http://localhost:3000.
API Documentation
1. Deploy a Function

    Endpoint: POST /deploy

    Content-Type: application/json

    Request Body:
    JSON

{
  "code": "console.log('Hello from sandboxed code!');"
}

Response: Returns a confirmation message and a unique execution URL.
JSON

    {
      "message": "Function deployed successfully!",
      "url": "http://localhost:3000/run/<unique-id>"
    }

2. Execute a Function

    Endpoint: GET /run/:id

    Description: Triggers an isolated background Docker container to execute the specified function script and returns its captured standard output or error stream.
