#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface AuthResponse {
  status: boolean;
  message: string;
  errors: any;
  data: {
    fgp: string;
    token: string;
  };
}

interface CiceroResponse {
  message: string;
}

const serverInfo = {
  name: 'MCP Server PRD',
  version: '1.0.0',
};

const serverOptions = {
  capabilities: { logging: {}, tools: {} },
};

import fetch from 'node-fetch';

import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

class PrdMcpServer extends McpServer {
  private jwtToken: string | null = null;
  private userFingerprint: string | null = null;
  private tools: Map<string, Function> = new Map();

  constructor() {
    super(serverInfo, serverOptions);
    this.registerTools();
  }

  private registerTools(): void {
    this.tools.set(
      'login',
      async ({ username, password }: { username: string; password: string }) => {
        try {
          const response = await fetch("https://localhost/api/v1/auth/login", {
            agent: agent,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: username, password: password, token_2fa: "" }),
          });

          const data = (await response.json()) as AuthResponse;

          if (response.ok && data.status) {
            this.jwtToken = data.data.token;
            this.userFingerprint = data.data.fgp;
            return {
              content: [
                {
                  type: 'text',
                  text: 'Login successful. JWT and fingerprint obtained.',
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: `Login failed: ${data.message || 'Invalid credentials.'}`,
                },
              ],
            };
          }
        } catch (error: unknown) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          return {
            content: [
              {
                type: 'text',
                text: `Login failed due to network error: ${errorMessage}`,
              },
            ],
          };
        }
      }
    );

    this.tools.set(
      'get_secret_message',
      async () => {
        if (this.jwtToken && this.userFingerprint) {
          // In a real scenario, you would use these for an authenticated request
          // Simulate a call to a Cicero microservice with the Authorization header
          const ciceroServiceUrl = "https://localhost/api/v1/cicero/secret_message"; // Dummy URL
          try {
            const ciceroResponse = await fetch(ciceroServiceUrl, {
              agent: agent,
              method: "GET",
              headers: {
                "Authorization": `Bearer ${this.jwtToken}:${this.userFingerprint}`,
              },
            });

            if (ciceroResponse.ok) {
              const ciceroData = (await ciceroResponse.json()) as CiceroResponse;
              return {
                content: [
                  {
                    type: 'text',
                    text: `Secret message from Cicero: ${ciceroData.message}`,
                  },
                ],
              };
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Failed to retrieve secret message from Cicero: ${ciceroResponse.statusText}`,
                  },
                ],
              };
            }
          } catch (error: unknown) {
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
              errorMessage = error.message;
            }
            return {
              content: [
                {
                  type: 'text',
                  text: `Error calling Cicero service: ${errorMessage}`,
                },
              ],
            };
          }
        }
        return {
          content: [
            {
              type: 'text',
              text: 'Authentication required. Please login first.',
            },
          ],
        };
      }
    );
  }

  public async invokeTool(toolName: string, args: any): Promise<any> {
    const toolFunction = this.tools.get(toolName);
    if (toolFunction) {
      return toolFunction(args);
    } else {
      throw new Error(`Tool '${toolName}' not found.`);
    }
  }
}

  async function startServer() {
  const server = new PrdMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  yargs(hideBin(process.argv))
    .command(
      'login',
      'Authenticates a user with a provided username and password.',
      (yargs) => {
        yargs
          .option('username', {
            type: 'string',
            demandOption: true,
            description: 'The username for authentication (email address).',
          })
          .option('password', {
            type: 'string',
            demandOption: true,
            description: 'The password for authentication.',
          });
      },
      async (argv) => {
        const result = await server.invokeTool('login', {
          username: argv.username,
          password: argv.password,
        });
        process.stdout.write(JSON.stringify(result) + '\n');
      }
    )
    .command(
      'get_secret_message',
      'Retrieves a secret message, requiring prior authentication.',
      () => {},
      async () => {
        const result = await server.invokeTool('get_secret_message', {});
        process.stdout.write(JSON.stringify(result) + '\n');
      }
    )
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv;
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});