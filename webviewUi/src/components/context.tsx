/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";

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
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "var(--vscode-input-background, #252526)",
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
// Default value for the folders to help solve issues with race conditions
const WORKSPACE_CONTEXT: WorkspceCategory[] = [{ id: "code-context", name: "Code Context Items" }];

interface WorkspceSelectorProps {
  onInputChange: (value: string) => void;
  initialValue?: string;
  folders: any;
}

const WorkspceSelector: React.FC<WorkspceSelectorProps> = ({ onInputChange, initialValue = "", folders }) => {
  let x: any;
  if (folders) {
    try {
      x = JSON.parse(folders.message);
    } catch (error: any) {
      console.log("folders prop is empty or not a valid string", error.message);
    }
  }
  const [isOpen, setIsOpen] = useState(false);
  const [currentCategories, setCurrentCategories] = useState<WorkspceCategory[]>(WORKSPACE_CONTEXT);
  const [breadcrumbs, setBreadcrumbs] = useState<WorkspceCategory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange(newValue);

    if (newValue.length > 0 && newValue.startsWith("@")) {
      const lastAtIndex = newValue.lastIndexOf("@");
      const lastAtIsValidStart = lastAtIndex === 0 || newValue[lastAtIndex - 1] === " ";
      setIsOpen(lastAtIsValidStart);
      if (!lastAtIsValidStart) {
        setIsOpen(false);
        setCurrentCategories(x);
        setBreadcrumbs([]);
      }
    } else {
      setIsOpen(false);
      setCurrentCategories(x);
      setBreadcrumbs([]);
    }
  };

  const navigateToCategory = (category: WorkspceCategory) => {
    if (category.children) {
      setCurrentCategories(category.children);
      setBreadcrumbs((prev) => [...prev, category]);
    } else {
      handleItemSelection(category);
    }
  };

  const goBack = () => {
    if (breadcrumbs.length > 0) {
      const newBreadcrumbs = [...breadcrumbs];
      newBreadcrumbs.pop();

      const parentCategories =
        newBreadcrumbs.length === 0 ? x : newBreadcrumbs[newBreadcrumbs.length - 1].children || x;

      setCurrentCategories(parentCategories);
      setBreadcrumbs(newBreadcrumbs);
    }
  };

  const handleItemSelection = (item: WorkspceCategory) => {
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
        setInputValue(newInputValue);
        onInputChange(newInputValue);
        inputRef.current.focus();

        const newCursorPosition = lastAtIndex + item.name.length + 2;
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      } else {
        inputRef.current.value = `@${item.name}`;
        setInputValue(`@${item.name}`);
        onInputChange(`@${item.name}`);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest("[data-Workspce-selector]")) {
        setIsOpen(false);
        setCurrentCategories(x);
        setBreadcrumbs([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, x]);

  return (
    <div style={styles.WorkspceSelector} data-Workspce-selector="true">
      <input
        ref={inputRef}
        type="text"
        placeholder="Type @ to attach"
        style={styles.input}
        onChange={handleInputChange}
        value={inputValue}
      />

      {isOpen && (
        <div style={styles.dropdown}>
          {breadcrumbs.length > 0 && (
            <div style={styles.breadcrumb}>
              <button
                onClick={goBack}
                style={{ ...styles.breadcrumbBack, background: "none", border: "none", padding: 0 }}
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

export default WorkspceSelector;
