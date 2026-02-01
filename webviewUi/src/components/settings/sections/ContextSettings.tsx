import React, { useState } from 'react';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Toggle,
  Select,
  Button,
  Badge,
  Input,
} from '../ui';

interface ContextSettingsProps {
  searchQuery: string;
}

const contextWindowOptions = [
  { value: '4k', label: '4K tokens' },
  { value: '8k', label: '8K tokens' },
  { value: '16k', label: '16K tokens' },
  { value: '32k', label: '32K tokens' },
  { value: '128k', label: '128K tokens' },
];

export const ContextSettings: React.FC<ContextSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const [indexCodebase, setIndexCodebase] = useState(false);
  const [contextWindow, setContextWindow] = useState('16k');
  const [includeHidden, setIncludeHidden] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState('1');

  return (
    <>
      <SettingsSection>
        <SectionTitle>Workspace Indexing</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Index Codebase</SettingLabel>
            <SettingDescription>
              Enable vector database indexing for semantic code search and better context understanding
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={indexCodebase} onChange={setIndexCodebase} />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Indexing Status</SettingLabel>
            <SettingDescription>
              Current status of your workspace indexing
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Badge $variant={indexCodebase ? 'success' : 'warning'}>
              {indexCodebase ? 'Indexed' : 'Not Indexed'}
            </Badge>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Re-index Workspace</SettingLabel>
            <SettingDescription>
              Manually trigger a full re-index of your workspace
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled={!indexCodebase}>Re-index</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Context Configuration</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Context Window Size</SettingLabel>
            <SettingDescription>
              Maximum amount of context sent with each request
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Select value={contextWindow} onChange={(e) => setContextWindow(e.target.value)}>
              {contextWindowOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Include Hidden Files</SettingLabel>
            <SettingDescription>
              Include files starting with . in context gathering
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Toggle checked={includeHidden} onChange={setIncludeHidden} />
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Max File Size (MB)</SettingLabel>
            <SettingDescription>
              Skip files larger than this size when gathering context
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Input
              type="number"
              value={maxFileSize}
              onChange={(e) => setMaxFileSize(e.target.value)}
              min="0.1"
              max="10"
              step="0.1"
              style={{ width: '80px' }}
            />
          </SettingControl>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>File Patterns</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Excluded Patterns</SettingLabel>
            <SettingDescription>
              Configure file patterns to exclude from context gathering (uses .gitignore patterns)
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled>Configure</Button>
          </SettingControl>
        </SettingsRow>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Priority Files</SettingLabel>
            <SettingDescription>
              Specify files that should always be included in context
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button disabled>Configure</Button>
          </SettingControl>
        </SettingsRow>
      </SettingsSection>
    </>
  );
};
