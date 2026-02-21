import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const handleOpenCodeBuddySettings = () => {
    handlers.postMessage({ command: 'open-codebuddy-settings' });
  };

  return (
    <>
      <SettingsSection>
        <SectionTitle>{t("settings.general.sectionBasics")}</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>{t("settings.general.theme")}</SettingLabel>
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
            <SettingLabel>{t("settings.general.fontFamily")}</SettingLabel>
            <SettingDescription>Select your preferred font for the chat interface</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select 
              value={values.fontFamily} 
              onChange={(e) => handlers.onFontFamilyChange(e.target.value)}
            >
              {options.fontFamilyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>{t("settings.general.fontSize")}</SettingLabel>
            <SettingDescription>Select your preferred font size for the chat interface</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select 
              value={String(values.fontSize)} 
              onChange={(e) => handlers.onFontSizeChange(Number(e.target.value))}
            >
              {options.fontSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>{t("settings.general.language")}</SettingLabel>
            <SettingDescription>Select the language for button labels and other in-app text</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select 
              value={values.language} 
              onChange={(e) => handlers.onLanguageChange(e.target.value)} 
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
            <SettingLabel>{t("settings.general.codeBuddyMode")}</SettingLabel>
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
        <SectionTitle>{t("settings.general.sectionPreferences")}</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>{t("settings.general.nickname")}</SettingLabel>
            <SettingDescription>{t("settings.general.nicknameDesc")}</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Input
              type="text"
              placeholder={t("settings.general.nicknamePlaceholder")}
              value={values.nickname || values.username}
              onChange={(e) => handlers.onNicknameChange(e.target.value)}
              maxLength={20}
            />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>{t("settings.general.enableStreaming")}</SettingLabel>
            <SettingDescription>{t("settings.general.enableStreamingDesc")}</SettingDescription>
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
            <SettingLabel>{t("settings.general.codeBuddySettings")}</SettingLabel>
            <SettingDescription>Configure API keys, models, and other CodeBuddy extension settings</SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button onClick={handleOpenCodeBuddySettings}>{t("common.goToSettings")}</Button>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>{t("settings.general.shortcutSettings")}</SettingLabel>
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
            <SettingLabel>{t("settings.general.importConfiguration")}</SettingLabel>
            <SettingDescription>
              Import all extensions, settings, and keybindings configurations from VSCode or Cursor
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled title="Coming soon">{t("common.import")}</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
