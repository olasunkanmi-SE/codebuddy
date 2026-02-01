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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui';

interface PrivacySettingsProps {
  searchQuery: string;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ searchQuery: _searchQuery }) => {
  const [telemetry, setTelemetry] = useState(false);
  const [errorReporting, setErrorReporting] = useState(true);
  const [usageStats, setUsageStats] = useState(false);

  return (
    <>
      <SettingsSection>
        <SectionTitle>Data Collection</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Anonymous Telemetry</SettingLabel>
            <SettingDescription>
              Help improve CodeBuddy by sharing anonymous usage data
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={telemetry} onChange={setTelemetry} disabled />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Error Reporting</SettingLabel>
            <SettingDescription>
              Automatically send crash reports to help us fix bugs
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={errorReporting} onChange={setErrorReporting} disabled />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Usage Statistics</SettingLabel>
            <SettingDescription>
              Share feature usage patterns to help prioritize development
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={usageStats} onChange={setUsageStats} disabled />
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Local Data</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Clear Chat History</SettingLabel>
            <SettingDescription>
              Permanently delete all saved conversations from local storage
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
            <SettingLabel>Clear Cache</SettingLabel>
            <SettingDescription>
              Clear cached data including indexed files and embeddings
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button $variant="danger" disabled>Clear Cache</Button>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Clear All Data</SettingLabel>
            <SettingDescription>
              Remove all CodeBuddy data including settings, history, and cache
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button $variant="danger" disabled>Clear All</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Privacy Policy</SectionTitle>

        <Card>
          <CardHeader>
            <CardTitle>How We Handle Your Data</CardTitle>
          </CardHeader>
          <CardDescription>
            CodeBuddy processes your code locally and only sends queries to AI providers when you
            interact with the chat. We don't store your code on any external servers. 
            Your API keys are stored securely in VS Code's secret storage.
          </CardDescription>
          <div style={{ marginTop: '12px' }}>
            <Button disabled>View Privacy Policy</Button>
          </div>
        </Card>
      </SettingsSection>
    </>
  );
};
