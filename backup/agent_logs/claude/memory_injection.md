# Memory Injection Log

**Timestamp:** 2025-05-23T00:00:00Z

## Implementation Notes

- Created `memory.json` for each agent in `agent_logs/<agent>/` with persona, rules, and reminders
- Built `readMemory.ts` utility to load agent memory from the appropriate file
- Updated `main.tsx` to load and display the active agent's memory at the top of the chat view
- MemoryBox component shows persona, rules, and reminders for the current agent
- Memory is accessible to all components via props/context if needed

## Usage

- On agent switch, memory is reloaded and displayed
- Memory can be used for context, reminders, and persona enforcement in UI and logic

## TODOs

- [ ] Allow editing/updating memory from the UI
- [ ] Use memory context in MessageComposer for top-of-message tips
- [ ] Persist memory changes to file (if editable)

## Status

Memory injection system complete. Ready for further integration or UI enhancements.
