import React from 'react';
import styled from 'styled-components';
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

// Interfaces
export interface Connector {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: "mcp" | "skill";
  status: "connected" | "disconnected" | "error" | "configuring";
  config?: any;
}

interface ConnectorsProps {
  connectors: Connector[];
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onConfigure: (id: string) => void;
  onClose: () => void;
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  padding: 24px;
  box-sizing: border-box;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
  line-height: 1.5;
  max-width: 600px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--vscode-descriptionForeground);
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
    color: var(--vscode-foreground);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const Card = styled.div`
  background: var(--vscode-editor-inactiveSelectionBackground);
  border: 1px solid var(--vscode-widget-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: var(--vscode-focusBorder);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--vscode-editor-background);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vscode-widget-border);
  font-size: 24px;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardTitle = styled.h3`
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
`;

const CardDescription = styled.p`
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--vscode-widget-border);
`;

const StatusIndicator = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => {
      switch (props.status) {
        case 'connected': return '#22c55e';
        case 'disconnected': return '#9ca3af';
        case 'error': return '#ef4444';
        case 'configuring': return '#eab308';
        default: return '#9ca3af';
      }
    }};
  }
  
  color: ${props => {
    switch (props.status) {
      case 'connected': return '#22c55e';
      case 'disconnected': return 'var(--vscode-descriptionForeground)';
      case 'error': return '#ef4444';
      case 'configuring': return '#eab308';
      default: return 'var(--vscode-descriptionForeground)';
    }
  }};
`;

const getIcon = (iconName?: string) => {
  const size = 24;
  switch (iconName) {
    case 'google-drive': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10.5h-6l-3-5.5h6l3 5.5z"/>
        <path d="M16 10.5l-3 5.5-6-10.5"/>
        <path d="M7 16l3-5.5-3-5.5-3 5.5 3 5.5z"/>
        <path d="M13 21.5h-6l-3-5.5h6l3 5.5z"/>
      </svg>
    );
    case 'github': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
      </svg>
    );
    case 'gitlab': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"></path>
      </svg>
    );
    case 'gmail': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    );
    case 'calendar': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    );
    case 'database': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      </svg>
    );
    case 'slack': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"></path>
        <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
        <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"></path>
        <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"></path>
        <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"></path>
        <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"></path>
        <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"></path>
        <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"></path>
      </svg>
    );
    case 'jira': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 2h-1a2 2 0 0 0-2 2v7.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V4a2 2 0 0 0-2-2Z"></path>
        <path d="M17 11.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v7.5Z"></path>
        <path d="M5.5 12h-1a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-5Z"></path>
      </svg>
    );
    case 'linear': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
      </svg>
    );
    case 'notion': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"></path>
        <path d="M14 13h-4"></path>
        <path d="M14 17h-4"></path>
        <path d="M10 9h4"></path>
      </svg>
    );
    case 'sentry': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-2 4h4v4h-4v-4z"></path>
      </svg>
    );
    case 'aws': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.2 4 6 3.2-2 2-4 1.5L1 19.6c0 .8.7 1.9 1.5 1.9.7 0 1.9-.3 2.5-.9L7 18.5l1 2 2.5 1.5L15 21l.9-1.3c.4-1.1.8-2.6 1.9-3.5z"></path>
        <path d="M15 8c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z"></path>
      </svg>
    );
    case 'kubernetes': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 2v7"></path>
        <path d="M12 15v7"></path>
        <path d="M20.66 7 15 10.27"></path>
        <path d="M9 13.73 3.34 17"></path>
        <path d="M3.34 7 9 10.27"></path>
        <path d="M15 13.73 20.66 17"></path>
      </svg>
    );
    default: return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"></path>
      </svg>
    );
  }
};

export const Connectors: React.FC<ConnectorsProps> = ({
  connectors,
  onConnect,
  onDisconnect,
  onConfigure,
  onClose
}) => {
  return (
    <Container>
      <Header>
        <TitleSection>
          <Title>Connectors</Title>
          <Subtitle>
            Manage your integrations with external services and tools. 
            Connect your favorite apps to enhance your coding workflow.
          </Subtitle>
        </TitleSection>
        <CloseButton onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </CloseButton>
      </Header>

      <Grid>
        {connectors.map(connector => (
          <Card key={connector.id}>
            <CardHeader>
              <IconWrapper>
                {getIcon(connector.icon)}
              </IconWrapper>
              <CardContent>
                <CardTitle>{connector.name}</CardTitle>
                <CardDescription>{connector.description}</CardDescription>
              </CardContent>
            </CardHeader>
            
            <CardFooter>
              <StatusIndicator status={connector.status}>
                {connector.status.charAt(0).toUpperCase() + connector.status.slice(1)}
              </StatusIndicator>
              
              {connector.status === 'connected' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <VSCodeButton 
                    appearance="secondary" 
                    onClick={() => onConfigure(connector.id)}
                  >
                    Configure
                  </VSCodeButton>
                  <VSCodeButton 
                    appearance="icon" 
                    onClick={() => onDisconnect(connector.id)}
                    title="Disconnect"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                      <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                  </VSCodeButton>
                </div>
              ) : (
                <VSCodeButton 
                  appearance="primary" 
                  onClick={() => onConnect(connector.id)}
                >
                  Connect
                </VSCodeButton>
              )}
            </CardFooter>
          </Card>
        ))}
      </Grid>
    </Container>
  );
};
