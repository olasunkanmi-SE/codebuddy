import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  SettingsSection,
  SectionTitle,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  Toggle,
} from '../ui';
import { SettingsIcon } from '../icons';
import { useSettings, CustomRule } from '../SettingsContext';

// Styled components for rules UI
const RuleCard = styled.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const RuleInfo = styled.div`
  flex: 1;
`;

const RuleName = styled.h4`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
`;

const RuleDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
`;

const RuleActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RuleContent = styled.pre`
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  padding: 12px;
  margin: 12px 0 0 0;
  font-size: 12px;
  font-family: var(--vscode-editor-font-family);
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--vscode-input-foreground);
  max-height: 150px;
  overflow-y: auto;
`;

const SubagentCard = styled(RuleCard)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
`;

const SubagentInfo = styled.div`
  flex: 1;
`;

const SubagentName = styled.h4`
  margin: 0 0 2px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
`;

const SubagentDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
`;

const SubagentBadge = styled.span`
  display: inline-block;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  margin-top: 6px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 6px;
  font-family: var(--vscode-editor-font-family);
  font-size: 13px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }
  
  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 6px;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }
  
  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-foreground);
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const RulesList = styled.div`
  margin-top: 16px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--vscode-descriptionForeground);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
    color: var(--vscode-foreground);
  }
`;

interface RulesSettingsProps {
  searchQuery: string;
}

export const RulesSettings: React.FC<RulesSettingsProps> = ({ searchQuery: _searchQuery }) => {
  const { values, handlers } = useSettings();
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isEditRuleModalOpen, setIsEditRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState('');
  
  // Form state for new rule
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    content: '',
    enabled: true,
  });

  // Load rules and subagents on mount
  useEffect(() => {
    handlers.postMessage({ command: 'rules-get-all' });
    handlers.postMessage({ command: 'subagents-get-all' });
  }, []);

  const handleAddRule = () => {
    if (newRule.name && newRule.content) {
      handlers.onAddRule(newRule);
      handlers.postMessage({ 
        command: 'rules-add', 
        message: newRule 
      });
      setNewRule({ name: '', description: '', content: '', enabled: true });
      setIsAddRuleModalOpen(false);
    }
  };

  const handleEditRule = () => {
    if (editingRule && editingRule.name && editingRule.content) {
      handlers.onUpdateRule(editingRule.id, editingRule);
      handlers.postMessage({ 
        command: 'rules-update', 
        message: { id: editingRule.id, updates: editingRule } 
      });
      setEditingRule(null);
      setIsEditRuleModalOpen(false);
    }
  };

  const handleDeleteRule = (id: string) => {
    handlers.onDeleteRule(id);
    handlers.postMessage({ command: 'rules-delete', message: { id } });
  };

  const handleToggleRule = (id: string, enabled: boolean) => {
    handlers.onToggleRule(id, enabled);
    handlers.postMessage({ command: 'rules-toggle', message: { id, enabled } });
  };

  const handleToggleSubagent = (id: string, enabled: boolean) => {
    handlers.onToggleSubagent(id, enabled);
    handlers.postMessage({ command: 'subagents-toggle', message: { id, enabled } });
  };

  const handleSaveSystemPrompt = () => {
    handlers.onUpdateSystemPrompt(tempSystemPrompt);
    handlers.postMessage({ command: 'system-prompt-update', message: { prompt: tempSystemPrompt } });
    setIsSystemPromptModalOpen(false);
  };

  const openSystemPromptModal = () => {
    setTempSystemPrompt(values.customSystemPrompt || '');
    setIsSystemPromptModalOpen(true);
  };

  const openEditModal = (rule: CustomRule) => {
    setEditingRule({ ...rule });
    setIsEditRuleModalOpen(true);
  };

  return (
    <>
      {/* Custom Rules Section */}
      <SettingsSection>
        <SectionTitle>Custom Rules</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Project Rules</SettingLabel>
            <SettingDescription>
              Define custom rules for code generation and suggestions tailored to your project.
              Rules are appended to the agent's system prompt.
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button $variant="primary" onClick={() => setIsAddRuleModalOpen(true)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SettingsIcon name="plus" size={14} />
                Add Rule
              </span>
            </Button>
          </SettingControl>
        </SettingsRow>

        {values.customRules.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>
              <SettingsIcon name="book" size={48} />
            </EmptyStateIcon>
            <EmptyStateTitle>No Custom Rules</EmptyStateTitle>
            <EmptyStateDescription>
              Create custom rules to guide how CodeBuddy generates code for your project.
              Rules can specify coding conventions, patterns, and best practices.
            </EmptyStateDescription>
          </EmptyState>
        ) : (
          <RulesList>
            {values.customRules.map((rule) => (
              <RuleCard key={rule.id}>
                <RuleHeader>
                  <RuleInfo>
                    <RuleName>{rule.name}</RuleName>
                    {rule.description && <RuleDescription>{rule.description}</RuleDescription>}
                  </RuleInfo>
                  <RuleActions>
                    <Toggle 
                      checked={rule.enabled} 
                      onChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                    <IconButton onClick={() => openEditModal(rule)} title="Edit rule">
                      <SettingsIcon name="edit" size={14} />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteRule(rule.id)} title="Delete rule">
                      <SettingsIcon name="trash" size={14} />
                    </IconButton>
                  </RuleActions>
                </RuleHeader>
                <RuleContent>{rule.content}</RuleContent>
              </RuleCard>
            ))}
          </RulesList>
        )}
      </SettingsSection>

      {/* Subagents Section (replacing Skills) */}
      <SettingsSection>
        <SectionTitle>Subagents</SectionTitle>

        <Card>
          <CardHeader>
            <CardTitle>Specialized Subagents</CardTitle>
          </CardHeader>
          <CardDescription>
            Subagents are specialized AI agents that can be delegated complex subtasks.
            Each subagent has access to specific tools relevant to their role.
          </CardDescription>
        </Card>

        <div style={{ marginTop: '16px' }}>
          {values.subagents.map((subagent) => (
            <SubagentCard key={subagent.id}>
              <SubagentInfo>
                <SubagentName>{subagent.name}</SubagentName>
                <SubagentDescription>{subagent.description}</SubagentDescription>
                <SubagentBadge>
                  {subagent.toolPatterns.includes('*') 
                    ? 'All tools' 
                    : `${subagent.toolPatterns.length} tool patterns`}
                </SubagentBadge>
              </SubagentInfo>
              <Toggle 
                checked={subagent.enabled} 
                onChange={(checked) => handleToggleSubagent(subagent.id, checked)}
              />
            </SubagentCard>
          ))}
        </div>
      </SettingsSection>

      {/* System Prompt Section */}
      <SettingsSection>
        <SectionTitle>System Prompt</SectionTitle>

        <SettingsRow>
          <SettingInfo>
            <SettingLabel>Custom System Prompt</SettingLabel>
            <SettingDescription>
              Add additional instructions to the base system prompt. This is appended after the default prompt
              and before any custom rules.
            </SettingDescription>
          </SettingInfo>
          <SettingControl>
            <Button onClick={openSystemPromptModal}>
              {values.customSystemPrompt ? 'Edit' : 'Add'} Prompt
            </Button>
          </SettingControl>
        </SettingsRow>

        {values.customSystemPrompt && (
          <RuleCard style={{ marginTop: '12px' }}>
            <RuleHeader>
              <RuleInfo>
                <RuleName>Custom Instructions</RuleName>
                <RuleDescription>{values.customSystemPrompt.length} characters</RuleDescription>
              </RuleInfo>
            </RuleHeader>
            <RuleContent>{values.customSystemPrompt}</RuleContent>
          </RuleCard>
        )}
      </SettingsSection>

      {/* Add Rule Modal */}
      <Modal $isOpen={isAddRuleModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add Custom Rule</ModalTitle>
            <IconButton onClick={() => setIsAddRuleModalOpen(false)}>
              <SettingsIcon name="close" size={18} />
            </IconButton>
          </ModalHeader>
          
          <FormGroup>
            <FormLabel>Rule Name *</FormLabel>
            <Input
              placeholder="e.g., TypeScript Strict Mode"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
            />
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Description</FormLabel>
            <Input
              placeholder="Brief description of what this rule does"
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
            />
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Rule Content *</FormLabel>
            <TextArea
              placeholder="Enter the rule instructions...&#10;&#10;Example:&#10;- Always use TypeScript strict mode&#10;- Prefer functional components over class components&#10;- Use async/await instead of .then() chains"
              value={newRule.content}
              onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
            />
          </FormGroup>
          
          <ModalActions>
            <Button onClick={() => setIsAddRuleModalOpen(false)}>Cancel</Button>
            <Button 
              $variant="primary" 
              onClick={handleAddRule}
              disabled={!newRule.name || !newRule.content}
            >
              Add Rule
            </Button>
          </ModalActions>
        </ModalContent>
      </Modal>

      {/* Edit Rule Modal */}
      <Modal $isOpen={isEditRuleModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit Rule</ModalTitle>
            <IconButton onClick={() => setIsEditRuleModalOpen(false)}>
              <SettingsIcon name="close" size={18} />
            </IconButton>
          </ModalHeader>
          
          {editingRule && (
            <>
              <FormGroup>
                <FormLabel>Rule Name *</FormLabel>
                <Input
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Description</FormLabel>
                <Input
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Rule Content *</FormLabel>
                <TextArea
                  value={editingRule.content}
                  onChange={(e) => setEditingRule({ ...editingRule, content: e.target.value })}
                />
              </FormGroup>
            </>
          )}
          
          <ModalActions>
            <Button onClick={() => setIsEditRuleModalOpen(false)}>Cancel</Button>
            <Button 
              $variant="primary" 
              onClick={handleEditRule}
              disabled={!editingRule?.name || !editingRule?.content}
            >
              Save Changes
            </Button>
          </ModalActions>
        </ModalContent>
      </Modal>

      {/* System Prompt Modal */}
      <Modal $isOpen={isSystemPromptModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Custom System Prompt</ModalTitle>
            <IconButton onClick={() => setIsSystemPromptModalOpen(false)}>
              <SettingsIcon name="close" size={18} />
            </IconButton>
          </ModalHeader>
          
          <FormGroup>
            <FormLabel>Additional Instructions</FormLabel>
            <TextArea
              placeholder="Add custom instructions that will be appended to the system prompt...&#10;&#10;Example:&#10;- You are a senior developer at a fintech company&#10;- Always consider security implications&#10;- Follow our internal coding guidelines"
              value={tempSystemPrompt}
              onChange={(e) => setTempSystemPrompt(e.target.value)}
              style={{ minHeight: '200px' }}
            />
          </FormGroup>
          
          <ModalActions>
            <Button onClick={() => setIsSystemPromptModalOpen(false)}>Cancel</Button>
            <Button $variant="primary" onClick={handleSaveSystemPrompt}>
              Save
            </Button>
          </ModalActions>
        </ModalContent>
      </Modal>
    </>
  );
};
