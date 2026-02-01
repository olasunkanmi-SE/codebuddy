import React, { useState } from 'react';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Select,
  Toggle,
  Badge,
} from '../ui';

interface AgentsSettingsProps {
  searchQuery: string;
}

const agentModeOptions = [
  { value: 'Agent', label: 'Agent Mode' },
  { value: 'Ask', label: 'Ask Mode' },
];

export const AgentsSettings: React.FC<AgentsSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const [agentMode, setAgentMode] = useState('Agent');
  const [autoApprove, setAutoApprove] = useState(false);
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [allowFileEdits, setAllowFileEdits] = useState(true);
  const [allowTerminal, setAllowTerminal] = useState(true);

  const handleModeChange = (value: string) => {
    setAgentMode(value);
    const vsCode = (window as any).acquireVsCodeApi?.() || { postMessage: () => {} };
    vsCode.postMessage({ command: 'codebuddy-model-change-event', message: value });
  };

  return (
    <>
      <SettingsSection>
        <SectionTitle>Agent Mode</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>CodeBuddy Mode</SettingLabel>
            <SettingDescription>
              Agent mode provides autonomous task execution. Ask mode is for Q&A interactions.
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select value={agentMode} onChange={(e) => handleModeChange(e.target.value)}>
              {agentModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Current Agent Status</SettingLabel>
            <SettingDescription>The agent is ready to assist with your coding tasks</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Badge $variant="success">Active</Badge>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Permissions</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Auto-approve Actions</SettingLabel>
            <SettingDescription>
              Automatically approve agent actions without asking for confirmation
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={autoApprove} onChange={setAutoApprove} />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Allow File Edits</SettingLabel>
            <SettingDescription>
              Allow the agent to create, modify, and delete files in your workspace
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={allowFileEdits} onChange={setAllowFileEdits} />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Allow Terminal Access</SettingLabel>
            <SettingDescription>
              Allow the agent to execute terminal commands
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={allowTerminal} onChange={setAllowTerminal} />
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Advanced</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Verbose Logging</SettingLabel>
            <SettingDescription>
              Show detailed agent activity logs for debugging
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={verboseLogging} onChange={setVerboseLogging} />
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
