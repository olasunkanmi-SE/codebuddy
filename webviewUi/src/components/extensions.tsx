import React, { useState } from "react";
import styled from "styled-components";

interface MCPServer {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "error";
  type: "filesystem" | "database" | "api" | "custom";
  icon?: string;
  config?: Record<string, any>;
}

interface CustomAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: "active" | "inactive";
  avatar?: string;
  capabilities?: string[];
}

interface ExtensionsProps {
  onAddMCPServer?: (server: MCPServer) => void;
  onAddAgent?: (agent: CustomAgent) => void;
}

const Container = styled.div`
  width: 100%;
  padding: 20px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 8px 0;
  text-align: left;
`;

const Subtitle = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  text-align: left;
  line-height: 1.5;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.08)' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? 'rgba(255, 255, 255, 0.6)' : 'transparent'};
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.$active ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -1px;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.04);
  }
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: left;
`;

const AddButton = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CardGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const CardInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: start;
  gap: 12px;
`;

const CardIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

const CardContent = styled.div`
  flex: 1;
  text-align: left;
`;

const CardTitle = styled.h4`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 4px 0;
`;

const CardDescription = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.4;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.$status) {
      case 'active': return 'rgba(34, 197, 94, 0.15)';
      case 'error': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'active': return 'rgba(34, 197, 94, 0.9)';
      case 'error': return 'rgba(239, 68, 68, 0.9)';
      default: return 'rgba(255, 255, 255, 0.6)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'active': return 'rgba(34, 197, 94, 0.3)';
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 255, 255, 0.15)';
    }
  }};
`;

const CardFooter = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const IconButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
`;

const EmptyTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
`;

const EmptyDescription = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 20px 0;
  line-height: 1.5;
`;

const MarketplaceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
`;

const MarketplaceCard = styled(Card)`
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const Tag = styled.span`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const InstallButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }
`;

export const Extensions: React.FC<ExtensionsProps> = ({ onAddMCPServer, onAddAgent }) => {
  const [activeTab, setActiveTab] = useState<"servers" | "agents" | "marketplace">("servers");
  
  // Mock data
  const mcpServers: MCPServer[] = [
    {
      id: "1",
      name: "Filesystem MCP",
      description: "Access and manipulate files in your workspace",
      status: "active",
      type: "filesystem",
      icon: "📁"
    },
    {
      id: "2",
      name: "PostgreSQL MCP",
      description: "Query and manage PostgreSQL databases",
      status: "inactive",
      type: "database",
      icon: "🗄️"
    }
  ];

  const customAgents: CustomAgent[] = [
    {
      id: "1",
      name: "Code Reviewer",
      description: "Specialized agent for code reviews and best practices",
      model: "GPT-4",
      status: "active",
      avatar: "👨‍💻",
      capabilities: ["Code Review", "Best Practices", "Security"]
    }
  ];

  const marketplace = [
    {
      id: "m1",
      name: "GitHub MCP Server",
      description: "Integrate with GitHub repos, issues, and PRs",
      icon: "🐙",
      tags: ["Git", "API", "Popular"],
      downloads: "12.5k"
    },
    {
      id: "m2",
      name: "Slack MCP Server",
      description: "Send messages and notifications to Slack channels",
      icon: "💬",
      tags: ["Communication", "API"],
      downloads: "8.2k"
    },
    {
      id: "m3",
      name: "Docker Agent",
      description: "Manage Docker containers and images",
      icon: "🐳",
      tags: ["DevOps", "Containers"],
      downloads: "6.1k"
    },
    {
      id: "m4",
      name: "Testing Agent",
      description: "Automated test generation and debugging",
      icon: "🧪",
      tags: ["Testing", "QA"],
      downloads: "4.8k"
    }
  ];

  return (
    <Container>
      <Header>
        <Title>Extensions & Integrations</Title>
        <Subtitle>
          Extend CodeBuddy with MCP servers, custom agents, and third-party integrations
        </Subtitle>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === "servers"} onClick={() => setActiveTab("servers")}>
          MCP Servers
        </Tab>
        <Tab $active={activeTab === "agents"} onClick={() => setActiveTab("agents")}>
          Custom Agents
        </Tab>
        <Tab $active={activeTab === "marketplace"} onClick={() => setActiveTab("marketplace")}>
          Marketplace
        </Tab>
      </TabContainer>

      {activeTab === "servers" && (
        <Section>
          <SectionHeader>
            <SectionTitle>Installed MCP Servers</SectionTitle>
            <AddButton onClick={() => onAddMCPServer?.({ 
              id: Date.now().toString(), 
              name: "New Server", 
              description: "", 
              status: "inactive",
              type: "custom"
            })}>
              <span>+</span>
              <span>Add Server</span>
            </AddButton>
          </SectionHeader>

          {mcpServers.length > 0 ? (
            <CardGrid>
              {mcpServers.map((server) => (
                <Card key={server.id}>
                  <CardHeader>
                    <CardInfo>
                      <CardIcon>{server.icon}</CardIcon>
                      <CardContent>
                        <CardTitle>{server.name}</CardTitle>
                        <CardDescription>{server.description}</CardDescription>
                      </CardContent>
                    </CardInfo>
                    <StatusBadge $status={server.status}>{server.status}</StatusBadge>
                  </CardHeader>
                  <CardFooter>
                    <IconButton>Configure</IconButton>
                    <IconButton>Logs</IconButton>
                    <IconButton>Remove</IconButton>
                  </CardFooter>
                </Card>
              ))}
            </CardGrid>
          ) : (
            <EmptyState>
              <EmptyIcon>🔌</EmptyIcon>
              <EmptyTitle>No MCP Servers Installed</EmptyTitle>
              <EmptyDescription>
                MCP (Model Context Protocol) servers extend CodeBuddy's capabilities by connecting to external tools and services.
              </EmptyDescription>
              <AddButton onClick={() => onAddMCPServer?.({ 
                id: Date.now().toString(), 
                name: "New Server", 
                description: "", 
                status: "inactive",
                type: "custom"
              })}>
                <span>+</span>
                <span>Add Your First Server</span>
              </AddButton>
            </EmptyState>
          )}
        </Section>
      )}

      {activeTab === "agents" && (
        <Section>
          <SectionHeader>
            <SectionTitle>Custom Agents</SectionTitle>
            <AddButton onClick={() => onAddAgent?.({
              id: Date.now().toString(),
              name: "New Agent",
              description: "",
              model: "GPT-4",
              status: "inactive"
            })}>
              <span>+</span>
              <span>Create Agent</span>
            </AddButton>
          </SectionHeader>

          {customAgents.length > 0 ? (
            <CardGrid>
              {customAgents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <CardInfo>
                      <CardIcon>{agent.avatar}</CardIcon>
                      <CardContent>
                        <CardTitle>{agent.name}</CardTitle>
                        <CardDescription>{agent.description}</CardDescription>
                        <TagsContainer>
                          {agent.capabilities?.map((cap, idx) => (
                            <Tag key={idx}>{cap}</Tag>
                          ))}
                        </TagsContainer>
                      </CardContent>
                    </CardInfo>
                    <StatusBadge $status={agent.status}>{agent.status}</StatusBadge>
                  </CardHeader>
                  <CardFooter>
                    <IconButton>Edit</IconButton>
                    <IconButton>Test</IconButton>
                    <IconButton>Delete</IconButton>
                  </CardFooter>
                </Card>
              ))}
            </CardGrid>
          ) : (
            <EmptyState>
              <EmptyIcon>🤖</EmptyIcon>
              <EmptyTitle>No Custom Agents</EmptyTitle>
              <EmptyDescription>
                Create specialized AI agents with custom instructions, tools, and capabilities tailored to your workflow.
              </EmptyDescription>
              <AddButton onClick={() => onAddAgent?.({
                id: Date.now().toString(),
                name: "New Agent",
                description: "",
                model: "GPT-4",
                status: "inactive"
              })}>
                <span>+</span>
                <span>Create Your First Agent</span>
              </AddButton>
            </EmptyState>
          )}
        </Section>
      )}

      {activeTab === "marketplace" && (
        <Section>
          <SectionHeader>
            <SectionTitle>Discover Extensions</SectionTitle>
          </SectionHeader>

          <MarketplaceGrid>
            {marketplace.map((item) => (
              <MarketplaceCard key={item.id}>
                <CardHeader>
                  <CardInfo>
                    <CardIcon>{item.icon}</CardIcon>
                    <CardContent>
                      <CardTitle>{item.name}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                      <TagsContainer>
                        {item.tags.map((tag, idx) => (
                          <Tag key={idx}>{tag}</Tag>
                        ))}
                      </TagsContainer>
                    </CardContent>
                  </CardInfo>
                </CardHeader>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px', textAlign: 'left' }}>
                  ⬇️ {item.downloads} downloads
                </div>
                <InstallButton>Install</InstallButton>
              </MarketplaceCard>
            ))}
          </MarketplaceGrid>
        </Section>
      )}
    </Container>
  );
};