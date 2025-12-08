import { GoogleGenAI, Type } from "@google/genai";
import { createNote } from "../tools/backendapi";
import { GEMINI_API_KEY } from '../config/env';
import fs from "fs";


// ---------------------------
// Types for content parts
// ---------------------------
type ContentPart =
  | { text: string }
  | { functionCall: any }
  | { functionResponse: any };

interface Content {
  role: "user" | "model";
  parts: ContentPart[];
}

// ---------------------------
// Load tools from JSON file
// ---------------------------
const toolsFile = fs.readFileSync("./src/tools/tools.json", "utf-8");
const toolsData: any = JSON.parse(toolsFile);

const createNoteTool = toolsData.tools.find((t: any) => t.name === "create-note");
if (!createNoteTool) throw new Error("create-note tool not found in tools.json");

// ---------------------------
// Map of all tool functions
// ---------------------------
const toolFunctions: Record<string, Function> = {
  "create-note": async (args: any) => {
    const { title, content, folderId, token } = args;
    return createNote(title, content || "", token);
  },
};

// ---------------------------
// Convert tools.json to SDK format
// ---------------------------
const tools = [
  {
    functionDeclarations: [
      {
        name: createNoteTool.name,
        description: createNoteTool.description,
        parameters: {
          type: Type.OBJECT,
          properties: Object.fromEntries(
            Object.entries(createNoteTool.parameters.properties).map(([key, val]: any) => [
              key,
              { type: val.type === "string" ? Type.STRING : Type.NUMBER },
            ])
          ),
          required: createNoteTool.parameters.required,
        },
      },
    ],
  },
];

// ---------------------------
// Configure AI client
// ---------------------------
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ---------------------------
// AI loop (dynamic) ---------------------------
export async function runAI({
  userMessage,
  token,
  userId,
}: {
  userMessage: string;
  token: string | null;
  userId?: number;
}) {
  // Initialize contents with the user's message
  const contents: Content[] = [
    {
      role: "user",
      parts: [
        {
          text: userMessage,
        },
      ],
    },
  ];

  while (true) {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { tools },
    });

    if (result.functionCalls && result.functionCalls.length > 0) {
        const functionCall = result.functionCalls[0];
        const name = functionCall.name;
        const args = functionCall.args || {}; // <-- ensure it's never undefined

        if (!name || !toolFunctions[name]) {
            throw new Error(`Unknown or missing function call name: ${name}`);
        }

        // Inject token for create-note
        if (name === "create-note") {
            args.token = token;
        }

        // Call the tool
        const toolResponse = await toolFunctions[name](args);

        const functionResponsePart = {
        name,
        response: { result: toolResponse },
        };

      // Push the functionCall back to the model
      contents.push({
        role: "model",
        parts: [{ functionCall }],
      });

      // Push the tool response as a user message
      contents.push({
        role: "user",
        parts: [{ functionResponse: functionResponsePart }],
      });
    } else {
      // No more function calls, return the model output
      return result.text;
    }
  }
}