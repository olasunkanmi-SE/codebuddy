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
} from '../ui';
import { useSettings } from '../SettingsContext';

interface ConversationSettingsProps {
  searchQuery: string;
}

export const ConversationSettings: React.FC<ConversationSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const { values, handlers } = useSettings();
  const [saveHistory, setSaveHistory] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(false);

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
            <Toggle 
              checked={values.enableStreaming} 
              onChange={(checked) => handlers.onStreamingChange(checked)} 
            />
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
            <Toggle checked={saveHistory} onChange={setSaveHistory} disabled title="Coming soon" />
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
            <Toggle checked={showTimestamps} onChange={setShowTimestamps} disabled title="Coming soon" />
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Display</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Compact Mode</SettingLabel>
            <SettingDescription>
              Reduce spacing between messages for a denser view
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle 
              checked={values.compactMode} 
              onChange={(checked) => handlers.onCompactModeChange(checked)} 
            />
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
