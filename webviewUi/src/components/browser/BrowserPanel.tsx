import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { useContentStore } from "../../stores/content.store";
import { useSettingsStore } from "../../stores/settings.store";
import { vscode } from "../../utils/vscode";

// ── Icons (SVG, no emoji) ──

const CloseIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BookmarkIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const ChatIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SaveIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const ArticleIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const GlobeIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ── Styled Components ──

const PanelOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${(p) => (p.isOpen ? "flex" : "none")};
  justify-content: flex-end;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const PanelContainer = styled.div`
  width: 420px;
  height: 100%;
  background: var(--vscode-editor-background);
  border-left: 1px solid var(--vscode-widget-border);
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.2s ease;

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
`;

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--vscode-widget-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: all 0.15s ease;

  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
    opacity: 1;
  }
`;

const UrlBar = styled.form`
  display: flex;
  padding: 8px 16px;
  gap: 8px;
  border-bottom: 1px solid var(--vscode-widget-border);
`;

const UrlInput = styled.input`
  flex: 1;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  outline: none;

  &:focus {
    border-color: var(--vscode-focusBorder);
  }

  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
`;

const GoButton = styled.button`
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: var(--vscode-button-hoverBackground);
  }
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid var(--vscode-widget-border);
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${(p) => p.active ? "var(--vscode-focusBorder, #007acc)" : "transparent"};
  color: ${(p) => p.active ? "var(--vscode-foreground)" : "var(--vscode-descriptionForeground)"};
  font-size: 12px;
  font-weight: ${(p) => p.active ? 600 : 400};
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    color: var(--vscode-foreground);
    background: rgba(255, 255, 255, 0.04);
  }
`;

const TabCount = styled.span`
  font-size: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 10px;
`;

const ListContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 4px;
  }
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 12px 6px 16px;
  gap: 4px;
  transition: background 0.1s ease;

  &:hover {
    background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.04));
  }

  &:hover .item-actions {
    opacity: 1;
  }
`;

const ItemInfo = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 4px 0;
  color: var(--vscode-foreground);
  min-width: 0;
`;

const ItemTitle = styled.span`
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemUrl = styled.span`
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  opacity: 0.7;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  text-align: center;
`;

// ── Component ──

interface BrowserPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrowserPanel: React.FC<BrowserPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"history" | "bookmarks" | "saved">("history");
  const [urlValue, setUrlValue] = useState("");
  const browsingHistory = useContentStore((s) => s.browsingHistory);
  const bookmarks = useContentStore((s) => s.bookmarks);
  const savedArticles = useContentStore((s) => s.savedArticles);
  const scrapeStatus = useContentStore((s) => s.scrapeStatus);

  const handleNavigate = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    let url = urlValue.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try { new URL(url); } catch { return; }
    const browserType = useSettingsStore.getState().browserType;
    vscode.postMessage({ command: "openBrowser", text: url, browserType });
    setUrlValue("");
    onClose();
  }, [urlValue, onClose]);

  const handleOpenUrl = useCallback((url: string) => {
    const browserType = useSettingsStore.getState().browserType;
    vscode.postMessage({ command: "openBrowser", text: url, browserType });
    onClose();
  }, [onClose]);

  const handleBookmark = useCallback((url: string, title: string) => {
    useContentStore.getState().handleAddBookmark(url, title);
  }, []);

  const handleRemoveBookmark = useCallback((url: string) => {
    useContentStore.getState().handleRemoveBookmark(url);
  }, []);

  const handleAddToChat = useCallback((url: string, title: string) => {
    useContentStore.getState().handleAddHistoryToChat(url, title);
    onClose();
  }, [onClose]);

  const isBookmarked = useCallback((url: string) => {
    return bookmarks.some((b) => b.url === url);
  }, [bookmarks]);

  const handleScrapeAndSave = useCallback((url: string) => {
    useContentStore.getState().handleScrapeAndSave(url);
  }, []);

  const handleDeleteSavedArticle = useCallback((id: number) => {
    useContentStore.getState().handleDeleteSavedArticle(id);
  }, []);

  const handleOpenSavedArticle = useCallback((id: number) => {
    useContentStore.getState().handleOpenSavedArticle(id);
    onClose();
  }, [onClose]);

  // Load saved articles when switching to saved tab
  const handleTabChange = useCallback((tab: "history" | "bookmarks" | "saved") => {
    setActiveTab(tab);
    if (tab === "saved") {
      useContentStore.getState().handleGetSavedArticles();
    }
  }, []);

  if (!isOpen) return null;

  return (
    <PanelOverlay isOpen={isOpen} onClick={onClose}>
      <PanelContainer onClick={(e) => e.stopPropagation()}>
        {/* Chrome-style header */}
        <Header>
          <Title>
            <GlobeIcon /> Browser
          </Title>
          <IconButton onClick={onClose} title="Close" aria-label="Close browser panel">
            <CloseIcon />
          </IconButton>
        </Header>

        {/* URL bar */}
        <UrlBar onSubmit={handleNavigate}>
          <UrlInput
            type="text"
            placeholder="Search or enter URL..."
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            autoFocus
          />
          <GoButton type="submit">Go</GoButton>
        </UrlBar>

        {/* Tab bar — History / Bookmarks / Saved */}
        <TabBar>
          <Tab active={activeTab === "history"} onClick={() => handleTabChange("history")}>
            History <TabCount>{browsingHistory.length}</TabCount>
          </Tab>
          <Tab active={activeTab === "bookmarks"} onClick={() => handleTabChange("bookmarks")}>
            <BookmarkIcon /> Bookmarks <TabCount>{bookmarks.length}</TabCount>
          </Tab>
          <Tab active={activeTab === "saved"} onClick={() => handleTabChange("saved")}>
            <ArticleIcon /> Saved <TabCount>{savedArticles.length}</TabCount>
          </Tab>
        </TabBar>

        {/* Scrape status banner */}
        {scrapeStatus && (
          <div style={{
            padding: "6px 16px",
            fontSize: 11,
            background: scrapeStatus.status === "error"
              ? "var(--vscode-inputValidation-errorBackground, rgba(255,0,0,0.1))"
              : "var(--vscode-inputValidation-infoBackground, rgba(0,122,204,0.1))",
            borderBottom: "1px solid var(--vscode-widget-border)",
            color: scrapeStatus.status === "error"
              ? "var(--vscode-errorForeground, #f48771)"
              : "var(--vscode-foreground)",
          }}>
            {scrapeStatus.status === "scraping" && "Scraping page via Playwright..."}
            {scrapeStatus.status === "saving" && "Saving article..."}
            {scrapeStatus.status === "done" && "Article scraped & saved!"}
            {scrapeStatus.status === "error" && `Error: ${scrapeStatus.error}`}
          </div>
        )}

        {/* Content */}
        <ListContent>
          {activeTab === "history" && (
            browsingHistory.length === 0 ? (
              <EmptyState>
                <GlobeIcon />
                No browsing history yet.<br />
                Enter a URL above to get started.
              </EmptyState>
            ) : (
              browsingHistory.map((item, i) => (
                <ItemRow key={`${item.url}-${i}`}>
                  <ItemInfo onClick={() => handleOpenUrl(item.url)}>
                    <ItemTitle>{item.title}</ItemTitle>
                    <ItemUrl>{item.url}</ItemUrl>
                  </ItemInfo>
                  <ItemActions className="item-actions">
                    <IconButton
                      title={isBookmarked(item.url) ? "Bookmarked" : "Bookmark this page"}
                      aria-label={`Bookmark ${item.title}`}
                      onClick={() => handleBookmark(item.url, item.title)}
                      style={isBookmarked(item.url) ? { color: "var(--vscode-notificationsInfoIcon-foreground, #3794ff)", opacity: 1 } : undefined}
                    >
                      <BookmarkIcon filled={isBookmarked(item.url)} />
                    </IconButton>
                    <IconButton
                      title="Scrape & Save (bypass paywall)"
                      aria-label={`Scrape ${item.title} and save to Smart Reader`}
                      onClick={() => handleScrapeAndSave(item.url)}
                    >
                      <SaveIcon />
                    </IconButton>
                    <IconButton
                      title="Add to Chat"
                      aria-label={`Add ${item.title} to chat`}
                      onClick={() => handleAddToChat(item.url, item.title)}
                    >
                      <ChatIcon />
                    </IconButton>
                    <IconButton
                      title="Open in new tab"
                      aria-label={`Open ${item.title}`}
                      onClick={() => handleOpenUrl(item.url)}
                    >
                      <ExternalLinkIcon />
                    </IconButton>
                  </ItemActions>
                </ItemRow>
              ))
            )
          )}

          {activeTab === "bookmarks" && (
            bookmarks.length === 0 ? (
              <EmptyState>
                <BookmarkIcon />
                No bookmarks yet.<br />
                Bookmark pages from your history to save them for later.
              </EmptyState>
            ) : (
              bookmarks.map((bm) => (
                <ItemRow key={bm.url}>
                  <ItemInfo onClick={() => handleOpenUrl(bm.url)}>
                    <ItemTitle>{bm.title}</ItemTitle>
                    <ItemUrl>{bm.url}</ItemUrl>
                  </ItemInfo>
                  <ItemActions className="item-actions">
                    <IconButton
                      title="Scrape & Save (bypass paywall)"
                      aria-label={`Scrape ${bm.title} and save to Smart Reader`}
                      onClick={() => handleScrapeAndSave(bm.url)}
                    >
                      <SaveIcon />
                    </IconButton>
                    <IconButton
                      title="Add to Chat"
                      aria-label={`Add ${bm.title} to chat`}
                      onClick={() => handleAddToChat(bm.url, bm.title)}
                    >
                      <ChatIcon />
                    </IconButton>
                    <IconButton
                      title="Remove bookmark"
                      aria-label={`Remove bookmark ${bm.title}`}
                      onClick={() => handleRemoveBookmark(bm.url)}
                      style={{ color: "var(--vscode-errorForeground, #f48771)" }}
                    >
                      <TrashIcon />
                    </IconButton>
                  </ItemActions>
                </ItemRow>
              ))
            )
          )}

          {activeTab === "saved" && (
            savedArticles.length === 0 ? (
              <EmptyState>
                <ArticleIcon />
                No saved articles yet.<br />
                Use the scrape button on history or bookmark items to bypass paywalls and save articles for offline reading.
              </EmptyState>
            ) : (
              savedArticles.map((article) => (
                <ItemRow key={article.id}>
                  <ItemInfo onClick={() => handleOpenSavedArticle(article.id)}>
                    <ItemTitle>{article.title}</ItemTitle>
                    <ItemUrl>
                      {article.author ? `${article.author} · ` : ""}
                      {article.site_name ? `${article.site_name} · ` : ""}
                      {new Date(article.saved_at).toLocaleDateString()}
                    </ItemUrl>
                    {article.excerpt && (
                      <ItemUrl style={{ marginTop: 2, whiteSpace: "normal", lineHeight: 1.3 }}>
                        {article.excerpt.substring(0, 120)}
                        {article.excerpt.length > 120 ? "..." : ""}
                      </ItemUrl>
                    )}
                  </ItemInfo>
                  <ItemActions className="item-actions">
                    <IconButton
                      title="Open in Smart Reader"
                      aria-label={`Open ${article.title}`}
                      onClick={() => handleOpenSavedArticle(article.id)}
                    >
                      <ArticleIcon />
                    </IconButton>
                    <IconButton
                      title="Delete saved article"
                      aria-label={`Delete ${article.title}`}
                      onClick={() => handleDeleteSavedArticle(article.id)}
                      style={{ color: "var(--vscode-errorForeground, #f48771)" }}
                    >
                      <TrashIcon />
                    </IconButton>
                  </ItemActions>
                </ItemRow>
              ))
            )
          )}
        </ListContent>
      </PanelContainer>
    </PanelOverlay>
  );
};
