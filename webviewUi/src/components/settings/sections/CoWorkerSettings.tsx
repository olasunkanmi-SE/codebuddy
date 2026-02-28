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

  const handleTriggerGitWatchdog = () => {
    handlers.postMessage({ 
      command: 'execute-command',
      commandId: 'codebuddy.triggerGitWatchdog'
    });
  };

  const handleTriggerEndOfDay = () => {
    handlers.postMessage({ 
      command: 'execute-command',
      commandId: 'codebuddy.triggerEndOfDaySummary'
    });
  };

  return (
    <>
      <SettingsSection>
        <SectionTitle>Morning Briefing</SectionTitle>
        
        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Daily Standup</SettingLabel>
            <SettingDescription>
              Generates a morning briefing with git activity summary, recent commits,
              uncommitted changes, active errors, and Jira/GitLab tickets. Includes
              clipboard export as Markdown for standups. (Scheduled: Daily at 8:00 AM)
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
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Codebase Pulse</SectionTitle>
        
        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Code Health Check</SettingLabel>
            <SettingDescription>
              Scans for TODOs/FIXMEs with file locations, detects large files, identifies
              hotspot files (most-changed in 30 days), and tracks health trends over time
              in a weekly sparkline. (Scheduled: Daily at 9:00 AM)
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
            <SettingLabel>Dependency Guardian</SettingLabel>
            <SettingDescription>
              Audits packages for wildcard versions, runs npm audit for security
              vulnerabilities (critical/high/moderate), detects outdated packages with
              major version drift, and checks lockfile sync. Offers one-click "npm audit fix".
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

      <SettingsSection>
        <SectionTitle>Git Guardian</SectionTitle>
        
        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Git Watchdog</SettingLabel>
            <SettingDescription>
              Monitors uncommitted changes with file-level detail (staged/modified/untracked),
              detects stale merged branches for cleanup, warns when your branch falls behind
              upstream, and offers one-click commit message generation.
              (Scheduled: Every 2 Hours)
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Toggle 
                checked={values.gitWatchdogEnabled} 
                onChange={(checked: boolean) => handlers.onGitWatchdogChange(checked)} 
                title={values.gitWatchdogEnabled ? "Disable Git Watchdog" : "Enable Git Watchdog"}
              />
              <Button onClick={handleTriggerGitWatchdog}>
                Trigger Now
              </Button>
            </div>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Daily Wrap-up</SectionTitle>
        
        <SettingsRow>
          <SettingInfo>
            <SettingLabel>End-of-Day Summary</SettingLabel>
            <SettingDescription>
              Auto-generates a summary of your day's work: commits made, files touched,
              lines changed (+/-), remaining errors, and uncommitted work.
              Copy as Markdown for team updates or personal journaling.
              (Scheduled: Daily at 5:30 PM)
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Toggle 
                checked={values.endOfDaySummaryEnabled} 
                onChange={(checked: boolean) => handlers.onEndOfDaySummaryChange(checked)} 
                title={values.endOfDaySummaryEnabled ? "Disable End-of-Day Summary" : "Enable End-of-Day Summary"}
              />
              <Button onClick={handleTriggerEndOfDay}>
                Trigger Now
              </Button>
            </div>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
