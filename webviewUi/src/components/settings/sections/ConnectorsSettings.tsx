import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl
} from '../ui';
import {
  GoogleDriveIcon,
  GmailIcon,
  GitHubIcon,
  SlackIcon,
  JiraIcon,
  NotionIcon,
  LinearIcon,
  AsanaIcon,
  TrelloIcon,
  GitLabIcon,
  ZoomIcon,
  MicrosoftTeamsIcon,
  DiscordIcon,
  ConfluenceIcon,
  MySQLIcon,
  RedisIcon,
  MongoDBIcon,
  N8nIcon
} from '../icons';
import { vscode } from '../../../utils/vscode';

// Interfaces
interface Connector {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: "mcp" | "skill";
  status: "connected" | "disconnected" | "error" | "configuring";
  config?: any;
}

interface ConnectorsSettingsProps {
  searchQuery: string;
}

// Styled Components
const ConnectorIconWrapper = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: var(--vscode-foreground);
  opacity: 0.8;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ConnectorRow = styled(SettingsRow)`
  align-items: center;
`;

const StatusBadge = styled.span<{ status: string }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-right: 12px;
  background: ${props => {
    switch (props.status) {
      case 'connected': return 'rgba(34, 197, 94, 0.15)';
      case 'configuring': return 'rgba(234, 179, 8, 0.15)';
      case 'error': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'connected': return '#22c55e';
      case 'configuring': return '#eab308';
      case 'error': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.5)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'connected': return 'rgba(34, 197, 94, 0.2)';
      case 'configuring': return 'rgba(234, 179, 8, 0.2)';
      case 'error': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

export const ConnectorsSettings: React.FC<ConnectorsSettingsProps> = ({ searchQuery }) => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const vsCode = vscode;

  const handleConnect = (id: string) => {
    vsCode.postMessage({
      command: "connect-connector",
      id,
      config: {} // TODO: Open configuration modal
    });
  };

  const handleDisconnect = (id: string) => {
    vsCode.postMessage({
      command: "disconnect-connector",
      id
    });
  };

  const handleConfigure = (id: string) => {
    vsCode.postMessage({
      command: "configure-connector",
      id
    });
  };

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "connectors-list":
          if (message.connectors) {
            setConnectors(message.connectors);
          }
          break;
      }
    };

    window.addEventListener("message", messageHandler);
    
    // Initial fetch
    vsCode.postMessage({
      command: "get-connectors",
    });

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'google-drive': return <GoogleDriveIcon />;
      case 'gmail': return <GmailIcon />;
      case 'github': return <GitHubIcon />;
      case 'slack': return <SlackIcon />;
      case 'jira': return <JiraIcon />;
      case 'notion': return <NotionIcon />;
      case 'linear': return <LinearIcon />;
      case 'asana': return <AsanaIcon />;
      case 'trello': return <TrelloIcon />;
      case 'gitlab': return <GitLabIcon />;
      case 'zoom': return <ZoomIcon />;
      case 'microsoft-teams': return <MicrosoftTeamsIcon />;
      case 'discord': return <DiscordIcon />;
      case 'confluence': return <ConfluenceIcon />;
      case 'mysql': return <MySQLIcon />;
      case 'redis': return <RedisIcon />;
      case 'mongodb': return <MongoDBIcon />;
      case 'n8n': return <N8nIcon />;
      default: return <SettingsIcon />;
    }
  };

  // Helper for default icon if not found in the switch
  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );

  const filteredConnectors = connectors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SettingsSection>
      <SectionTitle>Available Connectors</SectionTitle>
      
      {filteredConnectors.map(connector => (
        <ConnectorRow key={connector.id}>
          <ConnectorIconWrapper>
            {getIcon(connector.icon)}
          </ConnectorIconWrapper>
          
          <SettingInfo>
            <SettingLabel>{connector.name}</SettingLabel>
            <SettingDescription>{connector.description}</SettingDescription>
          </SettingInfo>
          
          <SettingControl>
            <StatusBadge status={connector.status}>
              {connector.status.charAt(0).toUpperCase() + connector.status.slice(1)}
            </StatusBadge>
            
            <ButtonGroup>
              {connector.status === 'connected' ? (
                <>
                  <VSCodeButton 
                    appearance="secondary" 
                    onClick={() => handleConfigure(connector.id)}
                    style={{ height: '28px', padding: '0 10px' }}
                  >
                    Configure
                  </VSCodeButton>
                  <VSCodeButton 
                    appearance="icon" 
                    onClick={() => handleDisconnect(connector.id)} 
                    title="Disconnect"
                    style={{ height: '28px', width: '28px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                      <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                  </VSCodeButton>
                </>
              ) : (
                <VSCodeButton 
                  appearance="primary" 
                  onClick={() => handleConnect(connector.id)}
                  style={{ height: '28px', padding: '0 12px' }}
                >
                  Connect
                </VSCodeButton>
              )}
            </ButtonGroup>
          </SettingControl>
        </ConnectorRow>
      ))}
    </SettingsSection>
  );
};
