import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSettings } from '../SettingsContext';
import { PREDEFINED_LOCAL_MODELS } from '../../../constants/constant';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Select,
  Badge,
  Card,
  Button,
} from '../ui';

interface ModelsSettingsProps {
  searchQuery: string;
}

const ModelCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ModelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const ModelInfo = styled.div`
  flex: 1;
`;

const ModelName = styled.h4`
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModelDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const ModelStats = styled.div`
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const Stat = styled.div`
  text-align: left;
`;

const StatLabel = styled.span`
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 2px;
`;

const StatValue = styled.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
`;

export const ModelsSettings: React.FC<ModelsSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const { values, options, handlers } = useSettings();
  const { selectedModel } = values;
  const { modelOptions } = options;
  const { onModelChange } = handlers;

  const [dockerRunnerEnabled, setDockerRunnerEnabled] = useState(false);
  const [pulledModels, setPulledModels] = useState<string[]>([]);
  const [pullingModels, setPullingModels] = useState<string[]>([]);
  const [deletingModels, setDeletingModels] = useState<string[]>([]);
  const [modelErrors, setModelErrors] = useState<Record<string, string>>({});
  const [isEnablingRunner, setIsEnablingRunner] = useState(false);
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [isStartingCompose, setIsStartingCompose] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeStarted, setComposeStarted] = useState(false);
  const [activeLocalModel, setActiveLocalModel] = useState<string | null>(null);
  const [settingModel, setSettingModel] = useState<string | null>(null);

  useEffect(() => {
    // Check status on mount
    handlers.postMessage({ command: 'docker-check-status' });
    handlers.postMessage({ command: 'docker-check-ollama-status' });
    handlers.postMessage({ command: 'docker-get-models' });
    handlers.postMessage({ command: 'docker-get-local-model' });

    // Poll every 30 seconds to reduce log spam
    const interval = setInterval(() => {
      // Only check runner status periodically
      handlers.postMessage({ command: 'docker-check-status' });
      handlers.postMessage({ command: 'docker-check-ollama-status' });
      // Only fetch models if we know something is running to avoid error logs
      handlers.postMessage({ command: 'docker-get-models' });
      handlers.postMessage({ command: 'docker-get-local-model' });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'docker-status':
          setDockerRunnerEnabled(message.available);
          break;
        case 'docker-ollama-status':
          setComposeStarted(message.running);
          break;
        case 'docker-runner-enabled':
          setIsEnablingRunner(false);
          setDockerRunnerEnabled(message.success);
          if (message.success) {
             setRunnerError(null);
             handlers.postMessage({ command: 'docker-get-models' });
          } else if (message.error) {
             setRunnerError(message.error);
          }
          break;
        case 'docker-compose-started':
          setIsStartingCompose(false);
          setComposeStarted(message.success);
          if (message.success) {
            setComposeError(null);
          } else if (message.error) {
            setComposeError(message.error);
          }
          break;
        case 'docker-models-list':
           if (message.models) {
             setPulledModels(message.models.map((m: any) => m.name));
           }
           break;
        case 'docker-model-pulled':
           setPullingModels(prev => prev.filter(m => m !== message.model));
           if (message.success) {
             setPulledModels(prev => [...prev, message.model]);
           } else {
             setModelErrors(prev => ({ ...prev, [message.model]: 'Failed to pull model' }));
           }
           break;
        case 'docker-model-deleted':
           if (message.success) {
             setPulledModels(prev => prev.filter(m => !m.includes(message.model) && !message.model.includes(m)));
             setModelErrors(prev => {
                const next = { ...prev };
                delete next[message.model];
                return next;
             });
           } else if (message.error) {
             setModelErrors(prev => ({ ...prev, [message.model]: message.error }));
           }
           setDeletingModels(prev => prev.filter(m => m !== message.model));
           break;
        case 'docker-local-model':
           setActiveLocalModel(message.model);
           break;
        case 'docker-model-selected':
           setSettingModel(null);
           if (message.success) {
             setActiveLocalModel(message.model);
             onModelChange("Local"); 
           } else {
             setModelErrors(prev => ({ ...prev, [message.model]: message.error }));
           }
           break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleEnableDockerRunner = () => {
    setIsEnablingRunner(true);
    setRunnerError(null);
    handlers.postMessage({ command: 'docker-enable-runner' });
  };

  const handleStartCompose = () => {
    setIsStartingCompose(true);
    setComposeError(null);
    handlers.postMessage({ command: 'docker-start-compose' });
  };

  const handlePullOllamaModel = (modelValue: string) => {
    if (pullingModels.includes(modelValue)) return;
    setPullingModels(prev => [...prev, modelValue]);
    handlers.postMessage({ command: 'docker-pull-ollama-model', message: modelValue });
  };

  const handlePullModel = (modelValue: string) => {
    if (pullingModels.includes(modelValue)) return;
    setPullingModels(prev => [...prev, modelValue]);
    handlers.postMessage({ command: 'docker-pull-model', message: modelValue });
  };

  const handleUseModel = (modelValue: string) => {
    setSettingModel(modelValue);
    handlers.postMessage({ command: 'docker-use-model', message: modelValue });
  };

  const handleDeleteModel = (modelValue: string) => {
    if (deletingModels.includes(modelValue)) return;
    setDeletingModels(prev => [...prev, modelValue]);
    handlers.postMessage({ command: 'docker-delete-model', message: modelValue });
  };

  const isModelPulled = (modelValue: string) => {
    // Check if modelValue matches any pulled model name (loose matching for tags)
    return pulledModels.some(m => m.includes(modelValue) || modelValue.includes(m));
  };

  return (
    <>
      <SettingsSection>
        <SectionTitle>AI Model Selection</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Primary Model</SettingLabel>
            <SettingDescription>
              Choose the AI model for code generation and chat responses
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select value={selectedModel} onChange={(e) => onModelChange(e.target.value)}>
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Active Model</SectionTitle>

        <ModelCard>
          <ModelHeader>
            <ModelInfo>
              <ModelName>
                {modelOptions.find((m) => m.value === selectedModel)?.label || selectedModel}
                <Badge $variant="success">Active</Badge>
              </ModelName>
              <ModelDescription>
                Currently configured as your primary AI model for all CodeBuddy interactions
              </ModelDescription>
            </ModelInfo>
          </ModelHeader>
          <ModelStats>
            <Stat>
              <StatLabel>Context Window</StatLabel>
              <StatValue>128K tokens</StatValue>
            </Stat>
            <Stat>
              <StatLabel>Response Speed</StatLabel>
              <StatValue>Fast</StatValue>
            </Stat>
            <Stat>
              <StatLabel>Capabilities</StatLabel>
              <StatValue>Code, Chat, Analysis</StatValue>
            </Stat>
          </ModelStats>
        </ModelCard>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Local Models (Docker)</SectionTitle>
        
        <SettingsRow>
            <SettingInfo>
                <SettingLabel>Docker Model Runner</SettingLabel>
                <SettingDescription>
                    Enable Docker Desktop's native Model Runner (Beta). For standard Ollama containers, select "Local" in the Primary Model dropdown above.
                </SettingDescription>
            </SettingInfo>
            <SettingControl>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <Button 
                        onClick={handleEnableDockerRunner} 
                        disabled={dockerRunnerEnabled || isEnablingRunner}
                        style={{ minWidth: '120px' }}
                    >
                        {isEnablingRunner ? 'Enabling...' : dockerRunnerEnabled ? 'Enabled' : 'Enable'}
                    </Button>
                    {runnerError && (
                    <span style={{ color: '#ef5350', fontSize: '12px', maxWidth: '200px', textAlign: 'right' }}>
                        Error: {runnerError}. Ensure Docker Desktop 4.37+ is installed.
                    </span>
                )}
            </div>
        </SettingControl>
      </SettingsRow>

      <SettingsRow>
          <SettingInfo>
              <SettingLabel>Local Ollama (Docker Compose)</SettingLabel>
              <SettingDescription>
                  Start a standard Ollama container using Docker Compose. Uses port 11434.
              </SettingDescription>
          </SettingInfo>
          <SettingControl>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <Button 
                      onClick={handleStartCompose} 
                      disabled={composeStarted || isStartingCompose}
                      style={{ minWidth: '120px' }}
                  >
                      {isStartingCompose ? 'Starting...' : composeStarted ? 'Running' : 'Start Server'}
                  </Button>
                  {composeError && (
                      <span style={{ color: '#ef5350', fontSize: '12px', maxWidth: '200px', textAlign: 'right' }}>
                          Error: {composeError}
                      </span>
                  )}
              </div>
          </SettingControl>
      </SettingsRow>

      {/* Show model list for Docker Compose mode even if Runner is disabled */}
      {composeStarted && !dockerRunnerEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {PREDEFINED_LOCAL_MODELS.map((model) => {
                  const isPulled = isModelPulled(model.value);
                  const isPulling = pullingModels.includes(model.value);
                  const isActive = !!(activeLocalModel === model.value || (activeLocalModel && (model.value.includes(activeLocalModel) || activeLocalModel.includes(model.value))));
                  const isSetting = settingModel === model.value;
                  
                  return (
                      <ModelCard key={model.value}>
                          <ModelHeader>
                              <ModelInfo>
                                  <ModelName>
                                      {model.label}
                                      {isPulled && <Badge $variant="success">Available</Badge>}
                                      {isActive && <Badge $variant="default">Active</Badge>}
                                  </ModelName>
                                  <ModelDescription>{model.description}</ModelDescription>
                              </ModelInfo>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Button 
                                      onClick={() => handlePullOllamaModel(model.value)}
                                      disabled={isPulled || isPulling}
                                  >
                                      {isPulling ? 'Pulling...' : isPulled ? 'Pulled' : 'Pull'}
                                  </Button>
                                  {isPulled && !isActive && (
                                      <Button 
                                          onClick={() => handleUseModel(model.value)}
                                          disabled={isSetting}
                                          style={{ 
                                              backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                                              color: '#4caf50',
                                              border: '1px solid rgba(76, 175, 80, 0.5)'
                                          }}
                                      >
                                          {isSetting ? 'Setting...' : 'Use'}
                                      </Button>
                                  )}
                              </div>
                          </ModelHeader>
                          {modelErrors[model.value] && (
                              <div style={{ color: '#ef5350', fontSize: '12px', marginTop: '8px', paddingLeft: '2px' }}>
                                  Error: {modelErrors[model.value]}
                              </div>
                          )}
                      </ModelCard>
                  );
              })}
          </div>
      )}

        {dockerRunnerEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {PREDEFINED_LOCAL_MODELS.map((model) => {
                    const isPulled = isModelPulled(model.value);
                    const isPulling = pullingModels.includes(model.value);
                    const isDeleting = deletingModels.includes(model.value);
                    const isActive = !!(activeLocalModel === model.value || (activeLocalModel && (model.value.includes(activeLocalModel) || activeLocalModel.includes(model.value))));
                    const isSetting = settingModel === model.value;
                    
                    return (
                        <ModelCard key={model.value}>
                            <ModelHeader>
                                <ModelInfo>
                                    <ModelName>
                                        {model.label}
                                        {isPulled && <Badge $variant="success">Available</Badge>}
                                        {isActive && <Badge $variant="default">Active</Badge>}
                                    </ModelName>
                                    <ModelDescription>{model.description}</ModelDescription>
                                </ModelInfo>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Button 
                                        onClick={() => handlePullModel(model.value)}
                                        disabled={isPulled || isPulling || isDeleting}
                                    >
                                        {isPulling ? 'Pulling...' : isPulled ? 'Pulled' : 'Pull'}
                                    </Button>
                                    {isPulled && !isActive && (
                                        <Button 
                                            onClick={() => handleUseModel(model.value)}
                                            disabled={isSetting || isDeleting}
                                            style={{ 
                                                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                                                color: '#4caf50',
                                                border: '1px solid rgba(76, 175, 80, 0.5)'
                                            }}
                                        >
                                            {isSetting ? 'Setting...' : 'Use'}
                                        </Button>
                                    )}
                                    {isPulled && (
                                        <Button 
                                            onClick={() => handleDeleteModel(model.value)}
                                            disabled={isDeleting || isActive}
                                            style={{ 
                                                backgroundColor: 'rgba(211, 47, 47, 0.1)', 
                                                color: '#ef5350',
                                                border: '1px solid rgba(239, 83, 80, 0.5)'
                                            }}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    )}
                                </div>
                            </ModelHeader>
                            {modelErrors[model.value] && (
                                <div style={{ color: '#ef5350', fontSize: '12px', marginTop: '8px', paddingLeft: '2px' }}>
                                    Error: {modelErrors[model.value]}
                                </div>
                            )}
                        </ModelCard>
                    );
                })}
            </div>
        )}
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>API Configuration</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>API Key</SettingLabel>
            <SettingDescription>
              Configure your API key for the selected model in VS Code settings
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled>Configure in Settings</Button>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Custom Endpoint</SettingLabel>
            <SettingDescription>
              Use a custom API endpoint for self-hosted models
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled>Configure</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
