import { GoogleGenAI, Type } from "@google/genai";
import { createNote, updateNote, getFolders, getTags, getNotes, createFolder } from "../tools/backendapi";
import { GEMINI_API_KEY, MODEL } from '../config/env';
import fs from "fs";
import { Content } from '../types/content';
import { getConversationHistory } from '../helpers/conversationHistory';

// ---------------------------
// Tool Registry
// ---------------------------
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

interface ToolsConfig {
  tools: ToolDefinition[];
}

// Map JSON types to SDK types
const TYPE_MAP: Record<string, any> = {
  string: Type.STRING,
  number: Type.NUMBER,
  boolean: Type.BOOLEAN,
  object: Type.OBJECT,
  array: Type.ARRAY,
};

// ---------------------------
// Load configuration
// ---------------------------
const toolsFile = fs.readFileSync("./src/tools/tools.json", "utf-8");
const systemPrompt = fs.readFileSync("./src/LLM/prompt.txt", "utf-8");
const toolsConfig: ToolsConfig = JSON.parse(toolsFile);

// ---------------------------
// Tool implementations
// ---------------------------
const toolImplementations: Record<string, Function> = {
  "create-note": async (args: any) => {
    const { title, content, token } = args;
    return createNote(title, content || "", token);
  },
  "update-note": async (args: any) => {
    const { noteId, title, content, folderId, token } = args;

    return updateNote(
      noteId,
      { title, content, folderId },
      token
    );
  },
  "get-folders": async (args: any) => {
  const { token } = args;
  return getFolders(token);
  },

  "get-tags": async (args: any) => {
  const { token } = args;
  return getTags(token);
  },

  "get-notes": async (args: any) => {
  const { token } = args;
  return getNotes(token);
  },

  "create-folder": async (args: any) => {
  const { title, token } = args;
  return createFolder(title, token);
  },

  // Add more tool implementations here as needed
};

// ---------------------------
// Convert tools.json to SDK format automatically
// ---------------------------
function convertToolsToSDKFormat(toolsConfig: ToolsConfig) {
  return [{
    functionDeclarations: toolsConfig.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: Type.OBJECT,
        properties: Object.fromEntries(
          Object.entries(tool.parameters.properties).map(([key, val]: any) => [
            key,
            {
              type: TYPE_MAP[val.type] || Type.STRING,
              description: val.description,
            },
          ])
        ),
        required: tool.parameters.required,
      },
    })),
  }];
}

const tools = convertToolsToSDKFormat(toolsConfig);

// ---------------------------
// Configure AI client
// ---------------------------
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ---------------------------
// Execute tool with automatic token injection
// ---------------------------
async function executeTool(
  name: string,
  args: any,
  token: string | null
): Promise<any> {
  const implementation = toolImplementations[name];
  
  if (!implementation) {
    throw new Error(`Tool implementation not found: ${name}`);
  }

  // Automatically inject token if needed
  const argsWithToken = { ...args, token };
  
  return implementation(argsWithToken);
}

// ---------------------------
// AI loop (dynamic)
// ---------------------------
export async function runAI({
  userMessage,
  token,
  userId,
}: {
  userMessage: string;
  token: string | null;
  userId: number;
}) {
  const history = userId ? getConversationHistory(userId) : [];
  
  const contents: Content[] = [
    ...history,
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  console.log("Contents:", contents);
  console.log("Tools:", tools);

  while (true) {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        tools,
        systemInstruction: systemPrompt,
      },
    });

    if (result.functionCalls && result.functionCalls.length > 0) {
      const functionCall = result.functionCalls[0];
      const { name, args = {} } = functionCall;

      if (!name) {
        throw new Error("Function call missing name");
      }

      // Execute the tool
      const toolResponse = await executeTool(name, args, token);

      // Add function call to conversation
      contents.push({
        role: "model",
        parts: [{ functionCall }],
      });

      // Add tool response to conversation
      contents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name,
            response: { result: toolResponse },
          },
        }],
      });
    } else {
      // No more function calls, return final response
      return result.text || "No response generated";
    }
  }
}