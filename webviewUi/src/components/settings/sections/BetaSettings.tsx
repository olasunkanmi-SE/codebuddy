import React, { useState } from 'react';
import styled from 'styled-components';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Toggle,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui';

interface BetaSettingsProps {
  searchQuery: string;
}

const BetaWarning = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.2);
  border-radius: 8px;
  margin-bottom: 24px;
`;

const WarningIcon = styled.div`
  color: #eab308;
  flex-shrink: 0;
`;

const WarningText = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
`;

const FeatureCard = styled(Card)`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const FeatureInfo = styled.div`
  flex: 1;
`;

const FeatureName = styled.h4`
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeatureDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
`;

export const BetaSettings: React.FC<BetaSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const [experimentalUI, setExperimentalUI] = useState(false);
  const [advancedAgent, setAdvancedAgent] = useState(false);
  const [multiModel, setMultiModel] = useState(false);

  return (
    <>
      <BetaWarning>
        <WarningIcon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </WarningIcon>
        <WarningText>
          <strong>Beta Features Warning:</strong> These features are experimental and may be unstable.
          They might change or be removed in future updates. Use at your own risk.
        </WarningText>
      </BetaWarning>

      <SettingsSection>
        <SectionTitle>Experimental Features</SectionTitle>

        <FeatureCard>
          <FeatureInfo>
            <FeatureName>
              Experimental UI Components
              <Badge $variant="warning">Beta</Badge>
            </FeatureName>
            <FeatureDescription>
              Enable new UI components and interactions that are still being tested.
              May contain visual glitches or unexpected behavior.
            </FeatureDescription>
          </FeatureInfo>
          <Toggle checked={experimentalUI} onChange={setExperimentalUI} disabled />
        </FeatureCard>

        <FeatureCard>
          <FeatureInfo>
            <FeatureName>
              Advanced Agent Capabilities
              <Badge $variant="warning">Beta</Badge>
            </FeatureName>
            <FeatureDescription>
              Enable advanced agent features like multi-step task planning, 
              autonomous file management, and complex refactoring.
            </FeatureDescription>
          </FeatureInfo>
          <Toggle checked={advancedAgent} onChange={setAdvancedAgent} disabled />
        </FeatureCard>

        <FeatureCard>
          <FeatureInfo>
            <FeatureName>
              Multi-Model Orchestration
              <Badge $variant="warning">Beta</Badge>
            </FeatureName>
            <FeatureDescription>
              Use multiple AI models simultaneously for different tasks.
              Route queries to the best model based on the task type.
            </FeatureDescription>
          </FeatureInfo>
          <Toggle checked={multiModel} onChange={setMultiModel} disabled />
        </FeatureCard>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Beta Program</SectionTitle>

        <Card>
          <CardHeader>
            <CardTitle>Join the Beta Program</CardTitle>
          </CardHeader>
          <CardDescription>
            Get early access to new features and help shape the future of CodeBuddy.
            Beta testers receive new features first and have direct access to the development team.
          </CardDescription>
          <div style={{ marginTop: '12px' }}>
            <Badge $variant="success">You're in the Beta!</Badge>
          </div>
        </Card>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Feedback</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Report Beta Issues</SettingLabel>
            <SettingDescription>
              Found a bug or have feedback about beta features? Let us know!
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <a
              href="https://github.com/codebuddy/codebuddy/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Badge>Report Issue</Badge>
            </a>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
