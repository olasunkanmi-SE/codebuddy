import * as assert from "assert";
import { AgentService } from "../../services/agent-state";

suite("Persistent Chat History Integration (Worker-based)", () => {
  let agentService: AgentService;
  const testAgentId = "test-agent-123";

  setup(() => {
    agentService = AgentService.getInstance();
  });

  teardown(async () => {
    // Clean up test data
    try {
      await agentService.clearChatHistory(testAgentId);
    } catch (error) {
      console.warn("Test cleanup failed:", error);
    }
  });

  test("should save and retrieve chat history using worker and SQLite", async () => {
    // Test data
    const testHistory = [
      { content: "Hello", type: "user", alias: "User", timestamp: Date.now() },
      {
        content: "Hi there!",
        type: "bot",
        alias: "Bot",
        timestamp: Date.now() + 1000,
      },
    ];

    // Save chat history
    await agentService.saveChatHistory(testAgentId, testHistory);

    // Retrieve chat history
    const retrievedHistory = await agentService.getChatHistory(testAgentId);

    // Verify the data
    assert.strictEqual(retrievedHistory.length, 2);
    assert.strictEqual(retrievedHistory[0].content, "Hello");
    assert.strictEqual(retrievedHistory[0].type, "user");
    assert.strictEqual(retrievedHistory[1].content, "Hi there!");
    assert.strictEqual(retrievedHistory[1].type, "bot");
  });

  test("should add individual messages to chat history", async () => {
    // Add messages one by one
    await agentService.addChatMessage(testAgentId, {
      content: "First message",
      type: "user",
      alias: "User",
    });

    await agentService.addChatMessage(testAgentId, {
      content: "Second message",
      type: "bot",
      alias: "Bot",
    });

    // Retrieve and verify
    const history = await agentService.getChatHistory(testAgentId);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].content, "First message");
    assert.strictEqual(history[1].content, "Second message");
  });

  test("should clear chat history completely", async () => {
    // Add some data first
    await agentService.saveChatHistory(testAgentId, [
      {
        content: "Test message",
        type: "user",
        alias: "User",
        timestamp: Date.now(),
      },
    ]);

    // Verify data exists
    let history = await agentService.getChatHistory(testAgentId);
    assert.strictEqual(history.length, 1);

    // Clear the history
    await agentService.clearChatHistory(testAgentId);

    // Verify data is cleared
    history = await agentService.getChatHistory(testAgentId);
    assert.strictEqual(history.length, 0);
  });

  test("should handle empty chat history gracefully", async () => {
    // Try to get history for non-existent agent
    const history = await agentService.getChatHistory("non-existent-agent");
    assert.strictEqual(history.length, 0);
  });

  test("should get recent chat history with limit", async () => {
    // Add multiple messages
    const messages = [];
    for (let i = 0; i < 10; i++) {
      messages.push({
        content: `Message ${i}`,
        type: "user",
        alias: "User",
        timestamp: Date.now() + i * 1000,
      });
    }

    await agentService.saveChatHistory(testAgentId, messages);

    // Get recent history with limit
    const recentHistory = await agentService.getRecentChatHistory(
      testAgentId,
      5,
    );

    // Should get only the last 5 messages
    assert.strictEqual(recentHistory.length, 5);
    assert.strictEqual(recentHistory[0].content, "Message 5");
    assert.strictEqual(recentHistory[4].content, "Message 9");
  });

  test("should handle worker operations asynchronously", async () => {
    // Test multiple concurrent operations
    const promises = [];

    // Add multiple messages concurrently
    for (let i = 0; i < 5; i++) {
      promises.push(
        agentService.addChatMessage(testAgentId, {
          content: `Concurrent message ${i}`,
          type: "user",
          alias: "User",
        }),
      );
    }

    // Wait for all operations to complete
    await Promise.all(promises);

    // Verify all messages were added
    const history = await agentService.getChatHistory(testAgentId);
    assert.strictEqual(history.length, 5);
  });
});
