import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from "node:child_process";
import { writeFileSync, readFileSync } from "fs";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, { shell: "/bin/bash", timeout: 20000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(`❌ Error: ${error.message}`);
      }
      resolve(`✅ stdout:\n${stdout}\n⚠️ stderr:\n${stderr}`);
    });
  });
};

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
    return `📄 Content of ${path}:
${data}`;
  } catch (err) {
    return `❌ Failed to read file: ${err.message}`;
  }
};

const getweather = (city) => {
  return `${city} has 42°C. ☀️ Stay hydrated!`;
};

const tools = {
  getweather,
  executeCommand,
  writeFile,
  readFile,
};

const SYSTEM_MESSAGE = `
you are a helpful assistant. Answer the user's questions to the best of your ability.
you work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.

in the start phase, user gives a query to you.
Then, you THINK how to resolve that query at least 3-4 times and make sure all is clear.
If there's a need to call any tool, you call an ACTION event with the tool and input parameters.
After any ACTION, always wait for OBSERVE (tool output), then THINK again, and only then OUTPUT the final answer.

Rules:
- Always wait for next step
- Always output a single step and wait for the next step
- Output must be strictly JSON
- Only call tool action from available tools only
- Strictly follow the output format given below
- Never output a START step
- Never output multiple JSON objects. Output just one JSON object per message.

Available tools:
- getweather(city:String):String
- executeCommand(command:String):String — Run any shell command (supports && and chaining)
- writeFile(path:String|||content:String):String — Write content to a file
- readFile(path:String):String — Read and return file contents

Sample framework setup instructions (non-interactive):
- React with Vite: npm create vite@latest my-app -- --template react && cd my-app && npm install && npm run dev
- React Native (Expo): npx create-expo-app my-app && cd my-app && npm start
- Next.js: npx create-next-app@latest my-app && cd my-app && npm run dev
- NestJS: npm i -g @nestjs/cli && nest new my-app --package-manager npm && cd my-app && npm run start:dev
- Spring Boot (Java): Use Spring Initializr CLI or download from https://start.spring.io and unzip && cd <project> && ./mvnw spring-boot:run

Output format:
{"step":string,"content":string}
or
{"step":string,"Tool":string,"input":string,"content":string}
`;

const messages = [{ role: "user", parts: [{ text: SYSTEM_MESSAGE }] }];

async function askGemini(userInput) {
  if (userInput) messages.push({ role: "user", parts: [{ text: userInput }] });

  const chat = await model.startChat({ history: messages });
  const result = await chat.sendMessage(userInput || "");

  const text = result.response.text();
  console.log("📨 Gemini raw response:\n", text);

  const match = text.match(/{[\s\S]*?}/);
  if (!match) {
    console.error("❌ No valid JSON object found:\n", text);
    return false;
  }

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ JSON Parse Error:\n", text);
    return false;
  }

  if (parsed.step === "THINK") {
    console.log(`🧠 ${parsed.content}`);
    return true;
  }

  if (parsed.step === "OUTPUT") {
    console.log(`🤖 ${parsed.content}`);
    return false;
  }

  if (parsed.step === "ACTION") {
    const toolName = parsed.Tool;
    const input = parsed.input;
    console.log(`🔧 Calling ${toolName} with input: \"${input}\"`);

    try {
      const result = await tools[toolName](input);
      const observeMessage = `{"step":"OBSERVE","content":"${result}"}`;
      messages.push({ role: "model", parts: [{ text: observeMessage }] });
    } catch (err) {
      const errorMsg = `{"step":"OBSERVE","content":"❌ Tool error: ${err.message}"}`;
      messages.push({ role: "model", parts: [{ text: errorMsg }] });
    }

    return true;
  }

  return false;
}

async function main() {
  const userQuery = "Create a React app using Vite and start the dev server.";
  let shouldContinue = await askGemini(userQuery);
  while (shouldContinue) {
    shouldContinue = await askGemini("");
  }
}

main();
