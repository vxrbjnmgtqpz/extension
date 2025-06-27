# ChatRouter Component Log

**Timestamp:** 2025-05-23T00:00:00Z

## Implementation Notes

- Created `ChatRouter.tsx` to display chat history for the active agent
- Accepts `activeAgent` prop and switches context accordingly
- Loads mock chat data from static JSON files in `mock/`
- Each message displays timestamp, sender, message bubble, and optional file metadata
- UI: Scrollable, left-aligned, soft gray/blue theme, agent emoji and color badge
- Alternates background for visual scan
- No API or file reads yet; logic is ready to swap for live log loading
- Added clear TODO for future live log integration
- Created `index.ts` for clean imports

## TODOs

- [ ] Replace mock data with live log file loading in the future
- [ ] Integrate with app-level state/context for agent selection

## Status

ChatRouter component complete. Ready for next directive or MessageComposer prototype.
