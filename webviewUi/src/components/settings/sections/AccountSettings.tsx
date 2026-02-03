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
  Badge,
} from '../ui';

interface AccountSettingsProps {
  searchQuery: string;
}

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 24px;
`;

const Avatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: white;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h3`
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
`;

const ProfileEmail = styled.p`
  margin: 0 0 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
`;

const ProfileBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(124, 58, 237, 0.15);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #a78bfa;
`;

export const AccountSettings: React.FC<AccountSettingsProps> = ({ searchQuery: _searchQuery }) => {
  return (
    <>
      <ProfileCard>
        <Avatar>CB</Avatar>
        <ProfileInfo>
          <ProfileName>CodeBuddy User</ProfileName>
          <ProfileEmail>user@codebuddy.dev</ProfileEmail>
          <ProfileBadge>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Free Plan
          </ProfileBadge>
        </ProfileInfo>
        <Button $variant="secondary" disabled>Edit Profile</Button>
      </ProfileCard>

      <SettingsSection>
        <SectionTitle>Subscription</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Current Plan</SettingLabel>
            <SettingDescription>
              You're currently on the Free plan. Upgrade to Pro for unlimited features.
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Badge>Free</Badge>
            <Button $variant="primary" disabled>Upgrade to Pro</Button>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Usage This Month</SettingLabel>
            <SettingDescription>
              API calls and token usage for the current billing period
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>0 / Unlimited</span>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Account Actions</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Sign Out</SettingLabel>
            <SettingDescription>
              Sign out of your CodeBuddy account on this device
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled>Sign Out</Button>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Delete Account</SettingLabel>
            <SettingDescription>
              Permanently delete your account and all associated data
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button $variant="danger" disabled>Delete Account</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
