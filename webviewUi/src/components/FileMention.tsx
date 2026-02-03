/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { flattenFileTree, searchFiles, getDirectory } from "../utils/fuzzySearch";
import styled from "styled-components";

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 96%;
  padding: 0.5rem;
  border: 2px solid var(--vscode-editor-background);
  border-radius: 4px;
  background: #16161e;
  color: inherit;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder, #007acc);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background-color: rgb(22, 22, 30);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  margin-top: 4px;
`;

const FileList = styled.ul`
  list-style: none;
  padding: 4px;
  margin: 0;
`;

const FileListItem = styled.li<{ $isSelected?: boolean }>`
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  border-radius: 4px;
  background: ${(props) => (props.$isSelected ? "rgba(255, 255, 255, 0.1)" : "transparent")};
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const FileName = styled.span`
  font-size: 13px;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FileIcon = styled.span`
  font-size: 14px;
`;

const FilePath = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 20px;
`;

const NoResults = styled.div`
  padding: 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
`;

const ActiveEditorItem = styled.li<{ $isSelected?: boolean }>`
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-radius: 4px;
  background: ${(props) => (props.$isSelected ? "rgba(255, 255, 255, 0.1)" : "transparent")};
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ActiveEditorLabel = styled.span`
  font-size: 11px;
  color: #4fc3f7;
  background: rgba(79, 195, 247, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
`;

interface FileMentionProps {
  onInputChange: (value: string) => void;
  initialValue?: string;
  folders: any;
  activeEditor: string;
}

const FileMention: React.FC<FileMentionProps> = ({
  onInputChange,
  initialValue = "",
  folders,
  activeEditor,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Flatten the folder tree into a searchable list
  const flatFiles = useMemo(() => {
    if (!folders?.message) return [];
    try {
      const tree = JSON.parse(folders.message);
      return flattenFileTree(tree);
    } catch (error) {
      console.error("Error parsing folders:", error);
      return [];
    }
  }, [folders]);

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    return searchFiles(flatFiles, searchQuery, 15);
  }, [flatFiles, searchQuery]);

  // Include active editor at top if it matches
  const hasActiveEditor = activeEditor && activeEditor.length > 0;
  const totalItems = hasActiveEditor ? filteredFiles.length + 1 : filteredFiles.length;

  // Update input value callback
  const updateInput = useCallback(
    (value: string) => {
      setInputValue(value);
      onInputChange(value);
    },
    [onInputChange]
  );

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      updateInput(value);

      // Check for @ trigger
      const lastAtIndex = value.lastIndexOf("@");
      if (lastAtIndex !== -1 && (lastAtIndex === 0 || value[lastAtIndex - 1] === " ")) {
        const query = value.substring(lastAtIndex + 1).split(" ")[0];
        setSearchQuery(query);
        setIsOpen(true);
        setSelectedIndex(0);
      } else {
        setIsOpen(false);
        setSearchQuery("");
      }
    },
    [updateInput]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (hasActiveEditor && selectedIndex === 0) {
            selectFile(activeEditor);
          } else {
            const fileIndex = hasActiveEditor ? selectedIndex - 1 : selectedIndex;
            if (filteredFiles[fileIndex]) {
              selectFile(filteredFiles[fileIndex].path);
            }
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearchQuery("");
          break;
      }
    },
    [isOpen, selectedIndex, totalItems, hasActiveEditor, activeEditor, filteredFiles]
  );

  // Select a file
  const selectFile = useCallback(
    (filePath: string) => {
      const lastAtIndex = inputValue.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        // Find where the current mention ends (next space or end of string)
        const afterAt = inputValue.substring(lastAtIndex + 1);
        const spaceIndex = afterAt.indexOf(" ");
        const endIndex = spaceIndex !== -1 ? lastAtIndex + 1 + spaceIndex : inputValue.length;
        
        const newValue =
          inputValue.substring(0, lastAtIndex) +
          `@${filePath} ` +
          inputValue.substring(endIndex).trimStart();
        
        updateInput(newValue);
        
        // Set cursor position after the inserted mention
        setTimeout(() => {
          if (inputRef.current) {
            const cursorPos = lastAtIndex + filePath.length + 2;
            inputRef.current.setSelectionRange(cursorPos, cursorPos);
            inputRef.current.focus();
          }
        }, 0);
      }
      
      setIsOpen(false);
      setSearchQuery("");
    },
    [inputValue, updateInput]
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        isOpen &&
        !target.closest("[data-file-mention]") &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  // Get file icon based on extension
  const getFileIcon = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const icons: Record<string, string> = {
      ts: "📘",
      tsx: "⚛️",
      js: "📒",
      jsx: "⚛️",
      json: "📋",
      md: "📝",
      css: "🎨",
      scss: "🎨",
      html: "🌐",
      py: "🐍",
      rs: "🦀",
      go: "🐹",
      java: "☕",
      yml: "⚙️",
      yaml: "⚙️",
      sql: "🗃️",
      sh: "🖥️",
      bash: "🖥️",
      zsh: "🖥️",
    };
    return icons[ext || ""] || "📄";
  };

  return (
    <Container data-file-mention="true">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Type @ to mention files..."
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={initialValue.length > 1}
      />

      {isOpen && (
        <Dropdown ref={dropdownRef}>
          <FileList>
            {hasActiveEditor && (
              <ActiveEditorItem
                $isSelected={selectedIndex === 0}
                data-index={0}
                onClick={() => selectFile(activeEditor)}
              >
                <span>📌</span>
                <FileName>{activeEditor.split("/").pop()}</FileName>
                <ActiveEditorLabel>Current File</ActiveEditorLabel>
              </ActiveEditorItem>
            )}

            {filteredFiles.length > 0 ? (
              filteredFiles.map((file, index) => {
                const itemIndex = hasActiveEditor ? index + 1 : index;
                const directory = getDirectory(file.path);
                
                return (
                  <FileListItem
                    key={file.path}
                    $isSelected={selectedIndex === itemIndex}
                    data-index={itemIndex}
                    onClick={() => selectFile(file.path)}
                  >
                    <FileName>
                      <FileIcon>{getFileIcon(file.name)}</FileIcon>
                      {file.name}
                    </FileName>
                    {directory && <FilePath>{directory}</FilePath>}
                  </FileListItem>
                );
              })
            ) : (
              <NoResults>
                {flatFiles.length === 0
                  ? "Loading workspace files..."
                  : `No files matching "${searchQuery}"`}
              </NoResults>
            )}
          </FileList>
        </Dropdown>
      )}
    </Container>
  );
};

export default FileMention;
