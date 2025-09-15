# Code Review Specialist Agent

## Overview

The Code Review Specialist Agent is an expert in code quality analysis, security assessment, and best practices enforcement. It combines static analysis, dynamic testing, and intelligent pattern recognition to provide comprehensive code reviews that enhance software quality and security.

## Core Capabilities

### Code Quality Analysis

- **Static Code Analysis**: Comprehensive analysis of code structure, complexity, and patterns
- **Code Style Enforcement**: Ensure adherence to coding standards and style guides
- **Architecture Review**: Analyze architectural patterns and design decisions
- **Technical Debt Assessment**: Identify and quantify technical debt

### Security Assessment

- **Vulnerability Detection**: Identify security vulnerabilities and potential exploits
- **Dependency Analysis**: Analyze third-party dependencies for known vulnerabilities
- **Security Pattern Recognition**: Recognize insecure coding patterns
- **Compliance Validation**: Ensure compliance with security standards (OWASP, etc.)

### Performance Analysis

- **Performance Bottleneck Detection**: Identify potential performance issues
- **Resource Usage Analysis**: Analyze memory, CPU, and I/O usage patterns
- **Scalability Assessment**: Evaluate code scalability characteristics
- **Optimization Recommendations**: Suggest performance optimizations

### Best Practices Enforcement

- **Design Pattern Recognition**: Identify and validate design pattern usage
- **SOLID Principles**: Enforce SOLID principles and clean code practices
- **Documentation Standards**: Ensure adequate code documentation
- **Testing Coverage**: Analyze test coverage and quality

## MCP Tool Integration

### Static Analysis Tools

```json
{
  "linters": {
    "eslint": {
      "description": "JavaScript/TypeScript linter",
      "capabilities": ["syntax-checking", "style-enforcement", "error-detection"],
      "languages": ["javascript", "typescript"],
      "configuration": "eslint.config.js"
    },
    "pylint": {
      "description": "Python code analysis tool",
      "capabilities": ["code-quality", "error-detection", "refactoring-suggestions"],
      "languages": ["python"],
      "configuration": "pylintrc"
    },
    "sonarqube": {
      "description": "Multi-language code quality platform",
      "capabilities": ["quality-gates", "security-hotspots", "technical-debt"],
      "languages": ["java", "c#", "javascript", "python", "go"],
      "configuration": "sonar-project.properties"
    }
  }
}
```

### Security Analysis Tools

```json
{
  "security-scanners": {
    "semgrep": {
      "description": "Static analysis for security vulnerabilities",
      "capabilities": ["vulnerability-detection", "custom-rules", "compliance-checking"],
      "rule-sets": ["owasp-top-10", "cwe", "custom"],
      "languages": ["python", "javascript", "java", "go", "c"]
    },
    "snyk": {
      "description": "Dependency vulnerability scanner",
      "capabilities": ["dependency-scanning", "license-compliance", "container-scanning"],
      "integrations": ["npm", "pip", "maven", "gradle"],
      "databases": ["nvd", "snyk-db"]
    },
    "bandit": {
      "description": "Python security linter",
      "capabilities": ["security-issue-detection", "confidence-scoring", "custom-tests"],
      "languages": ["python"],
      "configuration": "bandit.yaml"
    }
  }
}
```

### Performance Analysis Tools

```json
{
  "performance-analyzers": {
    "lighthouse": {
      "description": "Web performance auditing",
      "capabilities": ["performance-metrics", "accessibility-audit", "seo-analysis"],
      "platforms": ["web"],
      "output": "performance-reports"
    },
    "profilers": {
      "py-spy": {
        "description": "Python performance profiler",
        "capabilities": ["cpu-profiling", "memory-profiling", "flame-graphs"],
        "languages": ["python"]
      },
      "clinic.js": {
        "description": "Node.js performance profiler",
        "capabilities": ["cpu-profiling", "memory-leaks", "event-loop-delay"],
        "languages": ["javascript", "typescript"]
      }
    }
  }
}
```

### Code Metrics Tools

```json
{
  "metrics-tools": {
    "complexity-analyzers": {
      "description": "Code complexity measurement",
      "capabilities": ["cyclomatic-complexity", "cognitive-complexity", "maintainability-index"],
      "languages": ["javascript", "python", "java", "c#"],
      "thresholds": "configurable"
    },
    "coverage-tools": {
      "jest": {
        "description": "JavaScript test coverage",
        "capabilities": ["line-coverage", "branch-coverage", "function-coverage"],
        "languages": ["javascript", "typescript"]
      },
      "pytest-cov": {
        "description": "Python test coverage",
        "capabilities": ["statement-coverage", "branch-coverage", "missing-lines"],
        "languages": ["python"]
      }
    }
  }
}
```

## Agent Behaviors

### Intelligent Code Analysis

- **Context-Aware Analysis**: Consider code context and project-specific patterns
- **Progressive Analysis**: Focus on changed code with understanding of broader impact
- **Pattern Learning**: Learn from historical reviews to improve analysis accuracy
- **Risk Assessment**: Prioritize issues based on severity and impact

### Automated Review Generation

- **Comprehensive Reports**: Generate detailed review reports with actionable feedback
- **Severity Classification**: Classify issues by severity (critical, high, medium, low)
- **Fix Suggestions**: Provide specific code fix suggestions and alternatives
- **Educational Comments**: Include explanations to help developers learn

### Continuous Monitoring

- **Code Quality Trends**: Track code quality metrics over time
- **Regression Detection**: Detect quality regressions in new commits
- **Team Performance**: Monitor team code quality performance
- **Technical Debt Tracking**: Track technical debt accumulation and reduction

## A2A Communication Interfaces

### Outbound Communications

```typescript
interface CodeReviewAgentEvents {
  // Review completion events
  reviewCompleted: ReviewCompletionInfo;
  securityIssueDetected: SecurityAlert;
  performanceIssueDetected: PerformanceAlert;
  qualityRegressionDetected: QualityAlert;

  // Analysis results
  codeQualityReport: QualityReport;
  securityAnalysisComplete: SecurityReport;
  performanceAnalysisComplete: PerformanceReport;
  technicalDebtAssessment: TechnicalDebtReport;

  // Recommendations
  refactoringRecommendation: RefactoringRecommendation;
  architectureRecommendation: ArchitectureRecommendation;
  testingRecommendation: TestingRecommendation;
}
```

### Inbound Message Handlers

```typescript
interface CodeReviewAgentHandlers {
  // Review requests
  reviewCode: (request: CodeReviewRequest) => Promise<ReviewResults>;
  analyzeSecurityRisks: (request: SecurityAnalysisRequest) => Promise<SecurityResults>;
  assessPerformance: (request: PerformanceAssessmentRequest) => Promise<PerformanceResults>;
  evaluateArchitecture: (request: ArchitectureEvaluationRequest) => Promise<ArchitectureResults>;

  // Git agent integration
  reviewPullRequest: (request: PullRequestReview) => Promise<ReviewReport>;
  analyzeCommitDiff: (request: CommitDiffAnalysis) => Promise<DiffAnalysisResults>;
  validateBranchQuality: (request: BranchQualityCheck) => Promise<QualityValidation>;

  // Database agent integration
  reviewDatabaseQueries: (request: QueryReviewRequest) => Promise<QueryReviewResults>;
  analyzeDatabaseSchema: (request: SchemaAnalysisRequest) => Promise<SchemaAnalysisResults>;
  validateDataAccess: (request: DataAccessValidation) => Promise<AccessValidationResults>;
}
```

## Decision-Making Logic

### Review Prioritization

```typescript
class ReviewPrioritizer {
  prioritizeReviewItems(issues: ReviewIssue[]): PrioritizedReviewItems {
    // Consider severity, impact, and fix effort
    // Factor in project deadlines and team capacity
    // Return prioritized list with reasoning
  }

  calculateRiskScore(issue: ReviewIssue): RiskScore {
    // Assess security, performance, and maintainability risks
    // Consider historical patterns and project context
    // Return comprehensive risk assessment
  }
}
```

### Quality Gate Management

```typescript
class QualityGateManager {
  evaluateQualityGates(codebase: Codebase): QualityGateResults {
    // Check against established quality thresholds
    // Evaluate test coverage, complexity, security
    // Return pass/fail status with detailed feedback
  }

  adaptQualityStandards(project: Project, history: QualityHistory): QualityStandards {
    // Adapt standards based on project maturity
    // Consider team skill level and project criticality
    // Return customized quality standards
  }
}
```

### Learning and Improvement

```typescript
class ReviewLearningEngine {
  learnFromFeedback(review: Review, feedback: DeveloperFeedback): LearningUpdate {
    // Incorporate developer feedback into analysis models
    // Adjust severity assessments and recommendations
    // Improve future review accuracy
  }

  identifyPatterns(reviews: Review[]): PatternInsights {
    // Identify common issues and improvement opportunities
    // Recognize team-specific patterns and preferences
    // Generate insights for process improvement
  }
}
```

## Integration Patterns

### With Git Agent

- **Commit Analysis**: Analyze individual commits for quality and security
- **Pull Request Integration**: Automatically review pull requests before merge
- **Branch Quality Validation**: Ensure branch quality before deployment
- **Historical Analysis**: Analyze code quality trends over repository history

### With Database Agent

- **Query Review**: Review SQL queries for performance and security
- **Schema Validation**: Validate database schema changes for best practices
- **Data Access Pattern Analysis**: Analyze application data access patterns
- **Migration Safety**: Review database migrations for safety and efficiency

## Review Workflow Engine

### Automated Review Workflow

```typescript
class ReviewWorkflow {
  async executeReview(codeChanges: CodeChanges): Promise<ReviewResults> {
    // 1. Initial triage and impact assessment
    const impact = await this.assessImpact(codeChanges);

    // 2. Run appropriate analysis tools
    const analysisResults = await this.runAnalysis(codeChanges, impact);

    // 3. Generate comprehensive review
    const review = await this.generateReview(analysisResults);

    // 4. Apply quality gates
    const gateResults = await this.applyQualityGates(review);

    // 5. Generate final recommendations
    return await this.generateRecommendations(review, gateResults);
  }
}
```

### Custom Rule Engine

```typescript
class CustomRuleEngine {
  evaluateCustomRules(code: Code, rules: CustomRule[]): RuleEvaluationResults {
    // Apply project-specific and team-specific rules
    // Support both AST-based and regex-based rules
    // Return detailed rule evaluation results
  }

  generateCustomRules(patterns: CodePattern[]): CustomRule[] {
    // Generate rules based on identified anti-patterns
    // Create rules for project-specific conventions
    // Return executable custom rules
  }
}
```

## Configuration Schema

```json
{
  "code-review-agent": {
    "analysis": {
      "enabled-languages": ["javascript", "typescript", "python", "java"],
      "quality-gates": {
        "min-test-coverage": 80,
        "max-complexity": 10,
        "max-technical-debt": "moderate"
      },
      "security": {
        "vulnerability-scanning": true,
        "dependency-checking": true,
        "security-rules": ["owasp-top-10", "cwe-top-25"]
      }
    },
    "tools": {
      "linters": {
        "eslint": {
          "config": "eslint.config.js",
          "enabled": true
        },
        "sonarqube": {
          "server-url": "https://sonar.example.com",
          "project-key": "project-key",
          "enabled": true
        }
      },
      "security-scanners": {
        "semgrep": {
          "rules": ["auto", "security", "performance"],
          "enabled": true
        },
        "snyk": {
          "token": "env:SNYK_TOKEN",
          "enabled": true
        }
      }
    },
    "reporting": {
      "format": ["json", "markdown", "html"],
      "include-fixes": true,
      "severity-threshold": "medium",
      "detailed-explanations": true
    },
    "learning": {
      "feedback-incorporation": true,
      "pattern-recognition": true,
      "adaptive-thresholds": true
    }
  }
}
```

## Performance Metrics

### Review Quality Metrics

- **Review Accuracy**: Percentage of correctly identified issues
- **False Positive Rate**: Rate of incorrectly flagged issues
- **Issue Detection Rate**: Percentage of actual issues found
- **Developer Satisfaction**: Developer feedback on review quality

### Operational Metrics

- **Review Speed**: Average time to complete code reviews
- **Coverage**: Percentage of code changes reviewed
- **Tool Performance**: Performance of individual analysis tools
- **Resource Utilization**: CPU and memory usage during analysis

### Impact Metrics

- **Bug Reduction**: Reduction in production bugs after implementation
- **Security Improvement**: Reduction in security vulnerabilities
- **Code Quality Trends**: Measurable improvement in code quality metrics
- **Developer Learning**: Evidence of improved coding practices
