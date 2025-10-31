/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

interface WorkspceCategory {
  id: string;
  name: string;
  children?: WorkspceCategory[];
}

const styles: { [key: string]: React.CSSProperties } = {
  WorkspceSelector: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "96%",
    padding: "0.5rem",
    border: "2px solid var(--vscode-editor-background)",
    borderRadius: "4px",
    background: "#16161e",
    color: "inherit",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: "0",
    width: "100%",
    maxHeight: "300px",
    overflowY: "auto",
    backgroundColor: "rgb(22, 22, 30)",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    zIndex: 10,
    marginTop: "4px",
  },
  breadcrumb: {
    backgroundColor: "#f0f0f0",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e0e0e0",
  },
  breadcrumbBack: {
    marginRight: "10px",
    color: "#007bff",
    cursor: "pointer",
  },
  list: {
    listStyle: "none",
    padding: "0",
    margin: "0",
  },
  listItem: {
    padding: "0.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  listItemHover: {
    backgroundColor: "#f5f5f5",
  },
  itemIcon: {
    color: "#888",
  },
};
interface WorkspceSelectorProps {
  onInputChange: (value: string) => void;
  initialValue?: string;
  folders: any;
  activeEditor: string;
}

const WorkspaceSelector: React.FC<WorkspceSelectorProps> = ({
  onInputChange,
  initialValue = "",
  folders,
  activeEditor,
}) => {
  // Use useMemo to parse folders only when the folders prop changes
  const workspaceFolders = useMemo(() => {
    if (folders) {
      try {
        return JSON.parse(folders.message);
      } catch (error: any) {
        console.log("folders prop is empty or not a valid string", error.message);
        return []; // Return an empty array to avoid further errors
      }
    }
    return []; // Return an empty array when folders is initially undefined
  }, [folders]);

  const [isOpen, setIsOpen] = useState(false);
  const [currentCategories, setCurrentCategories] = useState<WorkspceCategory[]>([
    { id: "activeEditor", name: activeEditor },
  ]);
  const [breadcrumbs, setBreadcrumbs] = useState<WorkspceCategory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(initialValue);

  // Use useCallback to prevent unnecessary re-renders
  const setInput = useCallback(
    (newValue: string) => {
      setInputValue(newValue);
      onInputChange(newValue);
    },
    [onInputChange]
  );

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Memoize the activeEditor category object
  const activeEditorCategory = useMemo(() => ({ id: "activeEditor", name: activeEditor }), [activeEditor]);

  // Combine activeEditorCategory and workspaceFolders using useMemo
  const initialCategories = useMemo(() => {
    return [activeEditorCategory, ...workspaceFolders];
  }, [activeEditorCategory, workspaceFolders]);

  // Handle input changes using useCallback
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInput(newValue);

      if (newValue.length > 0 && newValue.startsWith("@")) {
        const lastAtIndex = newValue.lastIndexOf("@");
        const lastAtIsValidStart = lastAtIndex === 0 || newValue[lastAtIndex - 1] === " ";
        setIsOpen(lastAtIsValidStart);
        if (!lastAtIsValidStart) {
          setIsOpen(false);
          setCurrentCategories(initialCategories);
          setBreadcrumbs([]);
        }
      } else {
        setIsOpen(false);
        setCurrentCategories(initialCategories);
        setBreadcrumbs([]);
      }
    },
    [setInput, initialCategories]
  );

  const handleItemSelection = useCallback(
    (item: WorkspceCategory) => {
      console.log("Selected:", item);
      setIsOpen(false);
      if (inputRef.current) {
        const cursorPosition = inputRef.current.selectionStart ?? 0;
        const textBeforeCursor = inputValue.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1 && (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === " ")) {
          const newInputValue =
            textBeforeCursor.substring(0, lastAtIndex) + `@${item.name} ` + inputValue.substring(cursorPosition);
          inputRef.current.value = newInputValue;
          setInput(newInputValue);
          inputRef.current.focus();

          const newCursorPosition = lastAtIndex + item.name.length + 2;
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        } else {
          inputRef.current.value = `@${item.name}`;
          setInput(`@${item.name}`);
        }
      }
    },
    [inputValue, setInput]
  );

  // Navigate to category using useCallback
  const navigateToCategory = useCallback(
    (category: WorkspceCategory) => {
      if (category.children) {
        setCurrentCategories(category.children);
        setBreadcrumbs((prev) => [...prev, category]);
      } else {
        handleItemSelection(category);
      }
    },
    [handleItemSelection]
  );

  // Go back using useCallback
  const goBack = useCallback(() => {
    if (breadcrumbs.length > 0) {
      const newBreadcrumbs = [...breadcrumbs];
      newBreadcrumbs.pop();

      const parentCategories =
        newBreadcrumbs.length === 0
          ? workspaceFolders
          : newBreadcrumbs[newBreadcrumbs.length - 1].children || workspaceFolders;

      setCurrentCategories(parentCategories);
      setBreadcrumbs(newBreadcrumbs);
    }
  }, [breadcrumbs, workspaceFolders]);

  // Handle item selection using useCallback

  // Handle click outside using useCallback
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest("[data-Workspce-selector]")) {
        setIsOpen(false);
        setCurrentCategories(initialCategories);
        setBreadcrumbs([]);
      }
    },
    [isOpen, initialCategories]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div style={styles.WorkspceSelector} data-Workspce-selector="true">
      <input
        ref={inputRef}
        type="text"
        placeholder="Type @ to reveal files"
        style={styles.input}
        onChange={handleInputChange}
        value={inputValue}
        disabled={initialValue.length > 1}
      />

      {isOpen && (
        <div style={styles.dropdown}>
          {breadcrumbs.length > 0 && (
            <div style={styles.breadcrumb}>
              <button
                onClick={goBack}
                style={{
                  ...styles.breadcrumbBack,
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
                aria-label="Go back"
              >
                ← Back
              </button>
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.id}>
                  {index > 0 && <span style={{ margin: "0 5px" }}>/</span>}
                  {crumb.name}
                </span>
              ))}
            </div>
          )}

          <ul style={styles.list}>
            {currentCategories.map((category) => (
              <li key={category.id} className="list-item" style={styles.listItem}>
                <button
                  onClick={() => navigateToCategory(category)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  <span>{category.name}</span>
                  {category.children && <span style={styles.itemIcon}>→</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;
