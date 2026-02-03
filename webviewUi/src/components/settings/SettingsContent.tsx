import React from 'react';
import styled from 'styled-components';
import { SettingsCategory, SETTINGS_CATEGORIES } from './types';
import { AccountSettings, GeneralSettings, AgentsSettings, MCPSettings, ConversationSettings, ModelsSettings, ContextSettings, RulesSettings, PrivacySettings, BetaSettings, AboutSettings } from './sections';


interface SettingsContentProps {
  activeCategory: SettingsCategory;
  searchQuery: string;
}

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1a1a24;
`;

const ContentHeader = styled.div`
  padding: 24px 32px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const CategoryTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
`;

const CategoryDescription = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
`;

const ContentBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
`;

const SECTION_COMPONENTS: Record<SettingsCategory, React.FC<{ searchQuery: string }>> = {
  account: AccountSettings,
  general: GeneralSettings,
  agents: AgentsSettings,
  mcp: MCPSettings,
  conversation: ConversationSettings,
  models: ModelsSettings,
  context: ContextSettings,
  rules: RulesSettings,
  privacy: PrivacySettings,
  beta: BetaSettings,
  about: AboutSettings,
};

export const SettingsContent: React.FC<SettingsContentProps> = ({
  activeCategory,
  searchQuery,
}) => {
  const categoryInfo = SETTINGS_CATEGORIES.find(c => c.id === activeCategory);
  const SectionComponent = SECTION_COMPONENTS[activeCategory];

  return (
    <ContentContainer>
      <ContentHeader>
        <CategoryTitle>{categoryInfo?.label || 'Settings'}</CategoryTitle>
        {categoryInfo?.description && (
          <CategoryDescription>{categoryInfo.description}</CategoryDescription>
        )}
      </ContentHeader>
      <ContentBody>
        <SectionComponent searchQuery={searchQuery} />
      </ContentBody>
    </ContentContainer>
  );
};
