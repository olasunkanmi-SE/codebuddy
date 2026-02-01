# CodeBuddy Settings UI Overhaul Roadmap

## Overview

This document outlines the comprehensive plan to redesign the CodeBuddy settings UI to provide a modern, sidebar-based settings panel similar to professional IDE settings interfaces. The new design will feature a collapsible settings panel accessible via a settings icon, with a left sidebar navigation and content area layout.

---

## Current State Analysis

### Existing Implementation
- **Location**: `webviewUi/src/components/settings.tsx`
- **Architecture**: Tab-based panel within `VSCodePanels` component
- **Layout**: Single page with vertically stacked sections
- **Sections**: General, Features, Privacy & Data

### Limitations
1. Settings hidden in a tab alongside other features
2. Not easily accessible - requires switching tabs
3. Linear layout doesn't scale well with more settings
4. No dedicated toggle/icon to open settings
5. Missing several important setting categories

---

## Target Design (Reference: TRAE-Style Settings)

### Visual Design
```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                              [X]   │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│  [User Avatar]  │  General                                  │
│  Username       │  ─────────────────────────────────────    │
│                 │                                           │
│  ⌘F to search   │  Basics                                   │
│                 │  ┌─────────────────────────────────────┐  │
│ ─────────────── │  │ Theme          [Tokyo Night    ▼]  │  │
│                 │  │ Select a theme color                │  │
│ ▸ Account       │  ├─────────────────────────────────────┤  │
│ ▸ General     ◂ │  │ Language       [English       ▼]   │  │
│ ▸ Agents        │  │ Select the language for UI          │  │
│ ▸ MCP           │  └─────────────────────────────────────┘  │
│ ▸ Conversation  │                                           │
│ ▸ Models        │  Preferences                              │
│ ▸ Context       │  ┌─────────────────────────────────────┐  │
│ ▸ Rules & Skills│  │ Editor Settings    [Go to Settings] │  │
│ ▸ Privacy       │  ├─────────────────────────────────────┤  │
│ ▸ Beta          │  │ Shortcut Settings  [VS Code ▼] [⚙]  │  │
│ ▸ About         │  ├─────────────────────────────────────┤  │
│                 │  │ Import Configuration     [Import ▼] │  │
│                 │  └─────────────────────────────────────┘  │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

### Key Features
1. **Settings Icon Toggle** - Accessible from main UI header
2. **Left Sidebar Navigation** - Category-based navigation
3. **Search Functionality** - Quick find settings (⌘F)
4. **User Profile Section** - Avatar and account info at top
5. **Content Area** - Dynamic content based on selected category
6. **Grouped Settings** - Organized into Basics, Preferences, etc.

---

## Implementation Phases

### Phase 1: Foundation & Component Structure
**Timeline**: Week 1
**Priority**: High

#### Tasks
1. **Create Settings Panel Container Component**
   - `SettingsPanel.tsx` - Main container with open/close state
   - Slide-in animation from left
   - Modal overlay handling
   - Keyboard shortcuts (Escape to close)

2. **Create Settings Sidebar Component**
   - `SettingsSidebar.tsx` - Navigation menu
   - User profile section at top
   - Search input with icon
   - Navigation items with active states
   - Icons for each category

3. **Create Settings Content Container**
   - `SettingsContent.tsx` - Dynamic content area
   - Section header with category title
   - Scrollable content area
   - Close button in header

#### Files to Create
```
webviewUi/src/components/settings/
├── SettingsPanel.tsx        # Main panel container
├── SettingsSidebar.tsx      # Left sidebar navigation
├── SettingsContent.tsx      # Content area container
├── SettingsHeader.tsx       # Panel header with close button
├── SettingsSearch.tsx       # Search functionality
├── SettingsNavItem.tsx      # Individual nav item
├── SettingsSection.tsx      # Content section wrapper
├── SettingsRow.tsx          # Individual setting row
└── index.ts                 # Barrel exports
```

---

### Phase 2: Settings Categories Implementation
**Timeline**: Week 2-3
**Priority**: High

#### Category Components

1. **AccountSettings.tsx**
   - User profile display
   - Login/logout functionality
   - Account type indicator (Free/Pro)
   - Profile picture

2. **GeneralSettings.tsx** (existing, refactor)
   - Theme selection
   - Language preference
   - Editor settings link
   - Shortcut settings
   - Import configuration

3. **AgentsSettings.tsx** (new)
   - Agent mode selection (Agent/Ask)
   - Agent behavior configuration
   - Tool permissions
   - Auto-approval settings

4. **MCPSettings.tsx** (new)
   - MCP server configuration
   - Server list management
   - Add/remove servers
   - Connection status

5. **ConversationSettings.tsx** (new)
   - Chat history settings
   - Message display preferences
   - Streaming toggle
   - Auto-save settings

6. **ModelsSettings.tsx** (new)
   - AI model selection
   - Model-specific configurations
   - API key management
   - Token limits

7. **ContextSettings.tsx** (new)
   - Workspace indexing toggle
   - Context window size
   - File inclusion/exclusion patterns
   - Vector database settings

8. **RulesAndSkillsSettings.tsx** (new)
   - Custom rules configuration
   - Skills management
   - Prompt templates
   - Code style preferences

9. **PrivacySettings.tsx** (refactor)
   - Telemetry toggle
   - Data collection preferences
   - Clear history option
   - Local storage management

10. **BetaSettings.tsx** (new)
    - Experimental features toggles
    - Beta program enrollment
    - Feature flags

11. **AboutSettings.tsx** (new)
    - Version information
    - Changelog link
    - Credits/licensing
    - Support links

#### Files to Create
```
webviewUi/src/components/settings/sections/
├── AccountSettings.tsx
├── GeneralSettings.tsx
├── AgentsSettings.tsx
├── MCPSettings.tsx
├── ConversationSettings.tsx
├── ModelsSettings.tsx
├── ContextSettings.tsx
├── RulesAndSkillsSettings.tsx
├── PrivacySettings.tsx
├── BetaSettings.tsx
├── AboutSettings.tsx
└── index.ts
```

---

### Phase 3: Common UI Components
**Timeline**: Week 2 (parallel with Phase 2)
**Priority**: High

#### Reusable Components

1. **SettingsToggle.tsx** - Toggle switch with label
2. **SettingsSelect.tsx** - Dropdown selector
3. **SettingsInput.tsx** - Text input field
4. **SettingsButton.tsx** - Action button
5. **SettingsDivider.tsx** - Section divider
6. **SettingsCard.tsx** - Card container for grouped settings
7. **SettingsAlert.tsx** - Warning/info alerts

#### Files to Create
```
webviewUi/src/components/settings/ui/
├── SettingsToggle.tsx
├── SettingsSelect.tsx
├── SettingsInput.tsx
├── SettingsButton.tsx
├── SettingsDivider.tsx
├── SettingsCard.tsx
├── SettingsAlert.tsx
└── index.ts
```

---

### Phase 4: Integration & State Management
**Timeline**: Week 3
**Priority**: High

#### Tasks

1. **Settings Context Provider**
   - Create `SettingsContext.tsx`
   - Centralized settings state
   - Persistence layer
   - VS Code settings sync

2. **Settings Hook**
   - `useSettings.ts` - Access settings
   - `useSettingsPanel.ts` - Panel open/close state
   - `useSettingsCategory.ts` - Category navigation

3. **Message Handler Updates**
   - Update `webview-providers/base.ts`
   - Add settings-specific commands
   - Sync with VS Code settings

4. **Settings Icon Integration**
   - Add settings gear icon to main header
   - Toggle panel on click
   - Show active indicator when open

#### Files to Create/Modify
```
webviewUi/src/context/
├── SettingsContext.tsx      # New settings context

webviewUi/src/hooks/
├── useSettings.ts           # New hook
├── useSettingsPanel.ts      # New hook

webviewUi/src/components/
├── SettingsIcon.tsx         # New icon button

src/webview-providers/
├── base.ts                  # Update for settings commands
```

---

### Phase 5: Styling & Animations
**Timeline**: Week 4
**Priority**: Medium

#### Tasks

1. **Design System Updates**
   - Define color tokens for settings
   - Typography scale
   - Spacing system
   - Border radius standards

2. **Animations**
   - Panel slide-in/out
   - Section transitions
   - Toggle animations
   - Loading states

3. **Responsive Design**
   - Handle narrow panels
   - Collapsible sidebar for mobile
   - Touch-friendly targets

4. **Theme Support**
   - Light/dark mode support
   - Custom theme integration
   - High contrast mode

#### Styles Structure
```
webviewUi/src/styles/settings/
├── variables.css
├── animations.css
├── panel.css
├── sidebar.css
├── content.css
└── components.css
```

---

### Phase 6: Testing & Polish
**Timeline**: Week 4-5
**Priority**: High

#### Tasks

1. **Unit Tests**
   - Component rendering tests
   - Hook behavior tests
   - Context provider tests

2. **Integration Tests**
   - Settings persistence
   - VS Code communication
   - Navigation flow

3. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - Focus management
   - ARIA labels

4. **Performance**
   - Lazy loading sections
   - Memoization
   - Bundle size optimization

---

## Technical Architecture

### Component Hierarchy
```
App
└── WebviewUI
    ├── MainContent
    │   ├── ChatView
    │   └── Other tabs...
    └── SettingsPanel (conditionally rendered)
        ├── SettingsHeader
        ├── SettingsSidebar
        │   ├── UserProfile
        │   ├── SettingsSearch
        │   └── SettingsNav
        │       └── SettingsNavItem (×11)
        └── SettingsContent
            └── [Active Section Component]
```

### State Flow
```
┌──────────────────┐     ┌──────────────────┐
│ VS Code Settings │ ◄── │ Settings Context │
└──────────────────┘     └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
              │ Sidebar   │ │ Content   │ │ Controls  │
              └───────────┘ └───────────┘ └───────────┘
```

### Message Protocol

#### Webview → Extension
```typescript
interface SettingsMessage {
  command: 'settings-update' | 'settings-get' | 'settings-reset';
  category: string;
  key: string;
  value: any;
}
```

#### Extension → Webview
```typescript
interface SettingsResponse {
  type: 'settings-data' | 'settings-error';
  category: string;
  settings: Record<string, any>;
}
```

---

## Migration Strategy

### Backward Compatibility
1. Keep existing `Settings` component during transition
2. Feature flag for new settings panel
3. Gradual migration of settings to new categories
4. Remove old component after full testing

### Data Migration
1. Read existing settings from VS Code config
2. Map to new settings structure
3. Preserve user preferences
4. No data loss guarantee

---

## Dependencies

### New Packages (if needed)
- `framer-motion` - Animations (optional, can use CSS)
- `@radix-ui/react-dialog` - Modal handling (optional)
- `react-icons` - Icon library (if not using existing)

### Existing Dependencies (already in project)
- `styled-components` - Already used for styling
- `@vscode/webview-ui-toolkit` - VS Code components
- React 18+ - Hooks and context

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1 | Week 1 | Panel container, sidebar, content structure |
| 2 | Week 2-3 | All 11 settings categories |
| 3 | Week 2 | Reusable UI components |
| 4 | Week 3 | State management, integration |
| 5 | Week 4 | Styling, animations, themes |
| 6 | Week 4-5 | Testing, accessibility, polish |

**Total Estimated Time**: 4-5 weeks

---

## Success Metrics

1. **User Experience**
   - Settings accessible in ≤2 clicks
   - Search finds settings in <500ms
   - Panel opens/closes smoothly

2. **Technical**
   - 100% test coverage for critical paths
   - No performance regression
   - Bundle size increase <50KB

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Full keyboard navigation
   - Screen reader compatibility

---

## Next Steps

1. ✅ Create this roadmap document
2. ⬜ Review and approve roadmap
3. ⬜ Create base component structure (Phase 1)
4. ⬜ Implement settings icon toggle
5. ⬜ Build sidebar navigation
6. ⬜ Migrate existing settings to new structure

---

## References

- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- TRAE Settings UI (design reference - see attached image)

---

*Last Updated: February 1, 2026*
*Author: CodeBuddy Development Team*
