# SmartRelay Testing Interface

A comprehensive testing interface adapted from buildbot-ui for the SmartRelay project. This component provides a full-featured testing environment with auto-scroll, grid layout, and right-aligned user messages.

## Features

### 🧪 **Core Testing Functionality**

- **Test Execution**: Start/stop testing with progress tracking
- **File Selection**: Choose specific test files to run
- **Real-time Logging**: Live test output with message categorization
- **Progress Tracking**: Visual progress bar with percentage completion
- **Test Results**: Pass/fail counters with attempt tracking

### 🎨 **UI/UX Features**

- **Grid Layout**: Messages displayed in a grid with 1px white borders
- **Auto-scroll**: Automatically scrolls to bottom when new messages arrive
- **Scroll Control**: "Scroll to Bottom" button when user scrolls up
- **Message Alignment**: User messages right-aligned, system messages left-aligned
- **Fullscreen Mode**: Expandable log view for detailed analysis
- **Color Coding**: Different colors for errors, results, and info messages

### 📱 **Responsive Design**

- **Floating Button**: Minimized state shows a floating test tube icon
- **Overlay Interface**: Full-screen overlay when active
- **Modern Styling**: Dark theme matching SmartRelay aesthetic
- **Tailwind CSS**: Consistent styling with the rest of the application

## Usage

### Integration

The testing interface is integrated into the main App component:

```tsx
import TestingInterface from "../components/TestingInterface/TestingInterface";

const App = () => {
  const [showTesting, setShowTesting] = useState(false);

  return (
    <>
      {/* Your main app content */}

      <TestingInterface
        isVisible={showTesting}
        onToggle={() => setShowTesting(!showTesting)}
      />
    </>
  );
};
```

### Controls

- **🧪 Floating Button**: Click to open the testing interface
- **Choose Test File**: Select a specific test file to run
- **▶️ Start Testing**: Begin test execution
- **⏹️ Stop Testing**: Halt running tests
- **🗑️ Clear Log**: Clear all test output
- **Fullscreen**: Expand log view for better visibility
- **✕ Close**: Close the testing interface

### Message Types

The interface supports different message types with color coding:

- **📝 Log**: General information (gray)
- **✅ Result**: Test results and success messages (green)
- **❌ Error**: Error messages and failures (red)
- **👤 User**: User messages (blue, right-aligned)

### Auto-scroll Behavior

- **Smart Scrolling**: Only auto-scrolls when user is at the bottom
- **Manual Control**: "Scroll to Bottom" button appears when needed
- **Smooth Animation**: Smooth scrolling transitions

## Message Format

Test messages follow this structure:

```typescript
type TestMessage = {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  type?: "log" | "error" | "progress" | "result";
  level?: "info" | "warn" | "error";
};
```

## Customization

### Adding New Test Types

To add new test types, extend the message type system:

```typescript
// Add new type
type?: "log" | "error" | "progress" | "result" | "custom";

// Add color coding in the component
const isCustom = msg.type === "custom";
// ... add styling logic
```

### Extending Functionality

The component is designed to be extensible:

1. **Real Test Integration**: Replace simulated testing with actual test runners
2. **File Browser**: Add real file selection dialog
3. **Test Configuration**: Add test configuration options
4. **Export Results**: Add test result export functionality

## Integration with SmartRelay

The testing interface is specifically designed for the SmartRelay ecosystem:

- **Consistent Styling**: Matches the dark theme and grid layout
- **Agent Integration**: Can test individual agent functionality
- **Watcher Testing**: Can verify SpecStory watcher functionality
- **Real-time Updates**: Integrates with the live message system

## Future Enhancements

- **Playwright Integration**: Direct integration with Playwright test runner
- **Test Coverage**: Visual test coverage reporting
- **Performance Metrics**: Test execution time and performance data
- **Test History**: Persistent test result history
- **CI/CD Integration**: Integration with continuous integration systems

## Dependencies

- React 19+
- TypeScript
- Tailwind CSS
- SmartRelay utilities (timestamp, logging)

## File Structure

```
components/TestingInterface/
├── TestingInterface.tsx    # Main component
└── README.md              # This documentation
```
