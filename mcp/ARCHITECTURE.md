# MCP Architecture Documentation

## Project Structure

```
src/
├── LLM/
│   ├── api.ts              # Backward-compatible entry point
│   └── prompt.txt          # System prompt
├── config/
│   └── env.ts              # Environment validation
├── helpers/
│   ├── conversationHistory.ts  # Session management
│   └── tokenextraction.ts      # JWT extraction
├── middleware/
│   └── validation.ts       # Zod request validation
├── routes/
│   └── mcp.routes.ts       # API routes (NEW)
├── schemas/
│   └── mcpSchema.ts        # Request schemas
├── tools/
│   ├── backendapi.ts       # Backend API client
│   └── tools.json          # Tool definitions
├── types/
│   └── content.ts          # Gemini API types
├── utils/
│   ├── logger.ts           # Structured logging
│   ├── toolRegistry.ts     # Tool config loader (NEW)
│   ├── toolExecutor.ts     # Tool execution (NEW)
│   ├── promptLoader.ts     # System prompt loader (NEW)
│   ├── aiClient.ts         # AI client factory (NEW)
│   ├── aiGenerator.ts      # AI generation loop (NEW)
│   └── responseFormatter.ts # Response utilities (NEW)
└── server.ts               # Express app setup
```

## Key Improvements

### 1. **Separation of Concerns**
- **Tool Management**: `toolRegistry.ts` handles config loading
- **Tool Execution**: `toolExecutor.ts` handles execution logic
- **AI Generation**: `aiGenerator.ts` handles the conversation loop
- **Response Handling**: `responseFormatter.ts` handles API responses

### 2. **Factory Pattern**
- `aiClientFactory` - Singleton AI client
- `promptLoader` - Cached system prompt
- `toolRegistry` - Tool configuration manager

### 3. **Modular Routing**
- Routes moved to `routes/mcp.routes.ts`
- Server.ts now focuses only on Express setup
- Easy to add new routes

### 4. **DRY Code**
- No repeated API response formatting
- Centralized error handling
- Logger integrated everywhere
- Single tool execution logic

### 5. **Better Maintainability**
- Each file has a single responsibility
- Clear interfaces and types
- JSDoc comments on public functions
- Consistent error handling patterns

## Usage Examples

### Adding a New Tool

1. Add to `tools.json`:
```json
{
  "name": "my-tool",
  "description": "Does something",
  "parameters": { ... }
}
```

2. Add implementation in `toolExecutor.ts`:
```typescript
'my-tool': async (args: any) => {
  // Implementation
}
```

### Logging

```typescript
import { logger } from './utils/logger';

logger.info('Something happened', { userId, action: 'create' });
logger.error('Error occurred', error, { context: 'data' });
logger.debug('Detailed info', { details: 'here' });
```

### Adding a New Route

Create a new route file in `routes/` and import in `server.ts`:
```typescript
app.use('/new-route', newRouter);
```

## Testing Benefits

- Each utility is independently testable
- Mock factories easily
- No hidden dependencies
- Clear function signatures

## Performance

- Cached configurations (prompts, tool registry)
- Singleton instances (AI client)
- Minimal file I/O operations
