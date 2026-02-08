# Connectors Feature Roadmap

This document outlines the roadmap for implementing the "Connectors" feature in CodeBuddy. This feature allows users to easily manage integrations with external services (like Google Drive, GitHub, etc.) which are powered by the Model Context Protocol (MCP) or internal Skills.

## Phase 1: Foundation & Backend Architecture

**Goal**: Establish the backend service to manage connectors and integrate with the existing MCP architecture.

### 1.1 Define Connector Data Model
- Create interfaces for `Connector`, `ConnectorConfig`, and `ConnectorStatus`.
- **Connector Types**:
  - `Built-in`: Pre-configured MCP servers (e.g., Google Drive, GitHub).
  - `Custom`: User-defined MCP servers.
  - `Skill`: Existing CodeBuddy skills (optional, for unification).

### 1.2 Implement `ConnectorService`
- **Responsibilities**:
  - Registry of available connectors.
  - State management (Connected, Disconnected, Error).
  - Configuration persistence.
  - Interfacing with `MCPService` to start/stop servers.
- **Key Methods**:
  - `getConnectors()`: Returns list of all connectors with status.
  - `connect(connectorId, config)`: Enables and starts the connector.
  - `disconnect(connectorId)`: Stops and disables the connector.
  - `saveConfig(connectorId, config)`: Updates connector settings.

### 1.3 MCP Service Integration
- Update `MCPService` to allow dynamic addition/removal of servers via the `ConnectorService`.
- Ensure `ConnectorService` can "drive" the `MCPService`.

## Phase 2: Frontend UI (Webview)

**Goal**: Create a user-friendly interface for managing connectors, matching the provided design.

### 2.1 Connectors View
- Add a new navigation item/tab for "Connectors".
- Create `ConnectorsPage` component.
- Implement `ConnectorList` to display items.

### 2.2 Connector Item Component
- Display: Icon, Name, Description (optional), Status indicator.
- Actions:
  - **Connect/Disconnect** toggle or button.
  - **Configure** button (opens a modal/form).

### 2.3 Configuration UI
- Create a generic configuration form generator based on the Connector's required config (e.g., API Keys, Env Vars).
- Implement "Add Custom Connector" flow.

## Phase 3: Integration & "Batteries Included"

**Goal**: robust integration and providing useful default connectors.

### 3.1 Wire Frontend to Backend
- Implement message passing between Webview and Extension for connector actions (`connect`, `disconnect`, `save-config`).
- Real-time status updates (e.g., showing "Connecting..." spinner).

### 3.2 Implement Core Connectors
- **GitHub**: Map to `mcp/github` or similar.
- **Google Drive**: Map to `mcp/gdrive` (if available) or similar.
- **Postgres**: Map to `mcp/postgres`.
- **Filesystem**: Expose local FS configuration.

### 3.3 Testing & Validation
- Verify connection flows.
- specific error handling for failed connections.
- Ensure persistence works across VS Code restarts.

## Future Enhancements
- **Auth Integration**: OAuth flows for connectors that require it (vs manual token entry).
- **Connector Marketplace**: Fetch available connectors from a remote registry.
- **Skill Unification**: Merge existing `SkillManager` into the Connectors framework for a unified experience.
