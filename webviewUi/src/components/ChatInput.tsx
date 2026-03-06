import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flattenFileTree, searchFiles, getDirectory } from "../utils/fuzzySearch";
import type { FileItem } from "../utils/fuzzySearch";
import { useChatStore } from "../stores/chat.store";
import "./ChatInput.css";

interface ChatInputProps {
  onSendMessage: (message: string, mentionedFiles: string[]) => void;
  disabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  folders: any;
  activeEditor: string;
}

/** Extract all @file/path mentions from a message string. */
export function extractMentions(text: string): string[] {
  const mentions: string[] = [];
  const regex = /@([\w./_-]+[\w])/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  folders,
  activeEditor,
}) => {
  const [userInput, setUserInput] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionAnchor, setMentionAnchor] = useState(-1); // cursor position of the '@'

  const readerContext = useChatStore((s) => s.readerContext);
  const clearReaderContext = useChatStore((s) => s.setReaderContext);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const onSendRef = useRef(onSendMessage);
  useEffect(() => { onSendRef.current = onSendMessage; }, [onSendMessage]);

  // ── File list from workspace tree ──
  const flatFiles = useMemo<FileItem[]>(() => {
    if (!folders?.message) return [];
    try {
      return flattenFileTree(JSON.parse(folders.message));
    } catch { return []; }
  }, [folders]);

  const filteredFiles = useMemo(
    () => searchFiles(flatFiles, mentionQuery, 12),
    [flatFiles, mentionQuery],
  );

  const hasActiveEditor = Boolean(activeEditor);
  const totalItems = hasActiveEditor ? filteredFiles.length + 1 : filteredFiles.length;

  // ── Input handling ──
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (disabled) return;
      const value = e.target.value;
      setUserInput(value);

      const cursorPos = e.target.selectionStart ?? value.length;
      // Find the last unescaped @ before the cursor
      const textBeforeCursor = value.slice(0, cursorPos);
      const lastAt = textBeforeCursor.lastIndexOf("@");

      if (lastAt !== -1 && (lastAt === 0 || /\s/.test(value[lastAt - 1]))) {
        const query = textBeforeCursor.slice(lastAt + 1);
        // Close the mention if user typed a space after query text
        if (/\s/.test(query)) {
          setMentionOpen(false);
        } else {
          setMentionQuery(query);
          setMentionAnchor(lastAt);
          setMentionOpen(true);
          setMentionIndex(0);
        }
      } else {
        setMentionOpen(false);
      }
    },
    [disabled],
  );

  // ── Select a file from the dropdown ──
  const selectFile = useCallback(
    (filePath: string) => {
      const before = userInput.slice(0, mentionAnchor);
      const afterRaw = userInput.slice(mentionAnchor);
      // Skip the @query portion (up to the next space or end)
      const spaceIdx = afterRaw.indexOf(" ", 1);
      const after = spaceIdx !== -1 ? afterRaw.slice(spaceIdx) : "";

      const newValue = `${before}@${filePath} ${after.trimStart()}`;
      setUserInput(newValue);
      setMentionOpen(false);

      // Restore focus & cursor
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          const pos = before.length + filePath.length + 2; // "@" + path + " "
          el.focus();
          el.setSelectionRange(pos, pos);
        }
      });
    },
    [userInput, mentionAnchor],
  );

  // ── Keyboard ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;

      // Mention navigation
      if (mentionOpen && totalItems > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionIndex((i) => Math.min(i + 1, totalItems - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          if (hasActiveEditor && mentionIndex === 0) {
            selectFile(activeEditor);
          } else {
            const idx = hasActiveEditor ? mentionIndex - 1 : mentionIndex;
            if (filteredFiles[idx]) selectFile(filteredFiles[idx].path);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMentionOpen(false);
          return;
        }
      }

      // Normal send
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [disabled, mentionOpen, totalItems, mentionIndex, hasActiveEditor, activeEditor, filteredFiles, userInput, selectFile],
  );

  const sendMessage = useCallback(() => {
    if (disabled || !userInput.trim()) return;
    const mentioned = extractMentions(userInput);
    onSendRef.current(userInput, mentioned);
    setUserInput("");
    setMentionOpen(false);
    clearReaderContext(null);
  }, [userInput, disabled, clearReaderContext]);

  // Scroll selected item into view
  useEffect(() => {
    if (mentionOpen && dropdownRef.current) {
      const el = dropdownRef.current.querySelector(`[data-idx="${mentionIndex}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [mentionIndex, mentionOpen]);

  // File extension label
  const ext = (name: string) => {
    const e = name.split(".").pop()?.toLowerCase();
    return e ? `.${e}` : "";
  };

  return (
    <div className="chat-input-wrapper">
      {/* Reader context chip */}
      {readerContext && (
        <div className="reader-context-chip" role="status">
          <span className="reader-context-icon">🌐</span>
          <span className="reader-context-label" title={readerContext.text.slice(0, 200)}>
            {readerContext.title}
          </span>
          <button
            className="reader-context-dismiss"
            onClick={() => clearReaderContext(null)}
            aria-label="Remove web context"
            title="Remove"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mention autocomplete dropdown (rendered above textarea) */}
      {mentionOpen && totalItems > 0 && (
        <div className="mention-dropdown" ref={dropdownRef}>
          <ul className="mention-list">
            {hasActiveEditor && (
              <li
                className={`mention-item${mentionIndex === 0 ? " mention-item--active" : ""}`}
                data-idx={0}
                onMouseDown={(e) => { e.preventDefault(); selectFile(activeEditor); }}
              >
                <span className="mention-ext">{ext(activeEditor)}</span>
                <span className="mention-name">{activeEditor.split("/").pop()}</span>
                <span className="mention-badge">active</span>
              </li>
            )}
            {filteredFiles.map((file, i) => {
              const idx = hasActiveEditor ? i + 1 : i;
              const dir = getDirectory(file.path);
              return (
                <li
                  key={file.path}
                  className={`mention-item${mentionIndex === idx ? " mention-item--active" : ""}`}
                  data-idx={idx}
                  onMouseDown={(e) => { e.preventDefault(); selectFile(file.path); }}
                >
                  <span className="mention-ext">{ext(file.name)}</span>
                  <div className="mention-file-info">
                    <span className="mention-name">{file.name}</span>
                    {dir && <span className="mention-path">{dir}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="chat-input-textarea"
        value={userInput}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Agent is working..." : "Ask CodeBuddy... (type @ to mention files)"}
        disabled={disabled}
        rows={1}
      />
    </div>
  );
};

export default ChatInput;
