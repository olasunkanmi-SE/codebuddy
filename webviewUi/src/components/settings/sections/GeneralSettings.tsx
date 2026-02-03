import React from 'react';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Select,
  Input,
  Button,
  Toggle,
} from '../ui';
import { useSettings } from '../SettingsContext';

interface GeneralSettingsProps {
  searchQuery: string;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const { values, options, handlers } = useSettings();

  const handleOpenCodeBuddySettings = () => {
    handlers.postMessage({ command: 'open-codebuddy-settings' });
  };

  return (
    <>
      <SettingsSection>
        <SectionTitle>Basics</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Theme</SettingLabel>
            <SettingDescription>Select a color theme for syntax highlighting</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select 
              value={values.theme} 
              onChange={(e) => handlers.onThemeChange(e.target.value)}
            >
              {options.themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Language</SettingLabel>
            <SettingDescription>Select the language for button labels and other in-app text</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select 
              value={values.language} 
              onChange={(e) => handlers.onLanguageChange(e.target.value)} 
              disabled
              title="Coming soon"
            >
              {options.languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>CodeBuddy Mode</SettingLabel>
            <SettingDescription>Switch between Agent mode (autonomous) and Ask mode (conversational)</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select 
              value={values.codeBuddyMode} 
              onChange={(e) => handlers.onCodeBuddyModeChange(e.target.value)}
            >
              {options.codeBuddyModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Preferences</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Nickname</SettingLabel>
            <SettingDescription>Your display name shown in chat conversations</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Input
              type="text"
              placeholder="Enter nickname"
              value={values.nickname || values.username}
              onChange={(e) => handlers.onNicknameChange(e.target.value)}
              maxLength={20}
            />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Enable Streaming</SettingLabel>
            <SettingDescription>Stream AI responses in real-time as they are generated</SettingDescription>
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
            <SettingLabel>CodeBuddy Settings</SettingLabel>
            <SettingDescription>Configure API keys, models, and other CodeBuddy extension settings</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button onClick={handleOpenCodeBuddySettings}>Go to Settings</Button>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Shortcut Settings</SettingLabel>
            <SettingDescription>Customize shortcut keys for various operations in the IDE</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select 
              value={values.keymap} 
              onChange={(e) => handlers.onKeymapChange(e.target.value)} 
              disabled
              title="Coming soon"
            >
              {options.keymapOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Import Configuration</SettingLabel>
            <SettingDescription>
              Import all extensions, settings, and keybindings configurations from VSCode or Cursor
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled title="Coming soon">Import</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
