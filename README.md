# AI Agent - LLM-Powered Autonomous Task Execution

![GitHub](https://img.shields.io/badge/license-ISC-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

A powerful and flexible autonomous AI agent that operates on a THINK → ACTION → OBSERVE → OUTPUT loop, capable of executing commands, managing files, and performing various tasks through natural language instructions.

## 🌟 Features

- 🧠 **Autonomous Reasoning**: Employs a structured thinking process before taking actions
- 🛠️ **Multiple Tool Integration**: Execute shell commands, read/write files, and more
- 🔄 **Feedback Loop**: Observes results and adapts subsequent actions
- ⚙️ **Multiple LLM Support**: Works with both Gemini and OpenAI models
- 📊 **Structured Output**: Returns information in consistent JSON format
- 🚀 **Framework Setup**: Built-in templates for quick setup of popular frameworks

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key and/or OpenAI API key

## 🚀 Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ai-agent
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with your API keys:

```
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## 💻 Usage

### Basic usage

```bash
node gemini.js "your task or question here"
```

Example:

```bash
node gemini.js "Create a React app using Vite and start the dev server"
```

### Using with OpenAI

```bash
node openai.js "your task or question here"
```

## 🔧 Available Tools

The agent can leverage the following tools:

| Tool             | Description                                        |
| ---------------- | -------------------------------------------------- |
| `executeCommand` | Execute shell commands (supports command chaining) |
| `writeFile`      | Create or modify files with specified content      |
| `readFile`       | Read and return file contents                      |
| `getweather`     | (Demo tool) Get weather information for a city     |

## 📝 Example Tasks

The agent is especially good at:

- **Creating new projects:** Setting up new web applications, APIs, etc.
- **Modifying code:** Making changes to existing files
- **Installation and configuration:** Setting up packages and tools
- **Development workflows:** Running dev servers, building applications, etc.

## 🔄 AI Agent Workflow

1. **START**: User provides a query
2. **THINK**: Agent analyzes the query and plans steps
3. **ACTION**: Agent executes a tool (command, file operation, etc.)
4. **OBSERVE**: Agent processes the result of the action
5. **THINK**: Agent analyzes the observation and decides next steps
6. **OUTPUT**: Agent provides final answer or continues with more actions

## 🛠️ Architecture

- **gemini.js**: Implementation using Google's Gemini API
- **openai.js**: Implementation using OpenAI's API
- **index.js**: Implementation using OpenAI's API
## 📈 Advanced Usage

### Custom System Messages

You can modify the system message in `system-message.js` to customize the agent's behavior.

### Error Handling

The agent provides detailed error messages and can recover from most errors by:

- Retrying failed requests
- Providing informative error messages
- Logging detailed debugging information

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Google Generative AI for the Gemini API
- OpenAI for their API
- All the open-source libraries used in this project

---

Created with ❤️ by Rudresh Vyas
