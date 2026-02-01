import React from 'react';
import styled from 'styled-components';

// Section Container
export const SettingsSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const SectionDescription = styled.p`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

// Settings Row
export const SettingsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

export const SettingInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const SettingLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  margin-bottom: 4px;
`;

export const SettingDescription = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.5;
`;

export const SettingControl = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Toggle Switch
const ToggleSwitchContainer = styled.label`
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
    background: #7c3aed;
  }

  &:checked + span:before {
    transform: translateX(18px);
    background: white;
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

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled }) => (
  <ToggleSwitchContainer>
    <ToggleInput
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <ToggleSlider />
  </ToggleSwitchContainer>
);

// Select Dropdown
export const Select = styled.select`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 180px;
  cursor: pointer;
  transition: all 0.15s ease;

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

// Input
export const Input = styled.input`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 180px;
  transition: all 0.15s ease;

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

// Button
interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = styled.button<ButtonProps>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#7c3aed';
      case 'danger': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(255, 255, 255, 0.06)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$variant) {
      case 'primary': return '#7c3aed';
      case 'danger': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 255, 255, 0.12)';
    }
  }};
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  color: ${props => {
    switch (props.$variant) {
      case 'primary': return 'white';
      case 'danger': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.9)';
    }
  }};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${props => {
      switch (props.$variant) {
        case 'primary': return '#8b5cf6';
        case 'danger': return 'rgba(239, 68, 68, 0.25)';
        default: return 'rgba(255, 255, 255, 0.1)';
      }
    }};
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Card
export const Card = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const CardTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

export const CardDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
`;

// Divider
export const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 24px 0;
`;

// Badge
interface BadgeProps {
  $variant?: 'default' | 'success' | 'warning' | 'error';
}

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  background: ${props => {
    switch (props.$variant) {
      case 'success': return 'rgba(34, 197, 94, 0.15)';
      case 'warning': return 'rgba(234, 179, 8, 0.15)';
      case 'error': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'success': return '#22c55e';
      case 'warning': return '#eab308';
      case 'error': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.7)';
    }
  }};
`;

// Icon Button
export const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Empty State
export const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
`;

export const EmptyStateIcon = styled.div`
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.3);

  svg {
    width: 48px;
    height: 48px;
  }
`;

export const EmptyStateTitle = styled.h4`
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
`;

export const EmptyStateDescription = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
`;

// Link Button
export const LinkButton = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  font-size: 13px;
  color: #7c3aed;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;
