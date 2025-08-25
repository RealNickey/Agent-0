/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FunctionDeclaration, LiveServerToolCall, Type } from "@google/genai";
import { GenAILiveClient } from "../lib/genai-live-client";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ToolHandler {
  name: string;
  declaration: FunctionDeclaration;
  handle: (args: any) => Promise<any> | any;
  cleanup?: () => void;
}

export interface ToolResponse {
  success: boolean;
  output?: any;
  error?: string;
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

class ToolEventEmitter extends EventTarget {
  emit(event: string, data: any) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

export const toolEvents = new ToolEventEmitter();

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

/**
 * Altair Graph Rendering Tool
 */
export const altairTool: ToolHandler = {
  name: "render_altair",
  declaration: {
    name: "render_altair",
    description: "Displays an altair graph in json format.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        json_graph: {
          type: Type.STRING,
          description: "JSON STRING representation of the graph to render. Must be a string, not a json object",
        },
      },
      required: ["json_graph"],
    },
  },
  handle: async (args: any) => {
    const { json_graph } = args;
    
    if (!json_graph) {
      return { success: false, error: "Missing required parameter: json_graph" };
    }

    try {
      JSON.parse(json_graph);
      toolEvents.emit('altair-update', { jsonString: json_graph });
      return { 
        success: true, 
        output: { message: "Graph rendered successfully" } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Invalid JSON graph: ${error instanceof Error ? error.message : 'Parse error'}` 
      };
    }
  },
};

/**
 * Calculator Tool (Example)
 */
export const calculatorTool: ToolHandler = {
  name: "calculate",
  declaration: {
    name: "calculate",
    description: "Performs basic mathematical calculations.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        operation: {
          type: Type.STRING,
          description: "The mathematical operation to perform",
          enum: ["add", "subtract", "multiply", "divide"],
        },
        a: { type: Type.NUMBER, description: "The first number" },
        b: { type: Type.NUMBER, description: "The second number" },
      },
      required: ["operation", "a", "b"],
    },
  },
  handle: async (args: any) => {
    const { operation, a, b } = args;
    
    let result: number;
    switch (operation) {
      case "add": result = a + b; break;
      case "subtract": result = a - b; break;
      case "multiply": result = a * b; break;
      case "divide": 
        if (b === 0) return { success: false, error: "Division by zero" };
        result = a / b; 
        break;
      default:
        return { success: false, error: `Unknown operation: ${operation}` };
    }
    
    return { 
      success: true, 
      output: { result, operation: `${a} ${operation} ${b} = ${result}` } 
    };
  },
};

// ============================================================================
// TOOL REGISTRY
// ============================================================================

const tools = new Map<string, ToolHandler>();

/**
 * Register a tool
 */
export function registerTool(tool: ToolHandler) {
  tools.set(tool.name, tool);
  console.log(`Tool registered: ${tool.name}`);
}

/**
 * Get all registered tools
 */
export function getAllTools(): ToolHandler[] {
  return Array.from(tools.values());
}

/**
 * Get function declarations for API config
 */
export function getToolDeclarations(): FunctionDeclaration[] {
  return getAllTools().map(tool => tool.declaration);
}

/**
 * Get tool by name
 */
export function getTool(name: string): ToolHandler | undefined {
  return tools.get(name);
}

// ============================================================================
// TOOL MANAGER
// ============================================================================

let client: GenAILiveClient | null = null;

/**
 * Initialize tools with client
 */
export function initializeTools(liveClient?: GenAILiveClient) {
  console.log("Initializing tools...");
  
  // Clear existing tools
  tools.clear();
  
  // Register all tools
  registerTool(altairTool);
  registerTool(calculatorTool);
  
  // Set up client if provided
  if (liveClient) {
    client = liveClient;
    
    // Remove existing listener
    client.off("toolcall", handleToolCall);
    
    // Add tool call handler
    client.on("toolcall", handleToolCall);
    
    console.log("Tool call handler registered");
  }
  
  console.log(`Tools initialized: ${tools.size} tools registered`);
}

/**
 * Handle tool calls from the API
 */
async function handleToolCall(toolCall: LiveServerToolCall) {
  if (!toolCall.functionCalls || !client) return;
  
  const responses: Array<{
    response: { output: any };
    id: string;
    name: string;
  }> = [];
  
  for (const functionCall of toolCall.functionCalls) {
    if (!functionCall.name || !functionCall.id) continue;
    
    const tool = getTool(functionCall.name);
    
    if (!tool) {
      console.error(`Tool not found: ${functionCall.name}`);
      responses.push({
        response: { output: { success: false, error: `Tool not found: ${functionCall.name}` } },
        id: functionCall.id,
        name: functionCall.name,
      });
      continue;
    }
    
    try {
      console.log(`Executing tool: ${functionCall.name}`, functionCall.args);
      const result = await tool.handle(functionCall.args || {});
      
      responses.push({
        response: { output: result },
        id: functionCall.id,
        name: functionCall.name,
      });
      
      console.log(`Tool ${functionCall.name} executed successfully`);
    } catch (error) {
      console.error(`Error executing tool ${functionCall.name}:`, error);
      responses.push({
        response: { 
          output: { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } 
        },
        id: functionCall.id,
        name: functionCall.name,
      });
    }
  }
  
  // Send responses
  setTimeout(() => {
    client!.sendToolResponse({ functionResponses: responses });
  }, 200);
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// For Altair component
export const altairEvents = toolEvents;

// Tool stats
export function getToolStats() {
  return {
    total: tools.size,
    registered: Array.from(tools.keys()),
  };
}