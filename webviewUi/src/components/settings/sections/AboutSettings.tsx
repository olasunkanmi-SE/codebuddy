import React from 'react';
import styled from 'styled-components';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  LinkButton,
} from '../ui';
import { SettingsIcon } from '../icons';

interface AboutSettingsProps {
  searchQuery: string;
}

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 24px;
`;

const Logo = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: white;
`;

const AppInfo = styled.div`
  flex: 1;
`;

const AppName = styled.h2`
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
`;

const AppVersion = styled.p`
  margin: 0 0 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
`;

const AppTagline = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
`;

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LinkItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  svg {
    color: rgba(255, 255, 255, 0.5);
  }
`;

export const AboutSettings: React.FC<AboutSettingsProps> = ({ searchQuery: _searchQuery }) => {
  return (
    <>
      <LogoSection>
        <Logo>CB</Logo>
        <AppInfo>
          <AppName>CodeBuddy</AppName>
          <AppVersion>
            Version 1.0.0 <Badge>Latest</Badge>
          </AppVersion>
          <AppTagline>
            Your AI-powered coding companion. Write better code, faster.
          </AppTagline>
        </AppInfo>
      </LogoSection>

      <SettingsSection>
        <SectionTitle>Resources</SectionTitle>

        <LinkList>
          <LinkItem href="https://github.com/olasunkanmi-SE/codebuddy" target="_blank" rel="noopener noreferrer">
            <span>GitHub Repository</span>
            <SettingsIcon name="externalLink" size={16} />
          </LinkItem>
          <LinkItem href="https://codebuddy.dev/docs" target="_blank" rel="noopener noreferrer">
            <span>Documentation</span>
            <SettingsIcon name="externalLink" size={16} />
          </LinkItem>
          <LinkItem href="https://codebuddy.dev/changelog" target="_blank" rel="noopener noreferrer">
            <span>Changelog</span>
            <SettingsIcon name="externalLink" size={16} />
          </LinkItem>
          <LinkItem href="https://github.com/olasunkanmi-SE/codebuddy/issues" target="_blank" rel="noopener noreferrer">
            <span>Report an Issue</span>
            <SettingsIcon name="externalLink" size={16} />
          </LinkItem>
        </LinkList>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Updates</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Check for Updates</SettingLabel>
            <SettingDescription>
              You're running the latest version of CodeBuddy
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled>Check Now</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>License</SectionTitle>

        <Card>
          <CardHeader>
            <CardTitle>MIT License</CardTitle>
          </CardHeader>
          <CardDescription>
            CodeBuddy is open source software licensed under the MIT License.
            You're free to use, modify, and distribute this software according to the license terms.
          </CardDescription>
          <div style={{ marginTop: '12px' }}>
            <LinkButton disabled>
              View Full License
              <SettingsIcon name="externalLink" size={14} />
            </LinkButton>
          </div>
        </Card>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Credits</SectionTitle>

        <Card>
          <CardHeader>
            <CardTitle>Built with ❤️</CardTitle>
          </CardHeader>
          <CardDescription>
            CodeBuddy is built using React, TypeScript, VS Code Extension API, and powered by 
            leading AI models including Google Gemini, Anthropic Claude, and Groq.
            <br /><br />
            Special thanks to all contributors and the open source community.
          </CardDescription>
        </Card>
      </SettingsSection>
    </>
  );
};
