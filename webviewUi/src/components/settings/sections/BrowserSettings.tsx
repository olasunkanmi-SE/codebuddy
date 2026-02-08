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
} from '../ui';
import { useSettings } from '../SettingsContext';

interface BrowserSettingsProps {
  searchQuery: string;
}

export const BrowserSettings: React.FC<BrowserSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const { values, options, handlers } = useSettings();
  const { browserType } = values;
  const { onBrowserTypeChange } = handlers;

  return (
    <>
      <SettingsSection>
        <SectionTitle>Link Opening Preferences</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Default Browser</SettingLabel>
            <SettingDescription>
              Choose how to open news links and other external URLs.
              <br />
              <br />
              <strong>Reader Mode:</strong> Opens a clean, readable version of the article within VS Code.
              <br />
              <strong>Simple Browser:</strong> Opens the original page within VS Code (some sites may block this).
              <br />
              <strong>System Browser:</strong> Opens the link in your default external web browser (Chrome, Safari, etc.).
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select
              value={browserType}
              onChange={(e) => onBrowserTypeChange(e.target.value as 'reader' | 'simple' | 'system')}
            >
              {options.browserTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
