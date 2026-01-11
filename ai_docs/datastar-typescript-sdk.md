# Datastar TypeScript SDK Documentation

## Project Overview

The Datastar TypeScript SDK is the official library for constructing reactive web applications using Datastar. It implements the SDK specification and provides an abstract ServerSentEventGenerator class for runtime-specific implementations.

## Core Features

- **Multi-runtime compatibility**: Supports Node.js, Deno, and Bun environments
- **Full TypeScript support**: Complete type safety with IntelliSense
- **Server-Sent Events**: Real-time bidirectional communication between client and server
- **HTTP/1 server**: Currently supports HTTP/1; HTTP/2 support available through reverse proxy

## Installation

**Node.js:**

```sh
npm install @starfederation/datastar-sdk
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/node";
```

**Deno:**

```sh
import { ServerSentEventGenerator } from "npm:@starfederation/datastar-sdk/web";
```

**Bun:**

```sh
bun add @starfederation/datastar-sdk
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";
```

## Basic Usage Pattern

The SDK enables reading client signals and streaming DOM updates:

1. Extract signals from incoming requests
2. Establish SSE stream connection
3. Send signal patches and HTML element updates to client
4. Execute client-side scripts as needed

## Key API Methods

**Signal Management:**

- `readSignals(request)` — Parse client signal data
- `patchSignals(signals, options?)` — Update client signal store
- `removeSignals(signalKeys, options?)` — Delete signals

**DOM Operations:**

- `patchElements(elements, options?)` — Merge/replace HTML
- `removeElements(selector?, elements?, options?)` — Delete DOM nodes
- `executeScript(script, options?)` — Run JavaScript on client

**Streaming:**

- `stream(request, response, callback, options?)` — Initialize SSE stream with keepalive support

## Runtime Requirements

| Runtime | Minimum Version | Import Path |
|---------|-----------------|-------------|
| Node.js | 18+ | @starfederation/datastar-sdk/node |
| Deno | 1.30+ | npm:@starfederation/datastar-sdk/web |
| Bun | 1.0+ | @starfederation/datastar-sdk/web |

## Development

**Build:** `deno run -A build.ts`

**Test:** `bash test/run-all.sh` (requires Deno, Node.js, Bun, and Go)

**Requirements:** Deno, Node.js, Bun, and Go for running the complete test suite

## Custom Runtime Implementation

Extend the abstract `ServerSentEventGenerator` class to support additional runtimes by implementing constructor, `readSignals()`, `stream()`, and `send()` methods.

**License:** MIT
