Here is an updated guide to setting up a modern MCP (Model Context Protocol) server using TypeScript and Node.js.

### Core Concepts of a Modern MCP Server

The Model Context Protocol (MCP) is designed as a standardized way for AI models (like large language models) to interact with external tools and data sources. An MCP server's primary role is to expose these tools and their schemas, making them discoverable and usable by an MCP client or host.

The key components of a modern MCP setup with TypeScript and Node.js are:

*   **`@model-context/server`**: The core npm package for building an MCP server.
*   **`zod`**: A TypeScript-first schema declaration and validation library, used to define the inputs and outputs of your tools.
*   **Transports**: These define how the server communicates. The most common for local development is the `StdioServerTransport`, which uses standard input/output.
*   **TypeScript and Node.js**: The underlying runtime and language for building the server.

### Step 1: Project Initialization

First, set up your Node.js project.

1.  **Create a project directory:**
    ```bash
    mkdir my-mcp-server
    cd my-mcp-server
    ```

2.  **Initialize the project with npm:** This creates your `package.json` file.
    ```bash
    npm init -y
    ```

### Step 2: Install Latest Dependencies

Next, install the necessary packages. As of mid-2025, you should use the scoped package `@model-context/server`.

```bash
# Install core dependencies
npm install @model-context/server zod

# Install development dependencies for TypeScript
npm install -D typescript @types/node ts-node nodemon
```

*   **`@model-context/server`**: The official server SDK.
*   **`zod`**: For robust schema definition.
*   **`typescript`**: The TypeScript compiler.
*   **`@types/node`**: Provides TypeScript type definitions for Node.js.
*   **`ts-node`**: Allows you to run TypeScript files directly without pre-compiling, great for development.
*   **`nodemon`**: Automatically restarts your server when you make changes.

### Step 3: Configure TypeScript (`tsconfig.json`)

A well-configured `tsconfig.json` file is crucial. This configuration is up-to-date for modern Node.js projects.

Create a file named `tsconfig.json` in your project's root with the following content:

```json
{
  "compilerOptions": {
    "target": "ES2022",                          /* Modern ECMAScript target */
    "module": "NodeNext",                       /* Use the latest Node.js module system */
    "moduleResolution": "NodeNext",             /* How modules get resolved */
    "outDir": "./dist",                         /* Where to output compiled JS */
    "rootDir": "./src",                         /* Where your TS source code is */
    "strict": true,                             /* Enable all strict type-checking options */
    "esModuleInterop": true,                    /* Enables compatibility with CommonJS modules */
    "skipLibCheck": true,                       /* Skip type checking of declaration files */
    "forceConsistentCasingInFileNames": true,   /* Disallow inconsistently-cased references to the same file */
    "sourceMap": true                           /* Generate source maps for debugging */
  },
  "include": ["src/**/*"],                      /* Which files to include in compilation */
  "exclude": ["node_modules"]                   /* Which files to exclude */
}
```
This configuration uses `NodeNext` for `module` and `moduleResolution`, which is the current best practice for Node.js projects.

### Step 4: Add Scripts to `package.json`

To streamline your development workflow, add the following scripts to your `package.json` file.

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "A modern MCP Server",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --watch src --exec ts-node src/index.ts"
  },
  "keywords": ["mcp", "ai"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@model-context/server": "^0.1.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.12.12",
    "nodemon": "^3.1.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```
*   `"type": "module"`: This is important. It tells Node.js to treat `.js` files as ES modules, aligning with modern TypeScript and JavaScript practices.
*   `dev`: This command uses `nodemon` and `ts-node` to give you a live-reloading development server, which is a significant quality-of-life improvement.

### Step 5: Implement the MCP Server (`src/index.ts`)

Now, create your main server file. Create a `src` directory and a file named `index.ts` inside it.

```bash
mkdir src
touch src/index.ts
```

Add the following updated code to `src/index.ts`.

```typescript
import { Server } from '@model-context/server';
import { StdioServerTransport } from '@model-context/server/stdio';
import { z } from 'zod';

// 1. Initialize the MCP Server with metadata
const server = new Server({
  name: 'my-awesome-tool-server',
  version: '0.1.0',
  // Optional but recommended: provide a description for the server itself
  description: 'A server that provides a set of useful tools.',
});

// 2. Define a simple tool
const addTool = server.tool(
  // The name of the tool, must be a machine-readable string
  'add',
  // A human-readable description of what the tool does
  'A tool that calculates the sum of two numbers.',
  // The input schema using Zod. 'describe' is used to provide descriptions
  // for the LLM to understand each parameter.
  z.object({
    a: z.number().describe('The first number to add.'),
    b: z.number().describe('The second number to add.'),
  }),
  // The async function that executes the tool's logic
  async (params) => {
    const sum = params.a + params.b;
    console.log(`[Tool:add] Calculating ${params.a} + ${params.b} = ${sum}`);
    return { sum };
  }
);

// 3. Define a more complex tool that could fetch data
const getUserProfile = server.tool(
  'getUserProfile',
  'Fetches a user profile from a dummy database based on their ID.',
  z.object({
    userId: z.string().describe("The unique identifier for the user."),
  }),
  async ({ userId }) => {
    console.log(`[Tool:getUserProfile] Fetching profile for user: ${userId}`);
    // In a real application, you would fetch this from a database or API
    const fakeDatabase: Record<string, any> = {
      'user-123': { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      'user-456': { name: 'Bob', email: 'bob@example.com', role: 'user' },
    };
    const profile = fakeDatabase[userId];
    if (!profile) {
      // It's good practice to handle cases where the data isn't found
      throw new Error(`User with ID '${userId}' not found.`);
    }
    return profile;
  }
);

// 4. Start the server using a transport layer
// StdioServerTransport is common for local development and CLIs
server.start(new StdioServerTransport());

console.log(`✅ MCP server '${server.name}' started successfully.`);
console.log('Available tools:');
// Listing the registered tools can be helpful for debugging
for (const tool of server.getTools()) {
  console.log(`- ${tool.name}: ${tool.description}`);
}
console.log('Listening for MCP requests over stdio...');

```

### How to Run Your Server

With the new scripts in your `package.json`, running the server is simple:

*   **For development:** This command will watch for file changes in the `src` directory and automatically restart the server.
    ```bash
    npm run dev
    ```

*   **For production:** First, build the JavaScript from your TypeScript source, then run the output.
    ```bash
    npm run build
    npm start
    ```

This updated guide provides a solid, modern foundation for building your MCP server. It uses current best practices for package management, TypeScript configuration, and server implementation. From here, you can continue to add more complex tools, integrate with other APIs, and explore different MCP transports.
