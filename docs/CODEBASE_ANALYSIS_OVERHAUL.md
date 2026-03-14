# Codebase Analysis Feature Overhaul

**Created**: March 15, 2026  
**Status**: In Progress  
**Feature**: `CodeBuddy.codebaseAnalysis` command  

---

## Executive Summary

The "Analyze Codebase & Answer Questions" feature currently produces shallow, unreliable analysis due to:
1. Regex-based code extraction (misses complex patterns)
2. No actual code in LLM context (only file paths/names)
3. Aggressive context limits (20 deps, 15 endpoints, 10 models)
4. Unused Tree-sitter infrastructure

This document outlines a phased overhaul to transform this into a competitive, accurate analysis feature.

---

## Current Architecture

```
User Question
    ↓
PersistentCodebaseUnderstandingService
    ↓
CodebaseAnalysisWorker (Worker Thread)
    ├── AnalyzerFactory → TypeScriptAnalyzer (regex)
    ├── extractApiEndpoints() (regex)
    └── extractDataModels() (regex)
    ↓
createContextFromAnalysis() → Markdown (NO CODE)
    ↓
LLM Provider → Response
    ↓
New Markdown Document
```

### Problems Identified

| Component | Issue | Impact |
|-----------|-------|--------|
| `TypeScriptAnalyzer` | Regex-based class/function extraction | Misses decorated exports, arrow functions, complex patterns |
| `extractApiEndpoints()` | Only 3 regex patterns | Misses NestJS decorators, Fastify, Hono, tRPC |
| `createContextFromAnalysis()` | No code snippets | LLM has no actual code to reason about |
| Context limits | 20/15/10/30 hard limits | Loses critical information in large codebases |
| `tree-sitter.parser.ts` | Exists but unused | Accurate AST parsing available but not integrated |

---

## Target Architecture

```
User Question
    ↓
STAGE 1: Question Analysis (NEW)
    ├── Classify question type (HOW/BUILD/UNDERSTAND)
    └── Extract key entities/concepts
    ↓
PersistentCodebaseUnderstandingService
    ↓
CodebaseAnalysisWorker (Worker Thread)
    ├── TreeSitterAnalyzer (NEW) → Accurate AST
    ├── ArchitecturalPatternDetector (NEW)
    ├── CallGraphBuilder (NEW)
    └── CodeSummarizer (NEW)
    ↓
STAGE 2: Relevance Filtering (NEW)
    ├── Score files by question relevance
    └── Select top files within token budget
    ↓
createRichContextFromAnalysis() (NEW)
    ├── Architecture overview
    ├── Key component summaries
    ├── Relevant code snippets (actual code!)
    └── Dependency/call relationships
    ↓
LLM Provider → Response
    ↓
New Markdown Document
```

---

## Implementation Phases

### Phase 1: Immediate Fixes (3-4 days) ⬅️ CURRENT

**Goal**: Get code snippets into context and remove arbitrary limits.

#### 1.1 Integrate Tree-sitter for Extraction

**Files to modify**:
- `src/workers/codebase-analysis.worker.ts`
- `src/services/analyzers/analyzer-factory.ts`
- `src/ast/language-config.ts` (add PHP)

**Supported Languages** (from `src/grammars/`):
| Language | Grammar File | In Config? | Has Analyzer? |
|----------|--------------|------------|---------------|
| JavaScript | tree-sitter-javascript.wasm | ✅ | ✅ (regex) |
| TypeScript/TSX | tree-sitter-tsx.wasm | ✅ | ✅ (regex) |
| Python | tree-sitter-python.wasm | ✅ | ✅ (regex) |
| Java | tree-sitter-java.wasm | ✅ | ❌ |
| Go | tree-sitter-go.wasm | ✅ | ❌ |
| Rust | tree-sitter-rust.wasm | ✅ | ❌ |
| PHP | tree-sitter-php.wasm | ❌ | ❌ |

**Tasks**:
- [ ] Add PHP to `languageConfigs` in `src/ast/language-config.ts`
- [ ] Create `TreeSitterAnalyzerService` that wraps existing `tree-sitter.parser.ts`
- [ ] Replace regex-based extraction in worker with Tree-sitter queries for ALL 7 languages
- [ ] Add Tree-sitter queries for:
  - Classes with decorators (TS/JS/Java/PHP)
  - Exported functions (arrow and regular)
  - React components (functional and class) — JS/TS only
  - Structs and impls (Go/Rust)
  - API endpoint decorators (Express, NestJS, Fastify, Spring, Gin, Actix)
  - Type definitions and interfaces
- [ ] Create language-specific API endpoint patterns:
  - **JS/TS**: Express (`app.get`), NestJS (`@Get`), Fastify, Hono
  - **Python**: FastAPI (`@app.get`), Flask, Django URLs
  - **Java**: Spring (`@GetMapping`), JAX-RS (`@GET`)
  - **Go**: Gin (`r.GET`), Chi, Echo, net/http
  - **Rust**: Actix (`#[get]`), Axum, Rocket
  - **PHP**: Laravel routes, Symfony controllers

**Expected outcome**: 90%+ accuracy on code element extraction for ALL 7 languages (vs ~60% with regex for 3 languages)

#### 1.2 Include Code Snippets in Context

**Files to modify**:
- `src/commands/architectural-recommendation.ts` (function `createContextFromAnalysis`)
- `src/workers/codebase-analysis.worker.ts` (return code excerpts)

**Tasks**:
- [ ] Store truncated code snippets (first 50 lines) for key files
- [ ] Add `codeSnippets` field to `AnalysisResult`
- [ ] Modify `createContextFromAnalysis()` to include code blocks
- [ ] Prioritize: entry points, API handlers, service classes, models

**Context format change**:
```markdown
## Key Files

### src/controllers/UserController.ts
**Type**: Express Controller  
**Endpoints**: GET /users, POST /users  
```typescript
export class UserController {
  constructor(private userService: UserService) {}
  
  async getUsers(req: Request, res: Response) {
    const users = await this.userService.findAll();
    return res.json(users);
  }
  ...
}
```

#### 1.3 Token-Budget Based Limits

**Files to modify**:
- `src/commands/architectural-recommendation.ts`

**Tasks**:
- [ ] Replace hardcoded limits (20/15/10/30) with token budget
- [ ] Add `TokenBudgetAllocator` utility:
  ```typescript
  const budget = new TokenBudgetAllocator(32000); // ~8K tokens
  budget.allocate('overview', 2000);
  budget.allocate('endpoints', 6000);
  budget.allocate('models', 6000);
  budget.allocate('codeSnippets', 15000);
  budget.allocate('fileList', 3000);
  ```
- [ ] Prioritize items by relevance score within each category

---

### Phase 2: Rich Analysis (1 week)

**Goal**: Add architectural pattern detection and code summaries.

#### 2.1 Architectural Pattern Detection

**New file**: `src/services/analyzers/architecture-detector.ts`

**Patterns to detect**:
- Layered architecture (Controller → Service → Repository)
- Module/feature-based organization
- MVC/MVVM patterns
- Microservices indicators
- Monorepo structure

**Detection heuristics**:
```typescript
interface ArchitecturalPattern {
  name: string;
  confidence: number;
  indicators: string[];
  layers?: Layer[];
}

// Example detection
if (hasDirectory('controllers') && hasDirectory('services') && hasDirectory('repositories')) {
  patterns.push({ name: 'Layered', confidence: 0.9, layers: [...] });
}
```

#### 2.2 Call Graph Builder

**New file**: `src/services/analyzers/call-graph.ts`

**Features**:
- Track function → function calls
- Track class → service dependencies
- Identify entry points (exports, API handlers)
- Detect circular dependencies

**Output format**:
```typescript
interface CallGraph {
  nodes: Map<string, CallGraphNode>;
  edges: CallGraphEdge[];
  entryPoints: string[];
  hotPaths: string[][]; // Most common call chains
}
```

#### 2.3 Code Summarizer (LLM-assisted)

**New file**: `src/services/analyzers/code-summarizer.ts`

**Features**:
- Generate 1-2 sentence summary for each key file
- Batch summaries to reduce LLM calls
- Cache summaries with content hash

**Prompt template**:
```
Summarize this code file in 1-2 sentences. Focus on:
- What it does (purpose)
- Key exports
- Dependencies it uses

File: {filename}
```typescript
{code}
```

Summary:
```

#### 2.4 Auth/Middleware Flow Detection

**New file**: `src/services/analyzers/middleware-detector.ts`

**Detect**:
- Express middleware chains
- Auth guards (NestJS, custom)
- Request lifecycle hooks
- Error handlers

---

### Phase 3: Multi-pass Analysis (1 week)

**Goal**: Two-stage LLM calls for focused, accurate answers.

#### 3.1 Question Analysis Stage

**New flow**:
```
User Question
    ↓
Stage 1 LLM Call: "What files/concepts are relevant to this question?"
    ↓
Filter analysis to relevant subset
    ↓
Stage 2 LLM Call: "Answer the question using this focused context"
```

**Stage 1 Prompt**:
```
Given this codebase structure:
{file_list_with_types}

And this question: "{user_question}"

List the 5-10 most relevant files and concepts to answer this question.
Return as JSON: { "files": [...], "concepts": [...] }
```

#### 3.2 Relevance Scoring

**New file**: `src/services/analyzers/question-relevance.ts`

**Scoring factors**:
- Keyword overlap with question
- File type relevance (API question → controller files)
- Import/dependency proximity
- Recency of changes

#### 3.3 Focused Context Generation

Build context from Stage 1 results:
- Full code for top 3 files
- Summaries for next 7 files
- Relationship diagram
- Relevant dependencies only

---

## File Changes Summary

### New Files

| File | Purpose | Phase |
|------|---------|-------|
| `src/services/analyzers/tree-sitter-analyzer.ts` | Tree-sitter based code extraction | 1 |
| `src/services/analyzers/token-budget.ts` | Context budget allocation | 1 |
| `src/services/analyzers/architecture-detector.ts` | Pattern detection | 2 |
| `src/services/analyzers/call-graph.ts` | Function relationship tracking | 2 |
| `src/services/analyzers/code-summarizer.ts` | LLM-based file summaries | 2 |
| `src/services/analyzers/middleware-detector.ts` | Auth/middleware flow detection | 2 |
| `src/services/analyzers/question-relevance.ts` | Question-based file scoring | 3 |

### Modified Files

| File | Changes | Phase |
|------|---------|-------|
| `src/workers/codebase-analysis.worker.ts` | Use Tree-sitter, return code snippets | 1 |
| `src/services/analyzers/analyzer-factory.ts` | Add Tree-sitter analyzer | 1 |
| `src/commands/architectural-recommendation.ts` | Rich context, token budget, two-stage | 1, 3 |
| `src/services/persistent-codebase-understanding.service.ts` | Store code snippets, summaries | 1, 2 |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Endpoint detection accuracy | ~60% | 95%+ |
| Class/interface detection | ~70% | 98%+ |
| LLM context usefulness | Low (no code) | High (with code) |
| User satisfaction | Poor | Good |
| Analysis time | ~30s | ~45s (acceptable for quality) |

---

## Testing Strategy

### Unit Tests
- Tree-sitter queries against known code patterns
- Token budget allocation edge cases
- Architecture pattern detection on test fixtures

### Integration Tests
- Full analysis pipeline on sample projects
- Compare output against expected elements

### Manual Validation
- Test on 5 diverse codebases:
  1. Express REST API
  2. NestJS monorepo
  3. Next.js full-stack
  4. Python FastAPI
  5. Mixed language project

---

## Rollout Plan

1. **Phase 1 Complete**: Ship as experimental flag (`codebuddy.analysis.experimental`)
2. **Phase 2 Complete**: Enable by default, keep flag for opt-out
3. **Phase 3 Complete**: Remove flag, deprecate old implementation

---

## Dependencies

- `tree-sitter` (WASM) — already in project
- No new npm dependencies required for Phase 1
- Phase 2 may need `tiktoken` for accurate token counting

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Tree-sitter WASM loading in worker | Test worker thread compatibility, fallback to regex |
| Token budget miscalculation | Add 10% safety margin, truncate gracefully |
| Two-stage LLM doubles latency | Cache Stage 1 results by question hash |
| Large codebases timeout | Add file count limits with smart sampling |

---

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1 | 3-4 days | March 15 | March 19 |
| Phase 2 | 5-7 days | March 20 | March 27 |
| Phase 3 | 5-7 days | March 28 | April 4 |

**Total**: ~3 weeks for full overhaul

---

## References

- Current implementation: `src/commands/architectural-recommendation.ts`
- Tree-sitter parser: `src/ast/parser/tree-sitter.parser.ts`
- Worker: `src/workers/codebase-analysis.worker.ts`
- Analyzers: `src/services/analyzers/`
