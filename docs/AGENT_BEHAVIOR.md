# Gemini CLI Agentic Behavior

This document explains the agentic behavior of the Gemini CLI, detailing how it uses the Gemini model and a suite of tools to interact with your local environment and perform a wide range of tasks.

## High-Level Overview

The agentic functionality of the Gemini CLI is implemented through a modular architecture that separates the user interface, the core logic, and the tools. This design allows for a flexible and extensible system that can interact with the user's local environment to perform a wide range of tasks.

At a high level, the process works as follows:

1.  The user provides a prompt to the CLI.
2.  The CLI sends the prompt to the core.
3.  The core communicates with the Gemini API, providing the user's prompt and a list of available tools.
4.  The Gemini model can then choose to either respond directly to the user or to use one of the available tools to gather more information or perform an action.
5.  If the model chooses to use a tool, the core executes the tool and sends the result back to the model.
6.  The model then uses the tool's output to generate a final response, which is displayed to the user.

This entire process is managed by the `GeminiChat` class, which maintains the conversation history and orchestrates the interactions between the different components. In the non-interactive mode, the `runNonInteractive` function drives the agentic loop, while in interactive mode, the `AppWrapper` component and its children handle the user interface and the communication with the core.

## Key Components

The agentic workflow is made possible by the collaboration of several key components:

*   **`packages/cli` (The CLI):** This is the user-facing part of the application. It's responsible for:
    *   Parsing command-line arguments.
    *   Rendering the user interface (in interactive mode).
    *   Handling user input.
    *   Displaying the final output from the model.
    *   Prompting the user for confirmation before executing potentially harmful commands.

*   **`packages/core` (The Core):** This is the backend of the application. It's responsible for:
    *   Communicating with the Gemini API.
    *   Managing the conversation history.
    *   Registering and executing tools.
    *   Orchestrating the agentic workflow.

*   **`packages/core/src/tools` (The Tools):** These are individual modules that extend the capabilities of the Gemini model. Each tool has a specific function, such as:
    *   Reading and writing files (`ReadFileTool`, `WriteFileTool`).
    *   Listing directory contents (`LSTool`).
    *   Executing shell commands (`ShellTool`).
    *   Fetching content from the web (`WebFetchTool`).
    *   Searching the web (`WebSearchTool`).

*   **The Gemini API:** This is the large language model that powers the agent. It's responsible for:
    *   Understanding the user's prompt.
    *   Deciding whether to respond directly or to use a tool.
    *   Generating the final response to the user.

## Interaction Flow

Here is a step-by-step illustration of the interaction flow, from the user's initial prompt to the final response:

1.  **User Enters a Prompt:** The user types a prompt into the terminal, for example: `gemini "What are the files in the current directory?"`

2.  **CLI Sends Request to Core:** The `runNonInteractive` function in `packages/cli/src/nonInteractiveCli.ts` receives the prompt and initiates a chat session with the core.

3.  **Core Sends Request to Gemini API:** The `GeminiChat` class in `packages/core/src/core/geminiChat.ts` sends the user's prompt to the Gemini API, along with the function declarations of all the registered tools. These declarations act as a menu of options that the model can choose from.

4.  **Model Decides to Use a Tool:** The Gemini model analyzes the prompt and determines that it needs to list the files in the current directory to answer the user's question. It then returns a `FunctionCall` in its response, indicating that it wants to use the `ls` tool.

5.  **Core Executes the Tool:** The `runNonInteractive` function receives the `FunctionCall` and passes it to the `executeToolCall` function. `executeToolCall` then:
    a.  Looks up the `LSTool` in the `ToolRegistry`.
    b.  Validates the parameters (in this case, there are none).
    c.  Calls the `execute` method of the `LSTool`.

6.  **Tool Returns a Result:** The `LSTool`'s `execute` method runs the `ls` command and returns the list of files as a `ToolResult`.

7.  **Core Sends Tool Result to Gemini API:** The `runNonInteractive` function sends the `ToolResult` back to the Gemini API as a `FunctionResponse`.

8.  **Model Generates Final Response:** The Gemini model receives the list of files from the `LSTool` and uses it to generate a user-friendly response, such as: "The files in the current directory are: ..."

9.  **CLI Displays Response to User:** The `runNonInteractive` function prints the final response to the console.

This entire process happens seamlessly, making it appear as if the Gemini model itself is interacting with the file system. In reality, it's a carefully orchestrated collaboration between the CLI, the core, the tools, and the Gemini API.

## Extensibility

The Gemini CLI's agentic functionality is designed to be highly extensible, allowing developers to easily add new tools and expand its capabilities. This is achieved through a combination of a well-defined tool API and a dynamic tool discovery mechanism.

Here's how you can add a new tool to the system:

1.  **Create a New Tool Class:**
    *   Create a new TypeScript file in the `packages/core/src/tools` directory.
    *   In this file, define a new class that extends the `BaseTool` class.
    *   Implement the required properties and methods, including:
        *   `name`: A unique name for the tool.
        *   `description`: A clear and concise description of what the tool does.
        *   `parameterSchema`: A JSON schema that defines the parameters the tool accepts.
        *   `execute`: The method that contains the core logic of the tool.

2.  **Register the New Tool:**
    *   There are two ways to register a new tool:
        *   **Static Registration:** For built-in tools, you can simply add the new tool to the `ToolRegistry` in `packages/core/src/tools/tool-registry.ts`.
        *   **Dynamic Discovery:** For custom tools, you can use the `toolDiscoveryCommand` or `mcpServerCommand` settings in `settings.json`. These commands allow the Gemini CLI to discover and register tools at runtime.

3.  **Use the New Tool:**
    *   Once the new tool is registered, you can start using it in your prompts. The Gemini model will automatically be aware of the new tool and its capabilities, and it will be able to use it to answer your questions and perform tasks.

This extensibility is a key feature of the Gemini CLI, as it allows users to tailor the agent to their specific needs. Whether you're a developer who wants to add a new tool for a specific task or a user who wants to install a third-party extension, the Gemini CLI provides the flexibility to do so.
