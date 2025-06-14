import OpenAI from "openai";
import dotenv from "dotenv";
import { exec } from "node:child_process";
import { writeFileSync, readFileSync } from "fs";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_APIKEY,
});

// TOOL DEFINITIONS
const getweather = (city) => `${city} has 42°C. ☀️ Stay hydrated!`;

const writeFile = (input) => {
  const [path, content] = input.split("|||");
  try {
    writeFileSync(path.trim(), content.trim());
    return `✅ File written to ${path.trim()}`;
  } catch (err) {
    return `❌ Failed to write file: ${err.message}`;
  }
};

const readFile = (path) => {
  try {
    const data = readFileSync(path.trim(), "utf-8");
    return `📄 Content of ${path.trim()}:\n${data}`;
  } catch (err) {
    return `❌ Failed to read file: ${err.message}`;
  }
};

const executeCommand = (command) => {
  return new Promise((resolve) => {
    exec(
      command,
      { shell: "/bin/bash", timeout: 20000 },
      (err, stdout, stderr) => {
        if (err) return resolve(`❌ Error: ${err.message}`);
        resolve(`✅ stdout:\n${stdout.trim()}\n⚠️ stderr:\n${stderr.trim()}`);
      }
    );
  });
};

const tools = {
  getweather,
  writeFile,
  readFile,
  executeCommand,
};

// SYSTEM MESSAGE
const SYSTEM_MESSAGE = `
You are a helpful autonomous assistant operating in a THINK → ACTION → OBSERVE → THINK → OUTPUT loop to resolve user queries.

🧠 Modes:
- START: Only the **user** gives START input. You **must never output** START.
- THINK: Reflect on the problem. You must THINK **at least 3–4 steps** before taking any ACTION. THINK deeply until all steps are clear.
- ACTION: If a tool is needed, perform an ACTION with the correct tool and input.
- OBSERVE: Wait for the result of the ACTION (tool output).
- OUTPUT: Provide the final response to the user only after sufficient THINK steps and OBSERVE if applicable.

🔁 Execution Loop:
1. User sends a START prompt.
2. You THINK through the solution step-by-step.
3. If needed, perform an ACTION using one of the tools.
4. Wait for OBSERVE from the tool output.
5. THINK again based on the observation.
6. Finally, give an OUTPUT only if the task is complete.

⚠️ Strict Rules:
- Only respond using a **single valid JSON object** in each step.
- Never respond with Markdown or plain text.
- Never output multiple JSONs in one response.
- Never use unavailable tools.
- Never output a START step yourself — only THINK, ACTION, OBSERVE, or OUTPUT.
- After OBSERVE, you **must THINK again** before OUTPUT.
- Use the exact output format shown below — no deviations.

🛠️ Available Tools:
- getweather(city: String): Returns mock weather data.
- executeCommand(command: String): Executes shell commands. Use `&&` to chain.
- writeFile(path: String ||| content: String): Writes content to a file.
- readFile(path: String): Reads content from a file.

📤 Valid JSON Output Formats:
{"step": "THINK", "content": "..."}
{"step": "ACTION", "Tool": "toolName", "input": "...", "content": "..."}
{"step": "OBSERVE", "content": "..."}
{"step": "OUTPUT", "content": "..."}

📦 Sample Tools You Can Use:
- React + Vite: \`npm create vite@latest my-app -- --template react && cd my-app && npm install && npm run dev\`
- React Native (Expo): \`npx create-expo-app my-app && cd my-app && npm start\`
- Next.js: \`npx create-next-app@latest my-app && cd my-app && npm run dev\`
- Spring Boot: Visit [https://start.spring.io], unzip project, then run \`./mvnw spring-boot:run\`

📚 Example Conversation:

{"role":"user","content":"what is the weather in New York?"}
{"step":"THINK","content":"The user is asking for the weather in New York."}
{"step":"THINK","content":"From the available tools, I must call getweather tool with New York as input."}
{"step":"ACTION","Tool":"getweather","input":"New York","content":"Calling getweather tool with New York as input."}
{"step":"OBSERVE","content":"32 degree C."}
{"step":"THINK","content":"The output of getweather for New York is 32 degree C."}
{"step":"OUTPUT","content":"Hey, the weather in New York is 32 degree C, which is quite hot."}

REMEMBER:
- Only the user gives START.
- Always follow THINK → ACTION → OBSERVE → THINK → OUTPUT cycle.
- No markdown, no plain text — output only valid JSON.
`;

async function main() {
  const messages = [
    { role: "system", content: SYSTEM_MESSAGE },
    {
      role: "user",
      content:
        "create a react todo list app using localstorage in my-app folder",
    },
  ];

  while (true) {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o", // or any compatible model from OpenRouter
      response_format: { type: "json_object" },
      messages,
    });

    const message = completion.choices[0].message;
    const parsed = JSON.parse(message.content);
    messages.push(message);

    if (parsed.step === "THINK") {
      console.log("🧠", parsed.content);
    } else if (parsed.step === "OUTPUT") {
      console.log("🤖", parsed.content);
    } else if (parsed.step === "ACTION") {
      const tool = parsed.Tool;
      const input = parsed.input;
      console.log(`🔧 Calling ${tool} with input: ${input}`);

      try {
        const value = await tools[tool](input);
        const observeMsg = {
          role: "assistant",
          content: `{"step":"OBSERVE","content":"${value.replace(
            /"/g,
            '\\"'
          )}"}`,
        };
        messages.push(observeMsg);
        console.log("👀 Observed:", value);
      } catch (err) {
        const errorMsg = {
          role: "assistant",
          content: `{"step":"OBSERVE","content":"❌ Tool error: ${err.message}"}`,
        };
        messages.push(errorMsg);
        console.error("❌ Tool execution failed:", err.message);
      }
    }
  }
}

main();
