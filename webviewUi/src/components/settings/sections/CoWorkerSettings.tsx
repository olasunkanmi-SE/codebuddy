import React from 'react';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Button,
  Toggle,
} from '../ui';
import { useSettings } from '../SettingsContext';

interface CoWorkerSettingsProps {
  searchQuery: string;
}

export const CoWorkerSettings: React.FC<CoWorkerSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const { values, handlers } = useSettings();

  const handleTriggerStandup = () => {
    handlers.postMessage({ 
      command: 'execute-command',
      commandId: 'codebuddy.triggerDailyStandup'
    });
  };

  const handleTriggerCodeHealth = () => {
    handlers.postMessage({ 
      command: 'execute-command',
      commandId: 'codebuddy.triggerCodeHealth'
    });
  };

  const handleTriggerDependencyCheck = () => {
    handlers.postMessage({ 
      command: 'execute-command',
      commandId: 'codebuddy.triggerDependencyCheck'
    });
  };

  return (
    <>
      <SettingsSection>
        <SectionTitle>Productivity Automations</SectionTitle>
        
        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Daily Standup</SettingLabel>
            <SettingDescription>
              Generates a summary of your recent work, active tasks, and blockers.
              (Scheduled: Daily at 8:00 AM)
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Toggle 
                checked={values.dailyStandupEnabled} 
                onChange={(checked: boolean) => handlers.onDailyStandupChange(checked)} 
                title={values.dailyStandupEnabled ? "Disable Daily Standup" : "Enable Daily Standup"}
              />
              <Button onClick={handleTriggerStandup}>
                Trigger Now
              </Button>
            </div>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Code Health Check</SettingLabel>
            <SettingDescription>
              Scans your workspace for TODOs, large files, and potential issues.
              (Scheduled: Daily at 9:00 AM)
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Toggle 
                checked={values.codeHealthEnabled} 
                onChange={(checked: boolean) => handlers.onCodeHealthChange(checked)} 
                title={values.codeHealthEnabled ? "Disable Code Health Check" : "Enable Code Health Check"}
              />
              <Button onClick={handleTriggerCodeHealth}>
                Trigger Now
              </Button>
            </div>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Dependency Check</SettingLabel>
            <SettingDescription>
              Checks for outdated or wildcard dependencies in your project.
              (Scheduled: Daily at 11:00 AM)
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Toggle 
                checked={values.dependencyCheckEnabled} 
                onChange={(checked: boolean) => handlers.onDependencyCheckChange(checked)} 
                title={values.dependencyCheckEnabled ? "Disable Dependency Check" : "Enable Dependency Check"}
              />
              <Button onClick={handleTriggerDependencyCheck}>
                Trigger Now
              </Button>
            </div>
          </SettingControl>
        </SettingsRow>

      </SettingsSection>
    </>
  );
};
