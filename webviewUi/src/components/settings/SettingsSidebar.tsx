import React from 'react';
import styled from 'styled-components';
import { SettingsCategory, SETTINGS_CATEGORIES } from './types';
import { SettingsIcon } from './icons';


interface SettingsSidebarProps {
  username: string;
  avatarUrl?: string;
  accountType: 'Free' | 'Pro';
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SidebarContainer = styled.div`
  width: 220px;
  min-width: 220px;
  background: #16161e;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const UserSection = styled.div`
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div<{ $hasImage?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.$hasImage ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Username = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const AccountBadge = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
`;

const SearchSection = styled.div`
  padding: 12px 16px;
`;

const SearchInput = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 10px 8px 32px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  outline: none;
  transition: all 0.15s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
  }
`;

const KeyHint = styled.span`
  position: absolute;
  right: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
`;

const NavSection = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`;

const NavItem = styled.button<{ $active: boolean }>`
  width: calc(100% - 16px);
  margin: 2px 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.08)' : 'transparent'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  ${props => props.$active && `
    background: rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  `}
`;

const NavIcon = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'};
  transition: color 0.15s ease;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const NavLabel = styled.span<{ $active: boolean }>`
  font-size: 13px;
  font-weight: ${props => props.$active ? 500 : 400};
  color: ${props => props.$active ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)'};
  transition: all 0.15s ease;
`;

const ActiveIndicator = styled.span`
  margin-left: auto;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #7c3aed;
`;

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  username,
  avatarUrl,
  accountType,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}) => {
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <SidebarContainer>
      <UserSection>
        <UserProfile>
          <Avatar $hasImage={!!avatarUrl}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} />
            ) : (
              getInitials(username)
            )}
          </Avatar>
          <UserInfo>
            <Username>{username}</Username>
            <AccountBadge>{accountType}</AccountBadge>
          </UserInfo>
        </UserProfile>
      </UserSection>

      <SearchSection>
        <SearchInput>
          <SearchIcon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </SearchIcon>
          <Input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <KeyHint>⌘F</KeyHint>
        </SearchInput>
      </SearchSection>

      <NavSection>
        {SETTINGS_CATEGORIES.map((category) => (
          <NavItem
            key={category.id}
            $active={activeCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
            aria-selected={activeCategory === category.id}
          >
            <NavIcon $active={activeCategory === category.id}>
              <SettingsIcon name={category.icon} />
            </NavIcon>
            <NavLabel $active={activeCategory === category.id}>
              {category.label}
            </NavLabel>
            {activeCategory === category.id && <ActiveIndicator />}
          </NavItem>
        ))}
      </NavSection>
    </SidebarContainer>
  );
};
