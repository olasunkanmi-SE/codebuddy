/**
 * Skills Settings Component
 *
 * UI for managing CodeBuddy skills - enabling/disabling skills,
 * installing CLI dependencies, and configuring skill settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { VSCodeButton, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import {
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl
} from '../ui';
import {
  JiraIcon,
  GitHubIcon,
  GitLabIcon,
  SlackIcon,
  GmailIcon,
  MySQLIcon,
  RedisIcon,
  MongoDBIcon,
} from '../icons';
import { vscode } from '../../../utils/vscode';

// Interfaces matching backend types
interface SkillState {
  enabled: boolean;
  installed: boolean;
  configured: boolean;
  scope: 'workspace' | 'global';
  lastError?: string;
}

interface SkillDependencies {
  cli: string;
  checkCommand: string;
  install: Record<string, unknown>;
}

interface SkillConfigField {
  name: string;
  label: string;
  type: 'string' | 'secret' | 'number' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  helpUrl?: string;
}

interface SkillAuth {
  type: 'api-key' | 'oauth' | 'basic' | 'none';
  setupCommand?: string;
}

interface Skill {
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  category: string;
  version: string;
  dependencies?: SkillDependencies;
  config?: SkillConfigField[];
  auth?: SkillAuth;
  content: string;
  source: string;
  state: SkillState;
}

interface SkillCategoryInfo {
  id: string;
  label: string;
  description: string;
  icon?: string;
}

interface SkillsSettingsProps {
  searchQuery: string;
}

// Styled Components
const SkillIconWrapper = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: var(--vscode-foreground);
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const SkillRow = styled(SettingsRow)`
  align-items: center;
  padding: 12px 16px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  transition: background 0.15s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const StatusBadge = styled.span<{ status: 'enabled' | 'disabled' | 'not-installed' | 'needs-config' }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-right: 12px;
  background: ${props => {
    switch (props.status) {
      case 'enabled': return 'rgba(34, 197, 94, 0.15)';
      case 'needs-config': return 'rgba(234, 179, 8, 0.15)';
      case 'not-installed': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(255, 255, 255, 0.08)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'enabled': return '#22c55e';
      case 'needs-config': return '#eab308';
      case 'not-installed': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.5)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'enabled': return 'rgba(34, 197, 94, 0.2)';
      case 'needs-config': return 'rgba(234, 179, 8, 0.2)';
      case 'not-installed': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const CategorySection = styled.div`
  margin-bottom: 32px;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const CategoryIcon = styled.span`
  margin-right: 8px;
  opacity: 0.7;
`;

const CategoryLabel = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const CategoryCount = styled.span`
  margin-left: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: rgba(255, 255, 255, 0.5);
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
`;

const InfoBanner = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoIcon = styled.div`
  color: #3b82f6;
  flex-shrink: 0;
`;

const InfoText = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  flex: 1;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #3b82f6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(59, 130, 246, 0.25);
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ToggleSwitch = styled.button<{ checked: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
  background: ${props => props.checked ? '#22c55e' : 'rgba(255, 255, 255, 0.15)'};
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.checked ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s ease;
  }
  
  &:hover {
    background: ${props => props.checked ? '#16a34a' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'project-management': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  'version-control': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="3" x2="6" y2="15"></line>
      <circle cx="18" cy="6" r="3"></circle>
      <circle cx="6" cy="18" r="3"></circle>
      <path d="M18 9a9 9 0 0 1-9 9"></path>
    </svg>
  ),
  'communication': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  'cloud-devops': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
    </svg>
  ),
  'databases': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  ),
  'monitoring': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  'other': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  ),
};

// Skill icons
const getSkillIcon = (iconName?: string): React.ReactNode => {
  switch (iconName?.toLowerCase()) {
    case 'jira': return <JiraIcon />;
    case 'github': return <GitHubIcon />;
    case 'gitlab': return <GitLabIcon />;
    case 'slack': return <SlackIcon />;
    case 'gmail': return <GmailIcon />;
    case 'mysql': return <MySQLIcon />;
    case 'redis': return <RedisIcon />;
    case 'mongodb': return <MongoDBIcon />;
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      );
  }
};

export const SkillsSettings: React.FC<SkillsSettingsProps> = ({ searchQuery }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingInstall, setPendingInstall] = useState<string | null>(null);
  const [platformInfo, setPlatformInfo] = useState<{ platform: string; packageManagers: string[] } | null>(null);

  // Message handler
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case 'skills-list':
          setSkills(message.skills || []);
          setLoading(false);
          break;
        case 'skill-categories':
          setCategories(message.categories || []);
          break;
        case 'skill-requires-install':
          setPendingInstall(message.skillId);
          break;
        case 'skill-install-result':
          setPendingInstall(null);
          break;
        case 'platform-info':
          setPlatformInfo({ platform: message.platform, packageManagers: message.packageManagers });
          break;
        case 'skills-error':
          setLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Initial fetch
    vscode.postMessage({ command: 'get-skills' });
    vscode.postMessage({ command: 'get-skill-categories' });
    vscode.postMessage({ command: 'get-platform-info' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Enable/disable skill
  const handleToggle = useCallback((skill: Skill) => {
    if (skill.state.enabled) {
      vscode.postMessage({
        command: 'disable-skill',
        skillId: skill.name,
      });
    } else {
      vscode.postMessage({
        command: 'enable-skill',
        skillId: skill.name,
        scope: 'workspace',
      });
    }
  }, []);

  // Install skill dependencies
  const handleInstall = useCallback((skillId: string) => {
    vscode.postMessage({
      command: 'install-skill-deps',
      skillId,
    });
  }, []);

  // Configure skill
  const handleConfigure = useCallback((skillId: string) => {
    vscode.postMessage({
      command: 'configure-skill',
      skillId,
    });
  }, []);

  // Run setup command
  const handleRunSetup = useCallback((skillId: string) => {
    vscode.postMessage({
      command: 'run-skill-setup',
      skillId,
    });
  }, []);

  // Refresh skills from disk
  const handleRefresh = useCallback(() => {
    setLoading(true);
    vscode.postMessage({ command: 'refresh-skills' });
  }, []);

  // Get status for a skill
  const getSkillStatus = (skill: Skill): 'enabled' | 'disabled' | 'not-installed' | 'needs-config' => {
    if (skill.state.enabled) {
      if (skill.dependencies && !skill.state.installed) return 'not-installed';
      if (skill.config?.some(f => f.required) && !skill.state.configured) return 'needs-config';
      return 'enabled';
    }
    return 'disabled';
  };

  // Get status label
  const getStatusLabel = (status: ReturnType<typeof getSkillStatus>): string => {
    switch (status) {
      case 'enabled': return 'Enabled';
      case 'disabled': return 'Disabled';
      case 'not-installed': return 'Not Installed';
      case 'needs-config': return 'Needs Config';
    }
  };

  // Filter skills
  const filteredSkills = skills.filter(s =>
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const skillsByCategory = filteredSkills.reduce((acc, skill) => {
    const category = skill.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  if (loading) {
    return (
      <LoadingWrapper>
        <VSCodeProgressRing />
      </LoadingWrapper>
    );
  }

  return (
    <>
      <InfoBanner>
        <InfoIcon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </InfoIcon>
        <InfoText>
          <strong>Skills</strong> extend CodeBuddy with CLI integrations for external services.
          Enable a skill to let the AI assistant use its commands. Some skills require CLI tools to be installed.
          {platformInfo && (
            <span style={{ display: 'block', marginTop: '8px', opacity: 0.7 }}>
              Platform: {platformInfo.platform} • 
              Package managers: {platformInfo.packageManagers.length > 0 
                ? platformInfo.packageManagers.join(', ') 
                : 'none detected'}
            </span>
          )}
        </InfoText>
        <RefreshButton onClick={handleRefresh} title="Refresh skills from disk">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh
        </RefreshButton>
      </InfoBanner>

      {filteredSkills.length === 0 ? (
        <EmptyState>
          {searchQuery ? (
            <>No skills match "{searchQuery}"</>
          ) : (
            <>No skills available. Skills will appear here when loaded.</>
          )}
        </EmptyState>
      ) : (
        Object.entries(skillsByCategory)
          .filter(([, skills]) => skills.length > 0)
          .sort(([a], [b]) => {
            // Sort by category order from SKILL_CATEGORIES
            const order = ['project-management', 'version-control', 'communication', 'cloud-devops', 'databases', 'monitoring', 'other'];
            return order.indexOf(a) - order.indexOf(b);
          })
          .map(([categoryId, categorySkills]) => {
            const categoryInfo = categories.find(c => c.id === categoryId);
            return (
              <CategorySection key={categoryId}>
                <CategoryHeader>
                  <CategoryIcon>{CATEGORY_ICONS[categoryId] || CATEGORY_ICONS['other']}</CategoryIcon>
                  <CategoryLabel>{categoryInfo?.label || categoryId}</CategoryLabel>
                  <CategoryCount>({categorySkills.length})</CategoryCount>
                </CategoryHeader>
                
                {categorySkills.map(skill => {
                  const status = getSkillStatus(skill);
                  const isPendingInstall = pendingInstall === skill.name;
                  
                  return (
                    <SkillRow key={skill.name}>
                      <SkillIconWrapper>
                        {getSkillIcon(skill.icon || skill.name)}
                      </SkillIconWrapper>
                      
                      <SettingInfo>
                        <SettingLabel>{skill.displayName}</SettingLabel>
                        <SettingDescription>
                          {skill.description}
                          {skill.dependencies && (
                            <span style={{ opacity: 0.6, marginLeft: '8px' }}>
                              (requires: {skill.dependencies.cli})
                            </span>
                          )}
                        </SettingDescription>
                      </SettingInfo>
                      
                      <SettingControl>
                        <StatusBadge status={status}>
                          {getStatusLabel(status)}
                        </StatusBadge>
                        
                        <ButtonGroup>
                          {status === 'not-installed' && (
                            <VSCodeButton
                              appearance="primary"
                              onClick={() => handleInstall(skill.name)}
                              disabled={isPendingInstall}
                              style={{ height: '28px', padding: '0 12px' }}
                            >
                              {isPendingInstall ? 'Installing...' : 'Install'}
                            </VSCodeButton>
                          )}
                          
                          {status === 'needs-config' && (
                            <VSCodeButton
                              appearance="secondary"
                              onClick={() => handleConfigure(skill.name)}
                              style={{ height: '28px', padding: '0 10px' }}
                            >
                              Configure
                            </VSCodeButton>
                          )}
                          
                          {skill.state.enabled && skill.auth?.setupCommand && (
                            <VSCodeButton
                              appearance="secondary"
                              onClick={() => handleRunSetup(skill.name)}
                              style={{ height: '28px', padding: '0 10px' }}
                              title="Run setup wizard in terminal"
                            >
                              Setup
                            </VSCodeButton>
                          )}
                          
                          <ToggleSwitch
                            checked={skill.state.enabled}
                            onClick={() => handleToggle(skill)}
                            disabled={isPendingInstall}
                            title={skill.state.enabled ? 'Disable skill' : 'Enable skill'}
                          />
                        </ButtonGroup>
                      </SettingControl>
                    </SkillRow>
                  );
                })}
              </CategorySection>
            );
          })
      )}
    </>
  );
};
