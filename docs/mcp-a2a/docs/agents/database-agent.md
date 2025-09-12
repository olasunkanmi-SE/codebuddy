# Database Specialist Agent

## Overview

The Database Specialist Agent is a master of all database-related operations, from schema design and optimization to query performance tuning and data analysis. It serves as the central intelligence for all database interactions within the multi-agent system.

## Core Capabilities

### Database Management

- **Schema Design**: Create, modify, and optimize database schemas
- **Migration Management**: Handle database migrations and versioning
- **Index Optimization**: Analyze and optimize database indexes
- **Backup & Recovery**: Manage backup strategies and disaster recovery

### Query Operations

- **Query Optimization**: Analyze and optimize SQL queries for performance
- **Query Generation**: Generate efficient queries based on requirements
- **Execution Planning**: Analyze and optimize query execution plans
- **Performance Monitoring**: Monitor query performance and bottlenecks

### Data Analysis

- **Data Profiling**: Analyze data quality, patterns, and anomalies
- **Statistical Analysis**: Perform statistical analysis on datasets
- **Data Validation**: Validate data integrity and consistency
- **Trend Analysis**: Identify trends and patterns in data

### Multi-Database Support

- **Relational Databases**: PostgreSQL, MySQL, SQL Server, Oracle
- **NoSQL Databases**: MongoDB, Redis, Cassandra, DynamoDB
- **Time-Series Databases**: InfluxDB, TimescaleDB
- **Graph Databases**: Neo4j, Amazon Neptune

## MCP Tool Integration

### Core Database Tools

```json
{
  "sql-clients": {
    "postgresql": {
      "description": "PostgreSQL client with advanced features",
      "capabilities": ["query-execution", "schema-management", "performance-analysis"],
      "authentication": "connection-string"
    },
    "mysql": {
      "description": "MySQL client with optimization tools",
      "capabilities": ["query-execution", "index-analysis", "replication-monitoring"],
      "authentication": "connection-string"
    },
    "mongodb": {
      "description": "MongoDB client with aggregation pipeline",
      "capabilities": ["document-queries", "aggregation", "index-management"],
      "authentication": "connection-string"
    }
  }
}
```

### Schema Management Tools

```json
{
  "migration-tools": {
    "flyway": {
      "description": "Database migration tool",
      "capabilities": ["migration-execution", "version-control", "rollback"],
      "configuration": "migration-scripts"
    },
    "liquibase": {
      "description": "Database change management",
      "capabilities": ["changeset-management", "database-diff", "rollback"],
      "configuration": "changelog-files"
    },
    "prisma": {
      "description": "Modern database toolkit",
      "capabilities": ["schema-definition", "migration-generation", "type-safety"],
      "configuration": "schema-file"
    }
  }
}
```

### Performance Analysis Tools

```json
{
  "performance-tools": {
    "explain-analyzer": {
      "description": "Query execution plan analyzer",
      "capabilities": ["plan-analysis", "bottleneck-detection", "optimization-suggestions"],
      "databases": ["postgresql", "mysql", "sql-server"]
    },
    "index-advisor": {
      "description": "Intelligent index recommendation",
      "capabilities": ["missing-index-detection", "unused-index-identification", "composite-index-suggestions"],
      "algorithms": ["workload-analysis", "cost-based-optimization"]
    },
    "query-profiler": {
      "description": "Real-time query performance monitoring",
      "capabilities": ["execution-time-tracking", "resource-usage-monitoring", "slow-query-detection"],
      "metrics": ["cpu-usage", "memory-usage", "io-operations"]
    }
  }
}
```

### Data Analysis Tools

```json
{
  "analysis-tools": {
    "data-profiler": {
      "description": "Comprehensive data profiling",
      "capabilities": ["data-quality-assessment", "pattern-detection", "anomaly-identification"],
      "output": "profiling-reports"
    },
    "statistical-engine": {
      "description": "Statistical analysis engine",
      "capabilities": ["descriptive-statistics", "correlation-analysis", "regression-analysis"],
      "libraries": ["scipy", "pandas", "statsmodels"]
    },
    "etl-processor": {
      "description": "Extract, Transform, Load operations",
      "capabilities": ["data-extraction", "data-transformation", "data-loading"],
      "formats": ["csv", "json", "xml", "parquet"]
    }
  }
}
```

## Agent Behaviors

### Proactive Database Health Monitoring

- **Performance Monitoring**: Continuously monitor database performance metrics
- **Resource Usage**: Track CPU, memory, and storage utilization
- **Connection Monitoring**: Monitor database connections and connection pools
- **Replication Health**: Monitor database replication lag and status

### Intelligent Query Optimization

- **Automatic Query Analysis**: Analyze queries for optimization opportunities
- **Index Recommendations**: Suggest optimal indexes based on query patterns
- **Query Rewriting**: Rewrite queries for better performance
- **Execution Plan Optimization**: Optimize query execution plans

### Data Quality Management

- **Data Validation**: Continuously validate data integrity and consistency
- **Anomaly Detection**: Detect unusual patterns or outliers in data
- **Schema Evolution**: Track and manage schema changes over time
- **Data Lineage**: Track data flow and transformations

## A2A Communication Interfaces

### Outbound Communications

```typescript
interface DatabaseAgentEvents {
  // Performance events
  performanceAlert: PerformanceAlert;
  slowQueryDetected: SlowQueryInfo;
  resourceThresholdExceeded: ResourceAlert;

  // Data events
  dataQualityIssue: DataQualityAlert;
  schemaChangeDetected: SchemaChangeInfo;
  backupCompleted: BackupInfo;

  // Analysis results
  queryOptimizationComplete: OptimizationResults;
  dataAnalysisComplete: AnalysisResults;
  migrationComplete: MigrationResults;
}
```

### Inbound Message Handlers

```typescript
interface DatabaseAgentHandlers {
  // Query operations
  executeQuery: (request: QueryRequest) => Promise<QueryResults>;
  optimizeQuery: (request: OptimizationRequest) => Promise<OptimizedQuery>;
  analyzePerformance: (request: PerformanceAnalysisRequest) => Promise<PerformanceReport>;

  // Schema operations
  createTable: (request: TableCreationRequest) => Promise<TableInfo>;
  modifySchema: (request: SchemaModificationRequest) => Promise<MigrationPlan>;
  validateSchema: (request: SchemaValidationRequest) => Promise<ValidationResults>;

  // Git agent integration
  storeRepositoryData: (data: RepositoryData) => Promise<void>;
  queryCodeMetrics: (query: MetricsQuery) => Promise<CodeMetrics>;

  // Code review agent integration
  storeReviewResults: (results: ReviewResults) => Promise<void>;
  queryHistoricalReviews: (query: ReviewQuery) => Promise<ReviewHistory>;
}
```

## Decision-Making Logic

### Query Optimization Strategy

```typescript
class QueryOptimizer {
  analyzeQuery(query: SQLQuery): QueryAnalysis {
    // Parse query structure and complexity
    // Identify potential optimization opportunities
    // Return analysis with recommendations
  }

  generateOptimizationPlan(analysis: QueryAnalysis): OptimizationPlan {
    // Create step-by-step optimization plan
    // Consider database-specific optimizations
    // Estimate performance improvements
  }

  validateOptimization(original: SQLQuery, optimized: SQLQuery): ValidationResult {
    // Ensure semantic equivalence
    // Verify performance improvements
    // Check for potential side effects
  }
}
```

### Schema Evolution Management

```typescript
class SchemaEvolutionManager {
  analyzeSchemaChange(current: Schema, proposed: Schema): ChangeAnalysis {
    // Identify breaking changes
    // Assess migration complexity
    // Evaluate performance impact
  }

  generateMigrationPlan(analysis: ChangeAnalysis): MigrationPlan {
    // Create safe migration steps
    // Include rollback procedures
    // Estimate downtime requirements
  }

  validateMigration(plan: MigrationPlan): ValidationResult {
    // Test migration in isolated environment
    // Verify data integrity preservation
    // Confirm performance characteristics
  }
}
```

### Performance Tuning Intelligence

```typescript
class PerformanceTuner {
  identifyBottlenecks(metrics: PerformanceMetrics): BottleneckAnalysis {
    // Analyze CPU, memory, I/O patterns
    // Identify resource constraints
    // Prioritize optimization opportunities
  }

  recommendOptimizations(analysis: BottleneckAnalysis): OptimizationRecommendations {
    // Suggest configuration changes
    // Recommend index modifications
    // Propose query optimizations
  }

  implementOptimizations(recommendations: OptimizationRecommendations): ImplementationPlan {
    // Create safe implementation steps
    // Include monitoring checkpoints
    // Provide rollback procedures
  }
}
```

## Integration Patterns

### With Git Agent

- **Schema Versioning**: Track database schema changes in Git repositories
- **Migration Scripts**: Store and version database migration scripts
- **Configuration Management**: Version database configuration files
- **Deployment Coordination**: Coordinate database deployments with code deployments

### With Code Review Agent

- **Query Review**: Review SQL queries for performance and security
- **Schema Review**: Review database schema changes for best practices
- **Migration Review**: Review migration scripts for safety and efficiency
- **Data Access Pattern Review**: Review application data access patterns

## Configuration Schema

```json
{
  "database-agent": {
    "connections": {
      "primary": {
        "type": "postgresql",
        "host": "localhost",
        "port": 5432,
        "database": "main",
        "credentials": "env:DB_CREDENTIALS"
      },
      "analytics": {
        "type": "clickhouse",
        "host": "analytics.example.com",
        "port": 9000,
        "database": "analytics",
        "credentials": "env:ANALYTICS_CREDENTIALS"
      }
    },
    "monitoring": {
      "performance-thresholds": {
        "slow-query-threshold": "1s",
        "cpu-threshold": 80,
        "memory-threshold": 85
      },
      "alerting": {
        "enabled": true,
        "channels": ["slack", "email"]
      }
    },
    "optimization": {
      "auto-index-suggestions": true,
      "query-rewriting": true,
      "execution-plan-caching": true
    },
    "backup": {
      "strategy": "continuous",
      "retention": "30d",
      "compression": true,
      "encryption": true
    }
  }
}
```

## Performance Metrics

### Operational Metrics

- **Query Execution Time**: Average and percentile query execution times
- **Throughput**: Queries per second and transactions per second
- **Resource Utilization**: CPU, memory, and storage utilization
- **Connection Pool Efficiency**: Connection pool usage and wait times

### Quality Metrics

- **Data Quality Score**: Overall data quality assessment
- **Schema Compliance**: Adherence to database design standards
- **Performance Improvement**: Measurable performance gains from optimizations
- **Availability**: Database uptime and availability metrics

### Intelligence Metrics

- **Optimization Accuracy**: Success rate of optimization recommendations
- **Anomaly Detection Rate**: Rate of successful anomaly detection
- **Predictive Accuracy**: Accuracy of performance and capacity predictions
- **Automation Success**: Success rate of automated database operations
