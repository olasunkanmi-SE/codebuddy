import React, { useState } from 'react';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Toggle,
  Button,
  Select,
} from '../ui';

interface ConversationSettingsProps {
  searchQuery: string;
}

const fontSizeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export const ConversationSettings: React.FC<ConversationSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);

  return (
    <>
      <SettingsSection>
        <SectionTitle>Chat Behavior</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Enable Streaming</SettingLabel>
            <SettingDescription>
              Stream responses in real-time as they are generated
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={enableStreaming} onChange={setEnableStreaming} />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Save Chat History</SettingLabel>
            <SettingDescription>
              Automatically save conversations for future reference
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={saveHistory} onChange={setSaveHistory} />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Show Timestamps</SettingLabel>
            <SettingDescription>
              Display timestamp for each message in the conversation
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={showTimestamps} onChange={setShowTimestamps} />
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Display</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Font Size</SettingLabel>
            <SettingDescription>
              Adjust the font size for chat messages
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select value={fontSize} onChange={(e) => setFontSize(e.target.value)} disabled>
              {fontSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Compact Mode</SettingLabel>
            <SettingDescription>
              Reduce spacing between messages for a denser view
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={compactMode} onChange={setCompactMode} disabled />
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>History Management</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Clear Chat History</SettingLabel>
            <SettingDescription>
              Permanently delete all saved conversations
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button
              $variant="danger"
              onClick={() => {
                const vsCode = (window as any).acquireVsCodeApi?.() || { postMessage: () => {} };
                vsCode.postMessage({ command: 'clear-history', message: '' });
              }}
            >
              Clear History
            </Button>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Export Conversations</SettingLabel>
            <SettingDescription>
              Download your chat history as a JSON file
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled>Export</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
