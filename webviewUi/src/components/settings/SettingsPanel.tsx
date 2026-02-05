import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { SettingsCategory } from './types';
import { SettingsSidebar } from './SettingsSidebar';
import { SettingsContent } from './SettingsContent';
import { SettingsProvider, SettingsValues, SettingsOptions, SettingsHandlers, DEFAULT_SUBAGENTS } from './SettingsContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  avatarUrl?: string;
  accountType?: 'Free' | 'Pro';
  // Settings values and handlers
  settingsValues?: SettingsValues;
  settingsOptions?: SettingsOptions;
  settingsHandlers?: SettingsHandlers;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 999;
`;

const PanelContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  max-width: 900px;
  background: #1a1a24;
  transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #16161e;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const PanelBody = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  username = 'User',
  avatarUrl,
  accountType = 'Free',
  settingsValues,
  settingsOptions,
  settingsHandlers,
}) => {
  const [activeCategory, setActiveCategory] = React.useState<SettingsCategory>('general');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Default values if not provided
  const defaultValues: SettingsValues = {
    theme: 'tokyo night',
    language: 'en',
    keymap: 'default',
    nickname: username,
    codeBuddyMode: 'Agent',
    enableStreaming: true,
    fontFamily: 'JetBrains Mono',
    fontSize: 16,
    autoApprove: false,
    allowFileEdits: true,
    allowTerminal: true,
    verboseLogging: false,
    indexCodebase: false,
    contextWindow: '16k',
    includeHidden: false,
    maxFileSize: '1',
    compactMode: false,
    selectedModel: 'Gemini',
    username: username,
    accountType: accountType,
    customRules: [],
    customSystemPrompt: '',
    subagents: DEFAULT_SUBAGENTS,
  };

  const defaultOptions: SettingsOptions = {
    themeOptions: [],
    modelOptions: [],
    codeBuddyModeOptions: [],
    keymapOptions: [],
    languageOptions: [],
    fontFamilyOptions: [],
    fontSizeOptions: [],
  };

  const defaultHandlers: SettingsHandlers = {
    onThemeChange: () => {},
    onLanguageChange: () => {},
    onKeymapChange: () => {},
    onNicknameChange: () => {},
    onCodeBuddyModeChange: () => {},
    onStreamingChange: () => {},
    onFontFamilyChange: () => {},
    onFontSizeChange: () => {},
    onAutoApproveChange: () => {},
    onAllowFileEditsChange: () => {},
    onAllowTerminalChange: () => {},
    onVerboseLoggingChange: () => {},
    onIndexCodebaseChange: () => {},
    onContextWindowChange: () => {},
    onIncludeHiddenChange: () => {},
    onMaxFileSizeChange: () => {},
    onCompactModeChange: () => {},
    onReindexWorkspace: () => {},
    onModelChange: () => {},
    onUsernameChange: () => {},
    postMessage: () => {},
    onAddRule: () => {},
    onUpdateRule: () => {},
    onDeleteRule: () => {},
    onToggleRule: () => {},
    onUpdateSystemPrompt: () => {},
    onToggleSubagent: () => {},
  };

  const values = settingsValues || defaultValues;
  const options = settingsOptions || defaultOptions;
  const handlers = settingsHandlers || defaultHandlers;
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCategoryChange = useCallback((category: SettingsCategory) => {
    setActiveCategory(category);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />
      <PanelContainer $isOpen={isOpen} role="dialog" aria-modal="true" aria-label="Settings">
        <SettingsProvider values={values} options={options} handlers={handlers}>
          <PanelHeader>
            <HeaderTitle>Settings</HeaderTitle>
            <CloseButton onClick={onClose} aria-label="Close settings">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </CloseButton>
          </PanelHeader>
          <PanelBody>
            <SettingsSidebar
              username={username}
              avatarUrl={avatarUrl}
              accountType={accountType}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
            />
            <SettingsContent
              activeCategory={activeCategory}
              searchQuery={searchQuery}
            />
          </PanelBody>
        </SettingsProvider>
      </PanelContainer>
    </>
  );
};
