# Tool System Documentation

A simplified, developer-friendly tool system for integrating with the Gemini API.

## 📁 Directory Structure

```
src/tools/
├── tools.ts      # All-in-one tool definitions, registry, and manager
├── index.ts      # Public API exports
└── README.md     # This documentation
```

## 🚀 Quick Start

### Using Existing Tools

```typescript
import { initializeTools, getToolDeclarations } from '@/tools';

// Initialize tools with your client
useEffect(() => {
  initializeTools(client);
  
  setConfig({
    tools: [
      { googleSearch: {} },
      { functionDeclarations: getToolDeclarations() },
    ],
  });
}, [client]);
```

### Listening to Tool Events

```typescript
import { altairEvents } from '@/tools';

useEffect(() => {
  const handleUpdate = (event: CustomEvent) => {
    const { jsonString } = event.detail;
    setGraphData(jsonString);
  };

  altairEvents.addEventListener('altair-update', handleUpdate);
  return () => altairEvents.removeEventListener('altair-update', handleUpdate);
}, []);
```

## 🔧 Adding a New Tool

Everything is in one file: `tools.ts`. Just add your tool definition:

```typescript
// 1. Define your tool
export const myTool: ToolHandler = {
  name: "my_tool",
  declaration: {
    name: "my_tool", 
    description: "What your tool does",
    parameters: {
      type: Type.OBJECT,
      properties: {
        input: { type: Type.STRING, description: "Input parameter" }
      },
      required: ["input"]
    }
  },
  handle: async (args: any) => {
    const { input } = args;
    // Your logic here
    return { success: true, output: result };
  }
};

// 2. Register it in initializeTools()
export function initializeTools(liveClient?: GenAILiveClient) {
  // ... existing code ...
  registerTool(altairTool);
  registerTool(calculatorTool);
  registerTool(myTool); // Add this line
  // ... rest of function ...
}
```

## 🛠 Available Tools

### Altair Graph Tool
- **Name**: `render_altair`
- **Purpose**: Renders Vega-Lite/Altair graphs
- **Events**: Emits `altair-update` event

### Calculator Tool  
- **Name**: `calculate`
- **Purpose**: Basic math operations
- **Operations**: add, subtract, multiply, divide

## 📚 API Reference

### Core Functions

- `initializeTools(client)` - Initialize tool system
- `getToolDeclarations()` - Get function declarations for API
- `registerTool(tool)` - Register a new tool
- `getTool(name)` - Get tool by name
- `getToolStats()` - Get registration statistics

### Tool Interface

```typescript
interface ToolHandler {
  name: string;
  declaration: FunctionDeclaration;
  handle: (args: any) => Promise<any> | any;
  cleanup?: () => void;
}
```

### Event System

```typescript
// Emit custom events
toolEvents.emit('my-event', { data: 'value' });

// Listen to events
toolEvents.addEventListener('my-event', handler);
```

## 🎯 Benefits

- **Single File**: Everything in one place - easy to understand
- **Type Safe**: Full TypeScript support
- **Event Driven**: Decoupled UI updates
- **Developer Friendly**: Simple patterns, clear structure
- **Zero Config**: Works out of the box

## 🔍 Debugging

```typescript
// Check registered tools
console.log('Tools:', getToolStats());

// Monitor tool calls
// Tool execution is automatically logged to console
```

This simplified architecture gives you all the power of a complex tool system while keeping everything manageable in a single file!
