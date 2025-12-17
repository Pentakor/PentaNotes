# Revert Feature - Quick Start Guide

## 🚀 Quick Start for Developers

### Installation

1. **Install uuid dependency** (if not already done):
   ```bash
   cd mcp
   npm install uuid
   ```

2. **Verify package.json**:
   ```bash
   grep uuid package.json
   # Should show: "uuid": "^9.0.0",
   ```

3. **Start the servers**:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm start
   
   # Terminal 2: MCP
   cd mcp
   npm start
   
   # Terminal 3: Frontend
   cd frontend/pentanotes-frontend
   npm start
   ```

### First Test

1. Open http://localhost:3000 in browser
2. Open Chat (bottom right button)
3. Type: "Create a note titled 'Test' with content 'Hello world'"
4. Wait for AI response
5. **Look for the revert button** (↶ undo icon) in chat header
6. Click it to revert the note creation
7. Check Notes section - note should be gone

---

## 🎯 Key Features at a Glance

### For Users
- **Revert Button**: Appears in chat header after each AI response
- **One-Click Undo**: Click to undo all changes from that AI request
- **Auto-Refresh**: Notes and folders refresh automatically after revert
- **Error Messages**: Clear feedback if revert fails

### For Developers
- **Request IDs**: Each AI call gets unique UUID stored in response
- **Action History**: All AI actions logged to MongoDB with snapshots
- **Inverse Operations**: Automatic undo instructions generated per action
- **Idempotent**: Safe to call revert multiple times on same request

---

## 📊 What Gets Reverted

| Action | Revert Behavior |
|--------|-----------------|
| Create Note | Deletes the note |
| Update Note | Restores previous content |
| Create Folder | Deletes the folder |
| Delete Note | ⚠️ Cannot restore (data lost) |
| Delete Folder | ⚠️ Cannot restore (data lost) |

---

## 🔍 Architecture Overview

```
┌─────────────┐
│   Frontend  │ (ChatBot + Revert Button)
│  React UI   │
└──────┬──────┘
       │ /mcp (POST) with message
       │ Returns: requestId
       ▼
┌─────────────────────────────────┐
│   MCP Server (Port 8080)        │
│  ┌────────────────────────────┐ │
│  │  AI Generation Loop        │ │
│  │  - UUID requestId created  │ │
│  │  - ActionHistory record    │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │  Tool Executor + Logging   │ │
│  │  - Captures snapshots      │ │
│  │  - Builds inverse ops      │ │
│  │  - Logs to MongoDB         │ │
│  └────────────────────────────┘ │
└──────┬──────────────────────────┘
       │ /mcp/revert (POST)
       │ Input: requestId, userId
       ▼
┌─────────────────────────────────┐
│   Revert Service                │
│  - Fetch ActionHistory          │
│  - Execute inverse operations   │
│  - Mark as reverted             │
└──────┬──────────────────────────┘
       │ DELETE /api/notes/123/
       │ PUT /api/notes/456/
       ▼
┌─────────────────────────────────┐
│   Backend API (Port 3001)       │
│  - Process inverse operations   │
└─────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Test 1: Basic Create → Revert
```javascript
// In chat:
User: "Create a note titled 'Test' with content 'Hello'"
AI: Creates note ID 123
// In UI: Revert button appears
User: Clicks revert
Result: Note 123 deleted, UI shows "✓ Successfully reverted 1 operation(s)"
```

### Test 2: Multiple Operations → Revert
```javascript
// In chat:
User: "Create a folder 'My Folder' and add a note to it"
AI: 
  1. Create folder ID 50
  2. Create note ID 200 in folder 50
  3. Update note with more content
// In UI: Revert button appears
User: Clicks revert
Result: All 3 operations reverted in reverse order
```

### Test 3: Error Scenario
```javascript
// Manually delete a note through UI
// Then try to revert an old request that included that note
Result: Error message "Operation 2 failed: HTTP 404 Not Found"
        Shows partial revert success if other operations succeeded
```

---

## 📝 Key Files

### Backend Files (MCP)
- `src/database/actionHistoryModel.ts` - MongoDB model for action history
- `src/utils/toolExecutor.ts` - Enhanced tool execution with logging
- `src/utils/aiGenerator.ts` - Request ID generation and tracking
- `src/utils/revertService.ts` - Revert orchestration logic
- `src/routes/mcp.routes.ts` - New endpoints: /revert, /status

### Frontend Files
- `src/services/api.ts` - `revertAiRequest()` method
- `src/components/ChatBot.tsx` - Revert button UI

---

## 🔧 Troubleshooting

### Issue: Revert button doesn't show
**Solution**: Check browser console for errors. Verify requestId is in API response.
```bash
# In browser DevTools console:
# Look for response.requestId in network tab
```

### Issue: Revert fails with 404
**Solution**: This is expected if the entity was deleted through other means.
```bash
# Check backend logs for DELETE request details
```

### Issue: ActionHistory not stored
**Solution**: Verify MongoDB is running and connected.
```bash
# In MCP logs:
# Should see "Created action history record"
# "Logged action to history"
```

### Issue: Slow revert operations
**Solution**: Check network latency and backend API performance.
```bash
# Time individual inverse operations in browser DevTools
# Check backend logs for slow endpoint responses
```

---

## 📈 Monitoring

### Logs to Look For (MCP)

**Successful Flow**:
```
Starting AI generation loop
AI calling tool: create-note
Logged action to history
AI generation completed
```

**Revert Flow**:
```
Starting revert process
Executing inverse operations (count: 1)
Executing inverse operation 1/1
Marked action history as reverted
Revert completed successfully
```

### MongoDB Monitoring

```javascript
// View recent action histories
db.actionhistories.find()
  .sort({ timestamp: -1 })
  .limit(10)
  .pretty()

// View reverted requests
db.actionhistories.find({ status: "reverted" })

// Count actions per user
db.actionhistories.aggregate([
  { $group: { _id: "$userId", count: { $sum: 1 } } }
])
```

---

## 🎓 API Examples

### 1. Get requestId from AI Response
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Create a note about testing",
    "userId": 1
  }'

# Response includes:
# "requestId": "550e8400-e29b-41d4-a716-446655440000"
```

### 2. Call Revert Endpoint
```bash
curl -X POST http://localhost:8080/mcp/revert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": 1
  }'

# Success Response:
# {
#   "status": "success",
#   "message": "Successfully reverted 1 operation(s)",
#   "data": {
#     "operationsReverted": 1,
#     "message": "Successfully reverted 1 operation(s)"
#   }
# }
```

### 3. Check Request Status
```bash
curl http://localhost:8080/mcp/status/550e8400-e29b-41d4-a716-446655440000?userId=1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
# {
#   "status": "success",
#   "message": "Request status retrieved",
#   "data": {
#     "status": "reverted",
#     "message": "This request has been reverted",
#     "actionCount": 1,
#     "revertedAt": "2024-12-17T10:30:00Z"
#   }
# }
```

---

## 🚀 Deployment Checklist

- [ ] UUID package installed in MCP
- [ ] MCP compiled without errors
- [ ] Frontend compiled without errors
- [ ] MongoDB running and accessible
- [ ] Backend API running on port 3001
- [ ] MCP server running on port 8080
- [ ] Frontend running on port 3000
- [ ] Test basic create → revert flow
- [ ] Monitor logs for errors
- [ ] Verify ActionHistory documents in MongoDB

---

## 📚 More Information

- **Full Documentation**: See `REVERT_FEATURE.md`
- **Implementation Summary**: See `REVERT_IMPLEMENTATION_SUMMARY.md`
- **Code Comments**: Check source files for inline documentation
- **Type Definitions**: TypeScript interfaces document all data structures

---

## ✨ Feature Highlights

✅ **Atomic Revert**: All-or-nothing operation execution
✅ **Idempotent**: Safe to call multiple times
✅ **Partial Revert**: Shows which operations failed
✅ **Auto-Cleanup**: 7-day TTL on action history
✅ **Snapshot Storage**: Full before/after state preserved
✅ **LIFO Order**: Operations reversed in reverse order
✅ **Error Handling**: Graceful degradation with clear messages
✅ **Frontend Integration**: One-click UI button
✅ **Secure**: Token-based authentication and user isolation

---

## 🎉 You're Ready!

The Revert feature is fully implemented and ready to use. Start creating notes and reversing them!

**Happy reverting! 🔄**
