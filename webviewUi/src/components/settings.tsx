import React from "react";
import styled from "styled-components";

interface SettingsProps {
  username: string;
  selectedTheme: string;
  selectedModel: string;
  selectedCodeBuddyMode: string;
  enableStreaming: boolean;
  darkMode: boolean;
  themeOptions: { value: string; label: string }[];
  modelOptions: { value: string; label: string }[];
  codeBuddyMode: { value: string; label: string }[];
  onUsernameChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onCodeBuddyModeChange: (value: string) => void;
  onStreamingChange: (value: boolean) => void;
  onDarkModeChange: (value: boolean) => void;
  onClearHistory: () => void;
  onSavePreferences?: () => void;
}

const SettingsContainer = styled.div`
  width: 100%;
  max-width: 100%;
  padding: 20px;
`;

const Section = styled.div`
  margin-bottom: 40px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: left;
`;

const SettingRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  gap: 24px;

  &:first-of-type {
    padding-top: 0;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
`;

const SettingLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  text-align: left;
`;

const SettingDescription = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.5;
  text-align: left;
`;

const SettingControl = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Toggle Switch
const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  cursor: pointer;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background: rgba(255, 255, 255, 0.15);
  }

  &:checked + span:before {
    transform: translateX(18px);
    background: rgba(255, 255, 255, 0.9);
  }

  &:disabled + span {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  transition: 0.2s;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 2px;
    background: rgba(255, 255, 255, 0.6);
    transition: 0.2s;
    border-radius: 50%;
  }
`;

// Text Input
const TextInput = styled.input`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 200px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

// Select Dropdown
const Select = styled.select`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 200px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: #1a1a1a;
    color: rgba(255, 255, 255, 0.9);
    padding: 8px;
  }
`;

// Button
const Button = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Settings: React.FC<SettingsProps> = ({
  username,
  selectedTheme,
  selectedModel,
  selectedCodeBuddyMode,
  enableStreaming,
  darkMode,
  themeOptions,
  modelOptions,
  codeBuddyMode,
  onUsernameChange,
  onThemeChange,
  onModelChange,
  onCodeBuddyModeChange,
  onStreamingChange,
  onDarkModeChange,
  onClearHistory,
  onSavePreferences,
}) => {
  return (
    <SettingsContainer>
      {/* General Section */}
      <Section>
        <SectionTitle>General</SectionTitle>
        
        <SettingRow>
          <SettingInfo>
            <SettingLabel>Nickname</SettingLabel>
            <SettingDescription>Your display name in chat</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <TextInput
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Enter nickname"
              maxLength={10}
              disabled
            />
            {onSavePreferences && (
              <Button onClick={onSavePreferences} disabled>
                Save
              </Button>
            )}
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Code Theme</SettingLabel>
            <SettingDescription>Syntax highlighting theme for code blocks</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select value={selectedTheme} onChange={(e) => onThemeChange(e.target.value)}>
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>AI Model</SettingLabel>
            <SettingDescription>Choose your preferred AI model</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select value={selectedModel} onChange={(e) => onModelChange(e.target.value)}>
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>CodeBuddy Mode</SettingLabel>
            <SettingDescription>Agent mode or Ask mode</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select value={selectedCodeBuddyMode} onChange={(e) => onCodeBuddyModeChange(e.target.value)}>
              {codeBuddyMode.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingRow>
      </Section>

      {/* Features Section */}
      <Section>
        <SectionTitle>Features</SectionTitle>
        
        <SettingRow>
          <SettingInfo>
            <SettingLabel>Enable Streaming</SettingLabel>
            <SettingDescription>Stream responses in real-time</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={enableStreaming}
                onChange={(e) => onStreamingChange(e.target.checked)}
              />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Index Codebase</SettingLabel>
            <SettingDescription>Index your workspace for better context</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={darkMode}
                onChange={(e) => onDarkModeChange(e.target.checked)}
                disabled
              />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Auto Suggestions</SettingLabel>
            <SettingDescription>Show inline code suggestions automatically</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <ToggleSwitch>
              <ToggleInput type="checkbox" checked={false} disabled />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Web Search</SettingLabel>
            <SettingDescription>Allow AI to search the web for information</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <ToggleSwitch>
              <ToggleInput type="checkbox" checked={false} disabled />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingControl>
        </SettingRow>
      </Section>

      {/* Privacy & Data Section */}
      <Section>
        <SectionTitle>Privacy & Data</SectionTitle>
        
        <SettingRow>
          <SettingInfo>
            <SettingLabel>Save Chat History</SettingLabel>
            <SettingDescription>Store conversations locally</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <ToggleSwitch>
              <ToggleInput type="checkbox" checked={true} disabled />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Anonymous Telemetry</SettingLabel>
            <SettingDescription>Help improve CodeBuddy by sharing usage data</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <ToggleSwitch>
              <ToggleInput type="checkbox" checked={false} disabled />
              <ToggleSlider />
            </ToggleSwitch>
          </SettingControl>
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <SettingLabel>Clear Chat History</SettingLabel>
            <SettingDescription>Permanently delete all saved conversations</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button onClick={onClearHistory}>Clear History</Button>
          </SettingControl>
        </SettingRow>
      </Section>
    </SettingsContainer>
  );
};