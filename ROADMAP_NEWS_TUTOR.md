# CodeBuddy Tutor & News Curator Roadmap

## Vision
Transform CodeBuddy from a reactive coding assistant into a proactive **Technical Tutor**. CodeBuddy will curate industry news, track your learning progress, and facilitate deep deliberation on technical topics, fostering a long-term mentorship relationship.

## Core Concepts

1.  **News Curation Engine**: Moves beyond "latest headlines" to "relevant updates". It understands your tech stack and interests.
2.  **Knowledge Graph**: Tracks your exposure to topics (e.g., "User has read 3 articles on React Server Components").
3.  **Deliberation Loop**: Encourages active learning through discussion, not just passive reading.

## Architecture

```mermaid
graph TD
    A[RSS/News Sources] -->|Raw Items| B(NewsService)
    B -->|Content| C{NewsAnalyzer (LLM)}
    C -->|Topics & Summary| D[News DB]
    
    E[User Workspace] -->|Tech Stack| F[User Profile/Context]
    D -->|Ranked Items| G[Relevance Engine]
    F --> G
    
    G -->|Curated Feed| H[Webview UI]
    H -->|Read/Discuss| I[Interaction Handler]
    
    I -->|Update| J[Knowledge Graph]
    I -->|Start Chat| K[Deliberation Session]
    J -->|Refine| G
```

## Roadmap

### Phase 1: Context-Aware Curation (The "Assistant")
*Goal: Filter noise and identify what matters.*

*   **Feature 1: Smart Tagging**: Use LLM to analyze fetched news items, extracting `topics` (e.g., "Rust", "Security", "AI") and generating a `tl;dr`.
*   **Feature 2: Stack Matching**: Scrape the user's `package.json`, `go.mod`, etc., to prioritize news matching the current project's dependencies.
*   **Feature 3: "Discuss" Action**: Add a button to news items to immediately start a chat session with the article context loaded.
*   **Tech**: `NewsAnalysisService`, `TopicTagging`, `RelevanceScorer`.

### Phase 2: Progress & Knowledge Tracking (The "Tutor")
*Goal: Track what I know and what I'm learning.*

*   **Feature 1: User Knowledge Database**: A new SQLite table tracking `(topic, proficiency_score, last_interaction)`.
*   **Feature 2: Reading History & Insights**: "You've read a lot about System Design this week."
*   **Feature 3: Active Deliberation**: After reading, CodeBuddy asks a checking question: "How do you think this update affects your current project?"
*   **Tech**: `KnowledgeGraphService`, `UserProfileService`.

### Phase 3: Long-Term Mentorship (The "Partner")
*Goal: Proactive growth planning.*

*   **Feature 1: Curriculum Generation**: "You seem interested in Go. Here is a roadmap of articles and tasks to master it."
*   **Feature 2: Spaced Repetition**: Resurface key concepts from articles read 2 weeks ago.
*   **Feature 3: Project Integration**: "This new library update you read about? We can apply it to `src/services/auth.ts` now."

## Implementation Plan (Phase 1 Focus)

### 1. Database Schema Updates
Add `topics`, `relevance_score`, and `embedding` columns to `news_items`.

```sql
ALTER TABLE news_items ADD COLUMN topics TEXT; -- JSON array
ALTER TABLE news_items ADD COLUMN relevance_score REAL;
ALTER TABLE news_items ADD COLUMN analysis_status TEXT DEFAULT 'pending';
```

### 2. NewsAnalysisService
A background service that picks up `pending` news items and uses the LLM to:
1.  Summarize content.
2.  Extract technical tags.
3.  Assess complexity.

### 3. Relevance Engine
A logic layer that ranks news based on:
*   **Explicit Interests**: User defined tags.
*   **Implicit Context**: Detected frameworks in the workspace.
*   **Recency**: Newer is better, but "seminal" is also good.

### 4. UI Enhancements
*   **"Discuss" Button**: Launches chat with system prompt: *"User wants to discuss this article: [Title]..."*
*   **Topic Pills**: Visual indicators of content (e.g., [React] [Performance]).

## Next Steps
1.  **Approve Phase 1**: Shall we start by upgrading the database and building the `NewsAnalyzer`?
