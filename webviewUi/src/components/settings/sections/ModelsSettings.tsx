import React from 'react';
import styled from 'styled-components';
import { useSettings } from '../SettingsContext';
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
