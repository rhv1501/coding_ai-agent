import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_APIKEY,
});
const getweather = (city) => {
  return `${city} has 42 degree C which is quite hot.`;
};
const tools = {
  getweather: getweather,
};

const SYSTEM_MESSAGE = `
you are a helpful assistant. Answer the user's questions to the best of your ability.
you work on START,THINK,ACTION,OBSERVE and OUTPUT Mode.

in the start phase,user gives a query to you.
Then, you THINK how to resolve that query atleast 3-4 times and make sure tat all is clear,
if there is a ned to call any tool, you call an ACTION event with the tool and input parameters.
if there is an action call, wait for the OBSERVE that is the output of the tool.
Based on the OBSERVE, you can either give an OUTPUT to the user or repeat the loop

Rules:
- Always wait for next step
- Alwasy output a single step and wait for te next step
- output must be strictly JSON
- only call tool action from availabble tools only. 
- strictly follow the output format given below.
- Never output a START step. Only output THINK, ACTION, OBSERVE, or OUTPUT steps.
- After OBSERVE, always THINK and then OUTPUT if the answer is ready.
- Only the user can have a START step. The assistant must never output a START step.

available tools:
-getweather(city:String):String

Example:
START: what is the weather in New York?
THINK: The user is asking for the weather in New York.
THINK: From the available tools, I must call getweather tool with New York as input.
ACTION: Call Tool getweather(New York)
OBSERVE: 32 degree C
THINK: The output of getweather for New York is 32 degree C.
OUTPUT: Hey, The weather in New York is 32 degree C which is quite hot.

Output Example:
{"role":"user","content":"what is the weather in New York?"}
{"step":"THINK","content":"The user is asking for the weather in New York."}
{"step":"THINK","content":"From the available tools, I must call getweather tool with New York as input."}
{"step":"ACTION","Tool":"getweather","input":"New York","content":"Calling getweather tool with New York as input."}
{"step":"OBSERVE","content":"32 degree C."}
{"step":"THINK","content":"The output of getweather for New York is 32 degree C."}
{"step":"OUTPUT","content":"Hey, The weather in New York is 32 degree C which is quite hot."}

IMPORTANT:
- Only the user can have a START step. The assistant must never output a START step.
- After OBSERVE, always THINK, then OUTPUT if the answer is ready.
- Only output THINK, ACTION, OBSERVE, or OUTPUT steps as the assistant.

Output format:
{"step":string,"content":string}
or
{"step":string,"Tool":string,"input":string,"content":string}
`;

async function main() {
  const messages = [
    {
      role: "system",
      content: SYSTEM_MESSAGE,
    },
  ];

  const userQuery = "what is the weather in New York?";
  messages.push({ role: "user", content: userQuery });
  while (true) {
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528:free",
      response_format: { type: "json_object" },
      messages: messages,
    });
    messages.push(completion.choices[0].message);
    const parsed = JSON.parse(completion.choices[0].message.content);
    if (parsed.step && parsed.step === "THINK") {
      console.log(`🧠:${parsed.content}`);
      continue;
    }
    if (parsed.step && parsed.step === "OUTPUT") {
      console.log(`🤖:${parsed.content}`);
      continue;
    }
    if (parsed.step && parsed.step === "ACTION") {
      const tool = parsed.Tool;
      const input = parsed.input;
      console.log(`🔧: Calling tool ${tool} with input ${input}`);
      const value = tools[tool](input);
      messages.push({
        role: "assistant",
        content: `{"step":"OBSERVE","content":"${value}"}`,
        refusal: null,
        reasoning: null,
      });
      console.log(`👀: Observed value: ${value}`);
      continue;
    }
  }
}

main();
