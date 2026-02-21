import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Button,
  Badge,
  Toggle,
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
} from '../ui';
import { SettingsIcon } from '../icons';
import { useSettings } from '../SettingsContext';

interface MCPSettingsProps {
  searchQuery: string;
}

// MCP Tool from backend
interface MCPTool {
  name: string;
  description?: string;
  serverName: string;
  enabled: boolean;
}

// MCP Server with tools
interface MCPServer {
  id: string;
  name: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  enabled: boolean;
  tools: MCPTool[];
  toolCount: number;
}

// Styled Components
const ServerCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
`;

const ServerHeader = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const ServerIcon = styled.div<{ $status: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => {
    switch (props.$status) {
      case 'connected': return 'rgba(34, 197, 94, 0.15)';
      case 'connecting': return 'rgba(234, 179, 8, 0.15)';
      case 'error': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(255, 255, 255, 0.08)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.$status) {
      case 'connected': return '#22c55e';
      case 'connecting': return '#eab308';
      case 'error': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.5)';
    }
  }};
`;

const ServerInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ServerName = styled.h4`
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ServerDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const ServerMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToolCount = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const ExpandIcon = styled.div<{ $isExpanded: boolean }>`
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.2s ease;
  transform: rotate(${props => props.$isExpanded ? '180deg' : '0deg'});
`;

const ToolsContainer = styled.div<{ $isExpanded: boolean }>`
  max-height: ${props => props.$isExpanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  border-top: ${props => props.$isExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none'};
`;

const ToolsList = styled.div`
  padding: 8px 16px 16px;
`;

const ToolItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const ToolInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToolName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  font-family: 'Monaco', 'Menlo', monospace;
`;

const ToolDescription = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
`;

const RefreshButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusDot = styled.span<{ $status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$status) {
      case 'connected': return '#22c55e';
      case 'connecting': return '#eab308';
      case 'error': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.3)';
    }
  }};
`;

/**
 * MCP Preset received from backend.
 * Mirrors MCPPreset in src/MCP/presets.ts — keep in sync.
 */
interface MCPPreset {
  id: string;
  name: string;
  description: string;
  category: 'browser' | 'database' | 'devtools' | 'productivity';
  package: string;
  installed: boolean;
  docsUrl?: string;
}

// Styled components for presets
const PresetCard = styled.div<{ $installed: boolean }>`
  background: ${props => props.$installed
    ? 'rgba(34, 197, 94, 0.05)'
    : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$installed
    ? 'rgba(34, 197, 94, 0.2)'
    : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: ${props => props.$installed
      ? 'rgba(34, 197, 94, 0.35)'
      : 'rgba(255, 255, 255, 0.15)'};
  }
`;

const PresetIcon = styled.div<{ $category: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => {
    switch (props.$category) {
      case 'browser': return 'rgba(99, 102, 241, 0.15)';
      case 'database': return 'rgba(234, 179, 8, 0.15)';
      case 'devtools': return 'rgba(34, 197, 94, 0.15)';
      default: return 'rgba(255, 255, 255, 0.08)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const PresetInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PresetName = styled.h4`
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

const PresetDescription = styled.p`
  margin: 0 0 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
`;

const PresetPackage = styled.code`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
`;

const PresetActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const AddButton = styled(Button)`
  white-space: nowrap;
`;

const RemoveButton = styled(Button)`
  white-space: nowrap;
  opacity: 0.7;
  &:hover { opacity: 1; }
`;

const categoryIcons: Record<string, string> = {
  browser: '🌐',
  database: '🗄️',
  devtools: '🔧',
  productivity: '⚡',
};

export const MCPSettings: React.FC<MCPSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const { handlers } = useSettings();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [presets, setPresets] = useState<MCPPreset[]>([]);
  const [addingPreset, setAddingPreset] = useState<string | null>(null);

  // Request MCP data from backend
  const fetchMCPData = useCallback(() => {
    handlers.postMessage({ command: 'mcp-get-servers' });
    handlers.postMessage({ command: 'mcp-get-presets' });
  }, [handlers]);

  // Listen for MCP data from backend
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.command === 'mcp-servers-data') {
        setServers(message.data?.servers || []);
        setIsLoading(false);
        setIsRefreshing(false);
      }
      
      if (message.command === 'mcp-presets-data') {
        setPresets(message.data?.presets || []);
      }

      if (message.command === 'mcp-preset-added') {
        setAddingPreset(null);
        // Mark preset as installed and refresh servers
        setPresets(prev => prev.map(p =>
          p.id === message.data?.presetId ? { ...p, installed: true } : p
        ));
        handlers.postMessage({ command: 'mcp-get-servers' });
      }

      if (message.command === 'mcp-preset-removed') {
        setPresets(prev => prev.map(p =>
          p.id === message.data?.presetId ? { ...p, installed: false } : p
        ));
        handlers.postMessage({ command: 'mcp-get-servers' });
      }

      if (message.command === 'mcp-preset-error') {
        setAddingPreset(null);
      }

      if (message.command === 'mcp-tool-updated') {
        // Update local state when a tool is toggled
        setServers(prev => prev.map(server => {
          if (server.id === message.data?.serverName) {
            return {
              ...server,
              tools: server.tools.map(tool => 
                tool.name === message.data?.toolName 
                  ? { ...tool, enabled: message.data?.enabled }
                  : tool
              )
            };
          }
          return server;
        }));
      }
      
      if (message.command === 'mcp-server-updated') {
        // Update server enabled state
        setServers(prev => prev.map(server => 
          server.id === message.data?.serverName 
            ? { ...server, enabled: message.data?.enabled }
            : server
        ));
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Initial fetch
    fetchMCPData();

    return () => window.removeEventListener('message', handleMessage);
  }, [fetchMCPData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    handlers.postMessage({ command: 'mcp-refresh-tools' });
  };

  const handleAddPreset = (presetId: string) => {
    setAddingPreset(presetId);
    handlers.postMessage({ command: 'mcp-add-preset', message: { presetId } });
  };

  const handleRemovePreset = (presetId: string) => {
    handlers.postMessage({ command: 'mcp-remove-preset', message: { presetId } });
  };

  const toggleServerExpanded = (serverId: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }
      return next;
    });
  };

  const handleToggleServer = (serverId: string, enabled: boolean) => {
    handlers.postMessage({ 
      command: 'mcp-toggle-server', 
      message: { serverName: serverId, enabled } 
    });
    // Optimistic update
    setServers(prev => prev.map(server => 
      server.id === serverId ? { ...server, enabled } : server
    ));
  };

  const handleToggleTool = (serverName: string, toolName: string, enabled: boolean) => {
    handlers.postMessage({ 
      command: 'mcp-toggle-tool', 
      message: { serverName, toolName, enabled } 
    });
    // Optimistic update
    setServers(prev => prev.map(server => {
      if (server.id === serverName) {
        return {
          ...server,
          tools: server.tools.map(tool => 
            tool.name === toolName ? { ...tool, enabled } : tool
          )
        };
      }
      return server;
    }));
  };

  const totalTools = servers.reduce((sum, s) => sum + s.toolCount, 0);
  const enabledTools = servers.reduce((sum, s) => 
    sum + s.tools.filter(t => t.enabled).length, 0
  );

  return (
    <>
      <SettingsSection>
        <SectionTitle>MCP Servers</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Model Context Protocol</SettingLabel>
            <SettingDescription>
              MCP servers extend CodeBuddy with external tools. 
              {totalTools > 0 && ` ${enabledTools}/${totalTools} tools enabled.`}
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <RefreshButton 
              onClick={handleRefresh} 
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                  Refreshing...
                </>
              ) : (
                <>
                  <span>⟳</span>
                  Refresh Tools
                </>
              )}
            </RefreshButton>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>
          Connected Servers
          {servers.length > 0 && (
            <Badge $variant="default" style={{ marginLeft: '8px' }}>
              {servers.filter(s => s.status === 'connected').length}/{servers.length}
            </Badge>
          )}
        </SectionTitle>

        {isLoading ? (
          <LoadingSpinner>
            <span>Loading MCP servers...</span>
          </LoadingSpinner>
        ) : servers.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>
              <SettingsIcon name="server" size={48} />
            </EmptyStateIcon>
            <EmptyStateTitle>No MCP Servers Configured</EmptyStateTitle>
            <EmptyStateDescription>
              Configure MCP servers in your VS Code settings to extend CodeBuddy with external tools.
              <br /><br />
              <code style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                Settings → CodeBuddy → MCP Servers
              </code>
            </EmptyStateDescription>
          </EmptyState>
        ) : (
          servers.map((server) => {
            const isExpanded = expandedServers.has(server.id);
            const enabledToolCount = server.tools.filter(t => t.enabled).length;
            
            return (
              <ServerCard key={server.id}>
                <ServerHeader 
                  $isExpanded={isExpanded}
                  onClick={() => toggleServerExpanded(server.id)}
                >
                  <ServerIcon $status={server.status}>
                    <SettingsIcon name="server" size={20} />
                  </ServerIcon>
                  <ServerInfo>
                    <ServerName>
                      {server.name}
                      <StatusDot $status={server.status} />
                    </ServerName>
                    <ServerDescription>
                      {server.description || `MCP Server: ${server.id}`}
                    </ServerDescription>
                  </ServerInfo>
                  <ServerMeta>
                    <ToolCount>
                      {enabledToolCount}/{server.toolCount} tools
                    </ToolCount>
                    <Badge
                      $variant={
                        server.status === 'connected' ? 'success' :
                        server.status === 'connecting' ? 'warning' :
                        server.status === 'error' ? 'error' : 'default'
                      }
                    >
                      {server.status}
                    </Badge>
                    <Toggle 
                      checked={server.enabled} 
                      onChange={(enabled) => {
                        // Stop propagation to prevent expanding
                        handleToggleServer(server.id, enabled);
                      }}
                    />
                    <ExpandIcon $isExpanded={isExpanded}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </ExpandIcon>
                  </ServerMeta>
                </ServerHeader>

                <ToolsContainer $isExpanded={isExpanded}>
                  <ToolsList>
                    {server.tools.length === 0 ? (
                      <ToolItem>
                        <ToolInfo>
                          <ToolDescription>No tools available from this server</ToolDescription>
                        </ToolInfo>
                      </ToolItem>
                    ) : (
                      server.tools.map((tool) => (
                        <ToolItem key={`${server.id}-${tool.name}`}>
                          <ToolInfo>
                            <ToolName>{tool.name}</ToolName>
                            {tool.description && (
                              <ToolDescription>{tool.description}</ToolDescription>
                            )}
                          </ToolInfo>
                          <Toggle 
                            checked={tool.enabled} 
                            onChange={(enabled) => handleToggleTool(server.id, tool.name, enabled)}
                            disabled={!server.enabled}
                          />
                        </ToolItem>
                      ))
                    )}
                  </ToolsList>
                </ToolsContainer>
              </ServerCard>
            );
          })
        )}
      </SettingsSection>

      {presets.length > 0 && (
        <SettingsSection>
          <SectionTitle>Recommended Servers</SectionTitle>
          {presets.map((preset) => (
            <PresetCard key={preset.id} $installed={preset.installed}>
              <PresetIcon $category={preset.category}>
                {categoryIcons[preset.category] || '📦'}
              </PresetIcon>
              <PresetInfo>
                <PresetName>{preset.name}</PresetName>
                <PresetDescription>{preset.description}</PresetDescription>
                <PresetPackage>{preset.package}</PresetPackage>
              </PresetInfo>
              <PresetActions>
                {preset.installed ? (
                  <>
                    <Badge $variant="success">Installed</Badge>
                    <RemoveButton onClick={() => handleRemovePreset(preset.id)}>
                      Remove
                    </RemoveButton>
                  </>
                ) : (
                  <AddButton
                    onClick={() => handleAddPreset(preset.id)}
                    disabled={addingPreset === preset.id}
                  >
                    {addingPreset === preset.id ? 'Adding...' : 'Add'}
                  </AddButton>
                )}
              </PresetActions>
            </PresetCard>
          ))}
        </SettingsSection>
      )}

      <SettingsSection>
        <SectionTitle>Configuration</SectionTitle>
        <SettingsRow>
          <SettingInfo>
            <SettingLabel>MCP Server Settings</SettingLabel>
            <SettingDescription>
              Add or modify MCP server configurations in VS Code settings
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button onClick={() => handlers.postMessage({ command: 'open-mcp-settings' })}>
              Open Settings
            </Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
