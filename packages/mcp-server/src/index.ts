
import { Server, StdioServerTransport } from '@modelcontextprotocol/sdk';
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
