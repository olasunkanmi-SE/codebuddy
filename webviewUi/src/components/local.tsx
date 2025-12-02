import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

interface LocalModel {
    id: string;
    name: string;
    provider: "ollama" | "llama-cpp" | "docker" | "custom";
    size: string;
    status: "running" | "stopped" | "downloading" | "error";
    port?: number;
    memory?: string;
    downloadProgress?: number;
}

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

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

const SetupBanner = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: start;
  gap: 16px;
`;

const BannerIcon = styled.div`
  font-size: 32px;
  flex-shrink: 0;
`;

const BannerContent = styled.div`
  flex: 1;
  text-align: left;
`;

const BannerTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: rgba(96, 165, 250, 0.9);
  margin: 0 0 6px 0;
`;

const BannerText = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px 0;
  line-height: 1.5;
`;

const BannerButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(96, 165, 250, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.6);
  }
`;

const SecondaryButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
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

const ModelCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 18px;
  margin-bottom: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

const ModelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const ModelInfo = styled.div`
  flex: 1;
  text-align: left;
`;

const ModelName = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProviderBadge = styled.span`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const ModelMeta = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${props => {
        switch (props.$status) {
            case 'running': return 'rgba(34, 197, 94, 0.15)';
            case 'downloading': return 'rgba(59, 130, 246, 0.15)';
            case 'error': return 'rgba(239, 68, 68, 0.15)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
  color: ${props => {
        switch (props.$status) {
            case 'running': return 'rgba(34, 197, 94, 0.9)';
            case 'downloading': return 'rgba(96, 165, 250, 0.9)';
            case 'error': return 'rgba(239, 68, 68, 0.9)';
            default: return 'rgba(255, 255, 255, 0.6)';
        }
    }};
  border: 1px solid ${props => {
        switch (props.$status) {
            case 'running': return 'rgba(34, 197, 94, 0.3)';
            case 'downloading': return 'rgba(59, 130, 246, 0.3)';
            case 'error': return 'rgba(239, 68, 68, 0.3)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
`;

const StatusDot = styled.span<{ $status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: ${props => props.$status === 'running' ? pulse : 'none'} 2s ease-in-out infinite;
`;

const ModelActions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(96, 165, 250, 0.8));
  transition: width 0.3s ease;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 10px;
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

const SetupCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 16px;
`;

const SetupStep = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  text-align: left;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StepNumber = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 6px 0;
`;

const StepDescription = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 10px 0;
  line-height: 1.5;
`;

const CodeBlock = styled.pre`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  overflow-x: auto;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;

  code {
    color: rgba(96, 165, 250, 0.9);
  }
`;

const CopyButton = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const LocalModels: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"models" | "setup" | "docker">("models");
    const [models] = useState<LocalModel[]>([
        {
            id: "1",
            name: "CodeLlama 7B",
            provider: "ollama",
            size: "3.8 GB",
            status: "running",
            port: 11434,
            memory: "4.2 GB"
        },
        {
            id: "2",
            name: "Mistral 7B",
            provider: "docker",
            size: "4.1 GB",
            status: "stopped",
            port: 8080
        }
    ]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Container>
            <Header>
                <Title>Local Models</Title>
                <Subtitle>
                    Run AI models locally for complete privacy and offline access. No API keys required.
                </Subtitle>
            </Header>

            <SetupBanner>
                <BannerIcon>🐳</BannerIcon>
                <BannerContent>
                    <BannerTitle>Run Models with Docker</BannerTitle>
                    <BannerText>
                        Easily deploy local LLMs using Docker containers. Get started in minutes with pre-configured setups.
                    </BannerText>
                    <BannerButtons>
                        <PrimaryButton>Quick Setup Guide</PrimaryButton>
                        <SecondaryButton>View Docker Hub</SecondaryButton>
                    </BannerButtons>
                </BannerContent>
            </SetupBanner>

            <TabContainer>
                <Tab $active={activeTab === "models"} onClick={() => setActiveTab("models")}>
                    My Models
                </Tab>
                <Tab $active={activeTab === "setup"} onClick={() => setActiveTab("setup")}>
                    Setup Guide
                </Tab>
                <Tab $active={activeTab === "docker"} onClick={() => setActiveTab("docker")}>
                    Docker Config
                </Tab>
            </TabContainer>

            {activeTab === "models" && (
                <Section>
                    <SectionHeader>
                        <SectionTitle>Installed Models</SectionTitle>
                        <SecondaryButton>+ Add Model</SecondaryButton>
                    </SectionHeader>

                    {models.length > 0 ? (
                        models.map(model => (
                            <ModelCard key={model.id}>
                                <ModelHeader>
                                    <ModelInfo>
                                        <ModelName>
                                            {model.name}
                                            <ProviderBadge>{model.provider}</ProviderBadge>
                                        </ModelName>
                                        <ModelMeta>
                                            <span>📦 {model.size}</span>
                                            {model.port && <span>🔌 Port {model.port}</span>}
                                            {model.memory && <span>💾 {model.memory}</span>}
                                        </ModelMeta>
                                    </ModelInfo>
                                    <StatusBadge $status={model.status}>
                                        <StatusDot $status={model.status} />
                                        {model.status}
                                    </StatusBadge>
                                </ModelHeader>

                                {model.status === "downloading" && model.downloadProgress && (
                                    <ProgressBar>
                                        <ProgressFill $progress={model.downloadProgress} />
                                    </ProgressBar>
                                )}

                                <ModelActions>
                                    {model.status === "stopped" && (
                                        <ActionButton>▶️ Start</ActionButton>
                                    )}
                                    {model.status === "running" && (
                                        <ActionButton>⏸️ Stop</ActionButton>
                                    )}
                                    <ActionButton>⚙️ Configure</ActionButton>
                                    <ActionButton>📊 Logs</ActionButton>
                                    <ActionButton>🗑️ Remove</ActionButton>
                                </ModelActions>
                            </ModelCard>
                        ))
                    ) : (
                        <EmptyState>
                            <EmptyIcon>💻</EmptyIcon>
                            <EmptyTitle>No Local Models Installed</EmptyTitle>
                            <EmptyDescription>
                                Install a local model to use CodeBuddy completely offline and private
                            </EmptyDescription>
                            <PrimaryButton>Get Started</PrimaryButton>
                        </EmptyState>
                    )}
                </Section>
            )}

            {activeTab === "setup" && (
                <Section>
                    <SetupCard>
                        <SetupStep>
                            <StepNumber>1</StepNumber>
                            <StepContent>
                                <StepTitle>Install Docker Desktop</StepTitle>
                                <StepDescription>
                                    Download and install Docker Desktop for your operating system. Docker provides an easy way to run containerized applications.
                                </StepDescription>
                                <SecondaryButton onClick={() => window.open('https://www.docker.com/products/docker-desktop', '_blank')}>
                                    Download Docker Desktop
                                </SecondaryButton>
                            </StepContent>
                        </SetupStep>

                        <SetupStep>
                            <StepNumber>2</StepNumber>
                            <StepContent>
                                <StepTitle>Pull a Model Container</StepTitle>
                                <StepDescription>
                                    Choose from popular pre-configured models. Run this command in your terminal:
                                </StepDescription>
                                <CodeBlock>
                                    <code>docker pull ollama/ollama</code>
                                </CodeBlock>
                                <CopyButton onClick={() => handleCopy('docker pull ollama/ollama')}>
                                    📋 Copy Command
                                </CopyButton>
                            </StepContent>
                        </SetupStep>

                        <SetupStep>
                            <StepNumber>3</StepNumber>
                            <StepContent>
                                <StepTitle>Start the Container</StepTitle>
                                <StepDescription>
                                    Launch the container with the appropriate port mapping:
                                </StepDescription>
                                <CodeBlock>
                                    <code>{`docker run -d -p 11434:11434 --name ollama ollama/ollama`}</code>
                                </CodeBlock>
                                <CopyButton onClick={() => handleCopy('docker run -d -p 11434:11434 --name ollama ollama/ollama')}>
                                    📋 Copy Command
                                </CopyButton>
                            </StepContent>
                        </SetupStep>

                        <SetupStep>
                            <StepNumber>4</StepNumber>
                            <StepContent>
                                <StepTitle>Pull a Model</StepTitle>
                                <StepDescription>
                                    Download a specific model (e.g., CodeLlama, Mistral, Llama2):
                                </StepDescription>
                                <CodeBlock>
                                    <code>{`docker exec ollama ollama pull codellama`}</code>
                                </CodeBlock>
                                <CopyButton onClick={() => handleCopy('docker exec ollama ollama pull codellama')}>
                                    📋 Copy Command
                                </CopyButton>
                            </StepContent>
                        </SetupStep>

                        <SetupStep>
                            <StepNumber>5</StepNumber>
                            <StepContent>
                                <StepTitle>Connect CodeBuddy</StepTitle>
                                <StepDescription>
                                    Configure CodeBuddy to use your local model. Set the endpoint to:
                                </StepDescription>
                                <CodeBlock>
                                    <code>http://localhost:11434</code>
                                </CodeBlock>
                                <PrimaryButton style={{ marginTop: '12px' }}>
                                    Configure in Settings
                                </PrimaryButton>
                            </StepContent>
                        </SetupStep>
                    </SetupCard>
                </Section>
            )}

            {activeTab === "docker" && (
                <Section>
                    <SetupCard>
                        <SectionTitle style={{ marginBottom: '20px' }}>Docker Compose Configuration</SectionTitle>
                        <StepDescription>
                            Use this docker-compose.yml file for easy deployment with GPU support:
                        </StepDescription>
                        <CodeBlock>
                            {`version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  ollama_data:`}
                        </CodeBlock>
                        <CopyButton onClick={() => handleCopy(`version: '3.8'\nservices:\n  ollama:\n    image: ollama/ollama\n    ports:\n      - "11434:11434"\n    volumes:\n      - ollama_data:/root/.ollama\n    deploy:\n      resources:\n        reservations:\n          devices:\n            - driver: nvidia\n              count: 1\n              capabilities: [gpu]\n    restart: unless-stopped\n\nvolumes:\n  ollama_data:`)}>
                            📋 Copy Configuration
                        </CopyButton>

                        <div style={{ marginTop: '32px' }}>
                            <StepTitle>Alternative: LM Studio Setup</StepTitle>
                            <StepDescription>
                                For a GUI-based approach, use LM Studio which provides a simple interface for local models:
                            </StepDescription>
                            <SecondaryButton onClick={() => window.open('https://lmstudio.ai', '_blank')}>
                                Download LM Studio
                            </SecondaryButton>
                        </div>

                        <div style={{ marginTop: '32px' }}>
                            <StepTitle>Recommended Models</StepTitle>
                            <ModelMeta style={{ marginTop: '12px', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                <span>• CodeLlama 7B/13B - Best for code generation</span>
                                <span>• Mistral 7B - Fast and efficient general purpose</span>
                                <span>• DeepSeek Coder - Specialized for coding tasks</span>
                                <span>• Llama 2/3 - Versatile for various tasks</span>
                            </ModelMeta>
                        </div>
                    </SetupCard>
                </Section>
            )}
        </Container>
    );
};