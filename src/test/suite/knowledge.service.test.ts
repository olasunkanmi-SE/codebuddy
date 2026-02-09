import * as assert from "assert";
import * as sinon from "sinon";
import { KnowledgeService } from "../../services/knowledge.service";
import { SqliteDatabaseService } from "../../services/sqlite-database.service";
import { KNOWLEDGE_SCORING } from "../../application/constant";


describe("KnowledgeService Tests", () => {
  let sandbox: sinon.SinonSandbox;
  let dbServiceStub: sinon.SinonStubbedInstance<SqliteDatabaseService>;
  let knowledgeService: KnowledgeService;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Mock SqliteDatabaseService
    dbServiceStub = sandbox.createStubInstance(SqliteDatabaseService);
    sandbox.stub(SqliteDatabaseService, "getInstance").returns(dbServiceStub as any);

    // Reset singleton instance if possible, or just rely on the mock being injected via getInstance
    // Since KnowledgeService uses getInstance internally in its constructor, 
    // we need to be careful. Ideally, we'd reset the instance, but it's private.
    // For this test, we assume we can control the DB service it gets.
    
    // Note: If KnowledgeService is already instantiated, this might fail to inject the mock.
    // A better approach for testability would be dependency injection, but we work with what we have.
    // We will try to rely on the fact that we can't easily reset the singleton, 
    // so we might need to cast and force set the private property if needed, 
    // or just accept that we need to restart the extension host for clean tests.
    
    // However, for unit testing here, we can try to force a new instance or mock the prototype.
    // Let's try to access the private instance property to reset it for testing.
    (KnowledgeService as any).instance = undefined;
    knowledgeService = KnowledgeService.getInstance();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("recordInteraction", () => {
    it("should record reading history and update topics", async () => {
      const newsItem = {
        id: 1,
        title: "Test News",
        url: "http://test.com",
        source: "Test",
        published_at: "2023-01-01",
        topics: JSON.stringify(["AI", "TypeScript"]),
        relevance_score: 80
      };

      // Mock DB responses
      dbServiceStub.executeSql.resolves([]); // No existing topics
      dbServiceStub.executeSqlCommand.resolves();

      const result = await knowledgeService.recordInteraction(newsItem, "read");
      assert.strictEqual(result, true);

      // Verify reading history insert
      assert.ok(dbServiceStub.executeSqlCommand.calledWithMatch(
        sinon.match(/INSERT INTO reading_history/)
      ));

      // Verify topic updates (2 topics * 1 insert each = 2 inserts)
      // Topics should be normalized to lowercase
      assert.ok(dbServiceStub.executeSqlCommand.calledWithMatch(
        sinon.match(/INSERT INTO user_knowledge/),
        sinon.match.array.contains(["ai"])
      ));
      assert.ok(dbServiceStub.executeSqlCommand.calledWithMatch(
        sinon.match(/INSERT INTO user_knowledge/),
        sinon.match.array.contains(["typescript"])
      ));
    });

    it("should use UPSERT for atomic updates", async () => {
      const newsItem = {
        id: 1,
        title: "Test News",
        url: "http://test.com",
        source: "Test",
        published_at: "2023-01-01",
        topics: "AI",
        relevance_score: 80
      };

      // Mock DB responses
      dbServiceStub.executeSqlCommand.resolves();

      await knowledgeService.recordInteraction(newsItem, "read");

      // Verify UPSERT SQL usage
      assert.ok(dbServiceStub.executeSqlCommand.calledWithMatch(
        sinon.match(/INSERT INTO user_knowledge.*ON CONFLICT\(topic\) DO UPDATE SET/s)
      ));
    });

    it("should apply 5x weight for discussion", async () => {
        const newsItem = {
          id: 1,
          title: "Test News",
          url: "http://test.com",
          source: "Test",
          published_at: "2023-01-01",
          topics: "AI",
          relevance_score: 80
        };
  
        // Mock DB responses
        dbServiceStub.executeSqlCommand.resolves();
  
        const result = await knowledgeService.recordInteraction(newsItem, "discuss");
        assert.strictEqual(result, true);

      // Verify UPSERT with correct weight and normalized topic
      assert.ok(dbServiceStub.executeSqlCommand.calledWithMatch(
        sinon.match(/INSERT INTO user_knowledge/),
        sinon.match.array.contains([KNOWLEDGE_SCORING.DISCUSS_WEIGHT, "ai"])
      ));
    });

    it("should return false if database operation fails", async () => {
        const newsItem = {
          id: 1,
          title: "Test News",
          url: "http://test.com",
          source: "Test",
          published_at: "2023-01-01",
          topics: "AI",
          relevance_score: 80
        };
  
        // Mock DB failure
        dbServiceStub.executeSqlCommand.rejects(new Error("DB Error"));
  
        const result = await knowledgeService.recordInteraction(newsItem, "read");
        assert.strictEqual(result, false);
    });
  });

  describe("recordQuizResult", () => {
    it("should increase score by 10 for correct answer", async () => {
        const topic = "AI";
        
        // Mock DB responses
        dbServiceStub.executeSqlCommand.resolves();

        const result = await knowledgeService.recordQuizResult(topic, true);
        assert.strictEqual(result, true);

        // Verify UPSERT with +10 score and normalized topic
        assert.ok(dbServiceStub.executeSqlCommand.calledWithMatch(
            sinon.match(/INSERT INTO user_knowledge/),
            sinon.match.array.contains([KNOWLEDGE_SCORING.QUIZ_CORRECT_WEIGHT, "ai"])
        ));
    });

    it("should increase score by 1 for incorrect answer (effort)", async () => {
        const topic = "AI";
        
        // Mock DB responses
        dbServiceStub.executeSqlCommand.resolves();

        const result = await knowledgeService.recordQuizResult(topic, false);
        assert.strictEqual(result, true);

        // Verify UPSERT with +1 score
        assert.ok(dbServiceStub.executeSqlCommand.calledWithMatch(
            sinon.match(/INSERT INTO user_knowledge/),
            sinon.match.array.contains([KNOWLEDGE_SCORING.QUIZ_INCORRECT_WEIGHT, "ai"])
        ));
    });

    it("should return false if database operation fails", async () => {
        const topic = "AI";
        
        // Mock DB failure
        dbServiceStub.executeSqlCommand.rejects(new Error("DB Error"));

        const result = await knowledgeService.recordQuizResult(topic, true);
        assert.strictEqual(result, false);
    });
  });
});
