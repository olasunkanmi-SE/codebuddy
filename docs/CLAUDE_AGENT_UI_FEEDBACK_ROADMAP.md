# Claude-Like Agent UI Feedback Implementation Roadmap

## Executive Summary

This document outlines a comprehensive plan to transform CodeBuddy's agent feedback system to match the professional, real-time feedback experience of Claude's agentic interface. The current implementation shows raw search results after long wait times with minimal user feedback. We'll implement progressive disclosure, real-time status updates, result summarization, and professional UI components.

---

## Current State Analysis

### Problem Statement
When a user asks: *"github.com/olasunkanmi-SE/codebuddy issue number 7 days too much to retain code analysis"*

**Current behavior:**
1. Long wait with generic skeleton loader
2. Raw search results dumped to UI
3. No indication of what the agent is doing
4. Unprofessional appearance with markdown tables and raw URLs

**Expected behavior (Claude-like):**
1. Progressive status updates: "Searching the web...", "Found 5 results...", "Analyzing content..."
2. Clean UI cards for search results
3. Summarized answer at the top
4. Expandable raw data for advanced users

### Architecture Overview

```
Current Flow:
┌──────────┐    ┌──────────────────┐    ┌─────────────┐    ┌──────────┐
│ User     │───▶│ MessageHandler   │───▶│ Agent       │───▶│ WebView  │
│ Input    │    │ (no intermediate │    │ (tool exec) │    │ (raw     │
│          │    │  feedback)       │    │             │    │  output) │
└──────────┘    └──────────────────┘    └─────────────┘    └──────────┘

Proposed Flow:
┌──────────┐    ┌──────────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────┐
│ User     │───▶│ MessageHandler   │───▶│ Agent       │───▶│ Result       │───▶│ WebView  │
│ Input    │    │ + ActivityFeed   │    │ + ToolFeed  │    │ Synthesizer  │    │ (clean   │
│          │    │                  │    │             │    │              │    │  cards)  │
└──────────┘    └──────────────────┘    └─────────────┘    └──────────────┘    └──────────┘
```

---

## Implementation Phases

### Phase 1: Real-Time Activity Feed (Week 1-2)

**Goal:** Show users what the agent is doing in real-time

#### 1.1 Add New Stream Event Types

**File:** `src/agents/interface/agent.interface.ts`

```typescript
export enum StreamEventType {
  START = "onStreamStart",
  END = "onStreamEnd",
  CHUNK = "onStreamChunk",
  TOOL_START = "onToolStart",      // NEW
  TOOL_END = "onToolEnd",          // NEW
  TOOL_PROGRESS = "onToolProgress", // NEW
  THINKING = "onThinking",          // NEW
  PLANNING = "onPlanning",          // NEW
  SUMMARIZING = "onSummarizing",    // NEW
  ERROR = "onStreamError",
  METADATA = "streamMetadata",
}

export interface IToolActivity {
  toolName: string;
  status: 'starting' | 'running' | 'completed' | 'failed';
  description: string;
  startTime: number;
  endTime?: number;
  result?: {
    summary?: string;
    itemCount?: number;
    preview?: string;
  };
}
```

#### 1.2 Emit Tool Events from Agent Service

**File:** `src/agents/services/codebuddy-agent.service.ts`

Add tool event emission in the `streamResponse` method:

```typescript
// When tool starts
yield {
  type: StreamEventType.TOOL_START,
  content: JSON.stringify({
    toolName: toolCall.name,
    description: this.getToolDescription(toolCall.name),
    args: toolCall.args,
  }),
  metadata: { node: nodeName, timestamp: Date.now() },
};

// When tool completes
yield {
  type: StreamEventType.TOOL_END,
  content: JSON.stringify({
    toolName: toolCall.name,
    status: 'completed',
    resultSummary: this.summarizeToolResult(result),
  }),
  metadata: { node: nodeName, timestamp: Date.now() },
};
```

#### 1.3 Update Publisher to Handle New Events

**File:** `src/emitter/publisher.ts`

```typescript
// Add new events
onToolStart: vscode.Event<IEventPayload> = this.createEvent("onToolStart");
onToolEnd: vscode.Event<IEventPayload> = this.createEvent("onToolEnd");
onToolProgress: vscode.Event<IEventPayload> = this.createEvent("onToolProgress");
onThinking: vscode.Event<IEventPayload> = this.createEvent("onThinking");
onPlanning: vscode.Event<IEventPayload> = this.createEvent("onPlanning");
```

#### 1.4 Forward Events to WebView

**File:** `src/webview-providers/manager.ts`

```typescript
private async handleToolStart(event: IEventPayload) {
  if (this.webviewView?.webview) {
    await this.webviewView.webview.postMessage({
      type: 'onToolStart',
      payload: {
        requestId: event.message.requestId,
        toolName: event.message.toolName,
        description: event.message.description,
        timestamp: Date.now(),
      },
    });
  }
}

private async handleToolEnd(event: IEventPayload) {
  if (this.webviewView?.webview) {
    await this.webviewView.webview.postMessage({
      type: 'onToolEnd',
      payload: {
        requestId: event.message.requestId,
        toolName: event.message.toolName,
        status: event.message.status,
        resultSummary: event.message.resultSummary,
        timestamp: Date.now(),
      },
    });
  }
}
```

---

### Phase 2: Activity Feed UI Component (Week 2-3)

**Goal:** Create a professional UI component showing agent activity

#### 2.1 Create AgentActivityFeed Component

**File:** `webviewUi/src/components/AgentActivityFeed.tsx`

```tsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

interface ActivityItem {
  id: string;
  type: 'tool_start' | 'tool_end' | 'thinking' | 'planning' | 'summarizing';
  toolName?: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  timestamp: number;
  result?: {
    summary?: string;
    itemCount?: number;
  };
}

interface AgentActivityFeedProps {
  activities: ActivityItem[];
  isActive: boolean;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Container = styled.div`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActivityItem = styled.div<{ $status: string }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid ${props => 
    props.$status === 'active' ? '#3b82f6' : 
    props.$status === 'completed' ? '#22c55e' : '#ef4444'
  };
`;

const StatusIndicator = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#3b82f6' : '#22c55e'};
  animation: ${props => props.$active ? pulse : 'none'} 1.5s ease-in-out infinite;
  margin-top: 6px;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const ToolName = styled.span`
  font-weight: 600;
  color: #93c5fd;
  font-size: 13px;
`;

const TimeStamp = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
`;

const Description = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
`;

const ResultSummary = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: #86efac;
`;

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({ activities, isActive }) => {
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'web_search': return '🔍';
      case 'read_file': return '📄';
      case 'analyze_files': return '🔬';
      case 'think': return '💭';
      default: return '⚡';
    }
  };

  const getToolDisplayName = (toolName: string) => {
    switch (toolName) {
      case 'web_search': return 'Web Search';
      case 'read_file': return 'Reading File';
      case 'analyze_files': return 'Analyzing Code';
      case 'think': return 'Reasoning';
      default: return toolName.replace(/_/g, ' ');
    }
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <Container>
      <ActivityList>
        {activities.map((activity) => (
          <ActivityItem key={activity.id} $status={activity.status}>
            <StatusIndicator $active={activity.status === 'active'} />
            <ActivityContent>
              <ActivityHeader>
                <ToolName>
                  {getToolIcon(activity.toolName || '')} {getToolDisplayName(activity.toolName || '')}
                </ToolName>
                <TimeStamp>{formatTime(activity.timestamp)}</TimeStamp>
              </ActivityHeader>
              <Description>{activity.description}</Description>
              {activity.result?.summary && (
                <ResultSummary>
                  ✓ {activity.result.summary}
                  {activity.result.itemCount && ` (${activity.result.itemCount} items)`}
                </ResultSummary>
              )}
            </ActivityContent>
          </ActivityItem>
        ))}
      </ActivityList>
    </Container>
  );
};
```

#### 2.2 Update useStreamingChat Hook

**File:** `webviewUi/src/hooks/useStreamingChat.ts`

```typescript
// Add activity tracking
const [activities, setActivities] = useState<ActivityItem[]>([]);

const handleToolStart = useCallback((payload: any) => {
  const activity: ActivityItem = {
    id: `activity-${Date.now()}`,
    type: 'tool_start',
    toolName: payload.toolName,
    description: payload.description || `Running ${payload.toolName}...`,
    status: 'active',
    timestamp: Date.now(),
  };
  setActivities(prev => [...prev, activity]);
}, []);

const handleToolEnd = useCallback((payload: any) => {
  setActivities(prev => prev.map(activity => 
    activity.toolName === payload.toolName && activity.status === 'active'
      ? {
          ...activity,
          status: 'completed',
          result: payload.resultSummary,
        }
      : activity
  ));
}, []);
```

---

### Phase 3: Result Summarization Service (Week 3-4)

**Goal:** Synthesize raw results into clean, professional summaries

#### 3.1 Create Result Synthesizer Service

**File:** `src/services/result-synthesizer.service.ts`

```typescript
import { GroqLLM } from "../llms/groq/groq";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface SynthesizedResult {
  summary: string;
  keyPoints: string[];
  sources: Array<{
    title: string;
    url: string;
    relevance: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
}

export class ResultSynthesizerService {
  private static instance: ResultSynthesizerService;
  private readonly llm: GroqLLM;
  private readonly logger: Logger;

  private constructor() {
    this.llm = GroqLLM.getInstance({
      apiKey: process.env.GROQ_API_KEY || '',
      model: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    });
    this.logger = Logger.initialize("ResultSynthesizerService", {
      minLevel: LogLevel.DEBUG,
    });
  }

  static getInstance(): ResultSynthesizerService {
    return (ResultSynthesizerService.instance ??= new ResultSynthesizerService());
  }

  async synthesizeSearchResults(
    query: string,
    results: SearchResult[]
  ): Promise<SynthesizedResult> {
    const prompt = `You are an expert research assistant. Given a user's question and search results, provide a clear, concise synthesis.

**User's Question:** ${query}

**Search Results:**
${results.map((r, i) => `
[${i + 1}] ${r.title}
URL: ${r.url}
Content: ${r.content.substring(0, 500)}...
`).join('\n')}

**Instructions:**
1. Provide a direct, helpful answer (2-3 sentences max)
2. Extract 3-5 key points that address the user's question
3. Rate each source's relevance (high/medium/low)
4. Rate your confidence in the answer (high/medium/low)

**Output as JSON:**
{
  "summary": "Your concise answer here",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "sources": [
    {"title": "...", "url": "...", "relevance": "high|medium|low"}
  ],
  "confidence": "high|medium|low"
}`;

    try {
      const response = await this.llm.generateText(prompt);
      if (!response) {
        throw new Error("No response from LLM");
      }
      
      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if no JSON found
      return this.createFallbackSynthesis(query, results);
    } catch (error) {
      this.logger.error("Synthesis failed:", error);
      return this.createFallbackSynthesis(query, results);
    }
  }

  private createFallbackSynthesis(query: string, results: SearchResult[]): SynthesizedResult {
    return {
      summary: `Found ${results.length} results for "${query}". Review the sources below for details.`,
      keyPoints: results.slice(0, 3).map(r => r.title),
      sources: results.slice(0, 5).map(r => ({
        title: r.title,
        url: r.url,
        relevance: r.score && r.score > 0.7 ? 'high' : r.score && r.score > 0.4 ? 'medium' : 'low',
      })),
      confidence: 'medium',
    };
  }
}
```

#### 3.2 Update Travily Search Tool

**File:** `src/services/context-retriever.ts`

```typescript
async travilySearchWithSynthesis(query: string) {
  const defaults = {
    maxResults: 5,
    includeRawContent: false,
    timeout: 30000,
  };
  
  try {
    // Emit progress
    this.orchestrator.publish(StreamEventType.TOOL_PROGRESS, {
      toolName: 'web_search',
      status: 'searching',
      message: `Searching for: "${query}"`,
    });

    const result = await this.tavilySearch.search(query, defaults);
    
    // Emit found results
    this.orchestrator.publish(StreamEventType.TOOL_PROGRESS, {
      toolName: 'web_search',
      status: 'processing',
      message: `Found ${result.results.length} results, analyzing...`,
    });

    // Synthesize results
    const synthesizer = ResultSynthesizerService.getInstance();
    const synthesized = await synthesizer.synthesizeSearchResults(query, result.results);

    return {
      type: 'synthesized_search',
      synthesized,
      rawResults: result.results,
    };
  } catch (error: any) {
    this.logger.error("[WebSearch] Execution Error:", error);
    return { type: 'error', message: error.message };
  }
}
```

---

### Phase 4: Enhanced UI Components (Week 4-5)

**Goal:** Create professional, card-based UI for different result types

#### 4.1 Create SearchResultCard Component

**File:** `webviewUi/src/components/SearchResultCard.tsx`

```tsx
import React, { useState } from 'react';
import styled from 'styled-components';

interface Source {
  title: string;
  url: string;
  relevance: 'high' | 'medium' | 'low';
}

interface SearchResultCardProps {
  summary: string;
  keyPoints: string[];
  sources: Source[];
  confidence: 'high' | 'medium' | 'low';
  showRawData?: boolean;
  rawData?: string;
}

const Card = styled.div`
  background: linear-gradient(135deg, rgba(30, 30, 45, 0.8) 0%, rgba(20, 20, 35, 0.9) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin: 16px 0;
`;

const Summary = styled.div`
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
`;

const SectionTitle = styled.h4`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.6);
  margin: 16px 0 8px;
`;

const KeyPointsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const KeyPoint = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  
  &::before {
    content: '→';
    color: #22c55e;
    font-weight: bold;
  }
`;

const SourcesList = styled.div`
  display: grid;
  gap: 8px;
`;

const SourceCard = styled.a<{ $relevance: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid ${props => 
    props.$relevance === 'high' ? '#22c55e' :
    props.$relevance === 'medium' ? '#f59e0b' : '#6b7280'
  };
  
  &:hover {
    background: rgba(59, 130, 246, 0.2);
    transform: translateX(4px);
  }
`;

const SourceInfo = styled.div`
  flex: 1;
  overflow: hidden;
`;

const SourceTitle = styled.div`
  font-size: 13px;
  color: #93c5fd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SourceUrl = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RelevanceBadge = styled.span<{ $level: string }>`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => 
    props.$level === 'high' ? 'rgba(34, 197, 94, 0.2)' :
    props.$level === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(107, 114, 128, 0.2)'
  };
  color: ${props => 
    props.$level === 'high' ? '#86efac' :
    props.$level === 'medium' ? '#fcd34d' : '#9ca3af'
  };
`;

const ConfidenceBanner = styled.div<{ $level: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-top: 16px;
  background: ${props => 
    props.$level === 'high' ? 'rgba(34, 197, 94, 0.1)' :
    props.$level === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'
  };
  border-radius: 8px;
  font-size: 12px;
  color: ${props => 
    props.$level === 'high' ? '#86efac' :
    props.$level === 'medium' ? '#fcd34d' : '#fca5a5'
  };
`;

const ToggleButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 12px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const RawDataSection = styled.pre`
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  font-size: 11px;
  overflow-x: auto;
  color: rgba(255, 255, 255, 0.6);
`;

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  summary,
  keyPoints,
  sources,
  confidence,
  showRawData = false,
  rawData,
}) => {
  const [showRaw, setShowRaw] = useState(false);

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high': return '✓';
      case 'medium': return '~';
      default: return '?';
    }
  };

  return (
    <Card>
      <Summary>{summary}</Summary>
      
      {keyPoints.length > 0 && (
        <>
          <SectionTitle>Key Points</SectionTitle>
          <KeyPointsList>
            {keyPoints.map((point, index) => (
              <KeyPoint key={index}>{point}</KeyPoint>
            ))}
          </KeyPointsList>
        </>
      )}
      
      {sources.length > 0 && (
        <>
          <SectionTitle>Sources</SectionTitle>
          <SourcesList>
            {sources.map((source, index) => (
              <SourceCard 
                key={index} 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                $relevance={source.relevance}
              >
                <SourceInfo>
                  <SourceTitle>{source.title}</SourceTitle>
                  <SourceUrl>{new URL(source.url).hostname}</SourceUrl>
                </SourceInfo>
                <RelevanceBadge $level={source.relevance}>
                  {source.relevance}
                </RelevanceBadge>
              </SourceCard>
            ))}
          </SourcesList>
        </>
      )}
      
      <ConfidenceBanner $level={confidence}>
        {getConfidenceIcon(confidence)} Confidence: {confidence}
      </ConfidenceBanner>
      
      {showRawData && rawData && (
        <>
          <ToggleButton onClick={() => setShowRaw(!showRaw)}>
            {showRaw ? 'Hide' : 'Show'} Raw Data
          </ToggleButton>
          {showRaw && <RawDataSection>{rawData}</RawDataSection>}
        </>
      )}
    </Card>
  );
};
```

#### 4.2 Create MessageRenderer Component

**File:** `webviewUi/src/components/MessageRenderer.tsx`

```tsx
import React from 'react';
import { BotMessage } from './botMessage';
import { SearchResultCard } from './SearchResultCard';
import { AgentActivityFeed } from './AgentActivityFeed';

interface StructuredContent {
  type: 'synthesized_search' | 'code_analysis' | 'plain_text';
  synthesized?: any;
  rawResults?: any[];
  content?: string;
}

interface MessageRendererProps {
  content: string;
  activities?: any[];
  isStreaming?: boolean;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  activities = [],
  isStreaming = false,
}) => {
  // Try to parse structured content
  let structuredContent: StructuredContent | null = null;
  
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === 'synthesized_search' || parsed.type === 'code_analysis') {
      structuredContent = parsed;
    }
  } catch {
    // Content is plain text
  }

  // Show activity feed while streaming
  if (isStreaming && activities.length > 0) {
    return <AgentActivityFeed activities={activities} isActive={true} />;
  }

  // Render structured content
  if (structuredContent?.type === 'synthesized_search') {
    return (
      <>
        {activities.length > 0 && (
          <AgentActivityFeed activities={activities} isActive={false} />
        )}
        <SearchResultCard
          summary={structuredContent.synthesized.summary}
          keyPoints={structuredContent.synthesized.keyPoints}
          sources={structuredContent.synthesized.sources}
          confidence={structuredContent.synthesized.confidence}
          showRawData={true}
          rawData={JSON.stringify(structuredContent.rawResults, null, 2)}
        />
      </>
    );
  }

  // Default: render as markdown
  return <BotMessage content={content} isStreaming={isStreaming} />;
};
```

---

### Phase 5: Integration & Polish (Week 5-6)

#### 5.1 Update WebView to Use New Components

**File:** `webviewUi/src/components/webview.tsx`

```tsx
// Replace memoizedMessages rendering with:
const memoizedMessages = useMemo(() => {
  return streamedMessages.map((msg) =>
    msg.type === "bot" ? (
      <MessageRenderer
        key={msg.id}
        content={msg.content}
        activities={activities.filter(a => a.messageId === msg.id)}
        isStreaming={msg.isStreaming}
      />
    ) : (
      <UserMessage
        key={msg.id}
        message={msg.content}
        alias={msg.alias}
      />
    )
  );
}, [streamedMessages, activities]);
```

#### 5.2 Add CSS Styles

**File:** `webviewUi/src/themes/agent-activity.css`

```css
/* Agent Activity Feed Animations */
@keyframes activity-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes activity-slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.activity-item-enter {
  animation: activity-slide-in 0.3s ease-out forwards;
}

/* Search Result Card Hover Effects */
.search-source-card {
  transition: all 0.2s ease;
}

.search-source-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

/* Confidence Indicators */
.confidence-high { color: #22c55e; }
.confidence-medium { color: #f59e0b; }
.confidence-low { color: #ef4444; }
```

---

## Implementation Priority Matrix

| Phase | Priority | Impact | Effort | Status |
|-------|----------|--------|--------|--------|
| Phase 1: Activity Events | HIGH | HIGH | Medium | ✅ COMPLETE |
| Phase 2: Activity Feed UI | HIGH | HIGH | Medium | ✅ COMPLETE |
| Phase 3: Result Synthesis | MEDIUM | HIGH | High | ✅ COMPLETE |
| Phase 4: UI Components | MEDIUM | HIGH | Medium | ✅ COMPLETE |
| Phase 5: Integration | HIGH | HIGH | Low | ✅ COMPLETE |

---

## Success Metrics

1. **User Feedback Time**: Reduce time to first feedback from 10+ seconds to <1 second
2. **UI Clarity**: User should understand what agent is doing at all times
3. **Result Quality**: Synthesized summaries should be more actionable than raw data
4. **Professional Appearance**: UI matches modern agentic interfaces (Claude, ChatGPT)

---

## Quick Wins (Can Implement Today)

1. **Add tool start/end events** in `codebuddy-agent.service.ts`
2. **Create simple ActivityFeed** component with hardcoded descriptions
3. **Update SkeletonLoader** to show "Searching the web..." instead of generic "Processing"
4. **Add progress messages** to the existing streaming flow

---

## Files to Modify

### Backend (Extension)
- `src/agents/interface/agent.interface.ts` - Add new event types
- `src/agents/services/codebuddy-agent.service.ts` - Emit tool events
- `src/emitter/publisher.ts` - Add new event handlers
- `src/webview-providers/manager.ts` - Forward events to webview
- `src/services/context-retriever.ts` - Add synthesis calls
- NEW: `src/services/result-synthesizer.service.ts`

### Frontend (WebView)
- `webviewUi/src/hooks/useStreamingChat.ts` - Handle new events
- NEW: `webviewUi/src/components/AgentActivityFeed.tsx`
- NEW: `webviewUi/src/components/SearchResultCard.tsx`
- NEW: `webviewUi/src/components/MessageRenderer.tsx`
- `webviewUi/src/components/webview.tsx` - Use new components

---

## Conclusion

This roadmap provides a structured approach to achieving Claude-like agent feedback. The implementation is broken into phases that can be delivered incrementally, with each phase providing immediate value. The quick wins section highlights changes that can be made immediately to improve user experience.

The key insight is that users need **continuous feedback** about what the agent is doing, not just the final result. By implementing real-time activity feeds, result synthesis, and professional UI components, CodeBuddy will provide a vastly improved user experience that matches modern expectations for AI assistant interfaces.
