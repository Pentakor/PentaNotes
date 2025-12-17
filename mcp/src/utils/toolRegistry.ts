import { Type } from "@google/genai";
import fs from "fs";
import path from "path";

// ---------------------------
// Types
// ---------------------------
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolsConfig {
  tools: ToolDefinition[];
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: any;
    properties: Record<string, any>;
    required: string[];
  };
}

// ---------------------------
// Type Mapping
// ---------------------------
const TYPE_MAP: Record<string, any> = {
  string: Type.STRING,
  number: Type.NUMBER,
  boolean: Type.BOOLEAN,
  object: Type.OBJECT,
  array: Type.ARRAY,
};

// ---------------------------
// Tool Registry
// ---------------------------
class ToolRegistry {
  private toolsConfig: ToolsConfig | null = null;

  /**
   * Load tools configuration from JSON file
   */
  loadToolsConfig(): ToolsConfig {
    if (this.toolsConfig) {
      return this.toolsConfig;
    }

    const toolsFilePath = path.resolve(__dirname, '../tools/tools.json');
    const toolsFile = fs.readFileSync(toolsFilePath, 'utf-8');
    const config: ToolsConfig = JSON.parse(toolsFile);
    this.toolsConfig = config;

    return config;
  }

  /**
   * Convert tools config to SDK format (with Type objects)
   */
  toSDKFormat(): Array<{ functionDeclarations: ToolDeclaration[] }> {
    const config = this.loadToolsConfig();

    return [
      {
        functionDeclarations: config.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: {
            type: Type.OBJECT,
            properties: Object.fromEntries(
              Object.entries(tool.parameters.properties).map(
                ([key, val]: any) => [
                  key,
                  {
                    type: TYPE_MAP[val.type] || Type.STRING,
                    description: val.description,
                  },
                ]
              )
            ),
            required: tool.parameters.required,
          },
        })),
      },
    ];
  }

  /**
   * Get a specific tool definition by name
   */
  getToolByName(name: string): ToolDefinition | undefined {
    const config = this.loadToolsConfig();
    return config.tools.find((tool) => tool.name === name);
  }

  /**
   * Get all available tool names
   */
  getToolNames(): string[] {
    const config = this.loadToolsConfig();
    return config.tools.map((tool) => tool.name);
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
