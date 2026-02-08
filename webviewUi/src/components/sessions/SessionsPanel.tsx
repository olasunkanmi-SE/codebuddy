import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

// Types
export interface ChatSession {
  sessionId: string;
  title: string;
  startTime: string;
  endTime: string;
  messageCount: number;
  isActive: boolean;
}

interface SessionsPanelProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

// Styled components - Minimalistic design matching existing UI
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  transition: opacity 0.2s ease, visibility 0.2s ease;
`;

const Panel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: #1a1a24;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 1000;
  transform: translateX(${(props) => (props.$isOpen ? "0" : "100%")});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #16161e;
`;

const Title = styled.h2`
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }
`;

const NewSessionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: calc(100% - 24px);
  margin: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const SessionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px;
`;

const SessionItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  background: ${(props) => (props.$isActive ? "rgba(255, 255, 255, 0.1)" : "transparent")};
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const SessionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SessionTitle = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SessionMeta = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s ease;

  ${SessionItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: rgba(255, 100, 100, 0.15);
    color: #ff6b6b;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  font-size: 12px;
`;

// Icons
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Helper functions
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const SessionsPanel: React.FC<SessionsPanelProps> = ({
  sessions,
  currentSessionId,
  isOpen,
  onClose,
  onNewSession,
  onSwitchSession,
  onDeleteSession,
}) => {
  const sortedSessions = useMemo(() => 
    [...sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [sessions]
  );

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      if (sessionId !== currentSessionId) {
        onSwitchSession(sessionId);
      }
    },
    [currentSessionId, onSwitchSession]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      console.log("SessionsPanel handleDelete called:", sessionId);
      onDeleteSession(sessionId);
    },
    [onDeleteSession]
  );

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />
      <Panel $isOpen={isOpen}>
        <Header>
          <Title>Sessions</Title>
          <CloseButton onClick={onClose} title="Close">
            <CloseIcon />
          </CloseButton>
        </Header>

        <NewSessionButton onClick={onNewSession}>
          <PlusIcon />
          New Session
        </NewSessionButton>

        <SessionsList>
          {sortedSessions.length === 0 ? (
            <EmptyState>
              No sessions yet.<br />
              Start a new conversation!
            </EmptyState>
          ) : (
            sortedSessions.map((session) => (
              <SessionItem
                key={session.sessionId}
                $isActive={session.sessionId === currentSessionId}
                onClick={() => handleSessionClick(session.sessionId)}
              >
                <SessionInfo>
                  <SessionTitle>{session.title}</SessionTitle>
                  <SessionMeta>
                    {session.messageCount} messages • {formatRelativeTime(session.startTime)}
                  </SessionMeta>
                </SessionInfo>
                <DeleteButton
                  onClick={(e) => handleDelete(e, session.sessionId)}
                  title="Delete"
                >
                  <TrashIcon />
                </DeleteButton>
              </SessionItem>
            ))
          )}
        </SessionsList>
      </Panel>
    </>
  );
};

export default SessionsPanel;
