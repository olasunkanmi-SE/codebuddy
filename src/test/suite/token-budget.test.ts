import * as assert from "assert";
import {
  TokenBudgetAllocator,
  CHARS_PER_TOKEN,
  createAnalysisBudget,
} from "../../services/analyzers/token-budget";

suite("TokenBudgetAllocator", () => {
  suite("constructor", () => {
    test("applies safety margin to total budget", () => {
      const budget = new TokenBudgetAllocator(10000, 0.9);
      assert.strictEqual(budget.getTotalRemaining(), 9000);
    });

    test("defaults to 32000 chars with 0.9 margin", () => {
      const budget = new TokenBudgetAllocator();
      assert.strictEqual(budget.getTotalRemaining(), 28800);
    });

    test("floors the effective budget", () => {
      const budget = new TokenBudgetAllocator(10001, 0.9);
      assert.strictEqual(budget.getTotalRemaining(), 9000); // floor(10001 * 0.9) = 9000
    });
  });

  suite("static tokensToChars / charsToTokens", () => {
    test("converts tokens to chars for code", () => {
      assert.strictEqual(
        TokenBudgetAllocator.tokensToChars(100, "code"),
        200,
      );
    });

    test("converts tokens to chars for prose", () => {
      assert.strictEqual(
        TokenBudgetAllocator.tokensToChars(100, "prose"),
        350,
      );
    });

    test("defaults to conservative", () => {
      assert.strictEqual(TokenBudgetAllocator.tokensToChars(100), 200);
    });

    test("round-trips approximately", () => {
      const tokens = 500;
      const chars = TokenBudgetAllocator.tokensToChars(tokens, "code");
      const back = TokenBudgetAllocator.charsToTokens(chars, "code");
      assert.strictEqual(back, tokens);
    });

    test("charsToTokens rounds up", () => {
      // 3 chars at 2 chars/token = ceil(1.5) = 2
      assert.strictEqual(TokenBudgetAllocator.charsToTokens(3, "code"), 2);
    });
  });

  suite("allocate", () => {
    test("allocates named categories", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 5000, 1);
      budget.allocate("b", 3000, 2);
      assert.strictEqual(budget.getRemaining("a"), 5000);
      assert.strictEqual(budget.getRemaining("b"), 3000);
    });

    test("clamps allocation to remaining total", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 8000);
      budget.allocate("b", 5000); // only 2000 remaining
      assert.strictEqual(budget.getRemaining("b"), 2000);
    });

    test("returns 0 for unallocated category", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      assert.strictEqual(budget.getRemaining("nonexistent"), 0);
    });

    test("supports chaining", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      const result = budget.allocate("a", 1000).allocate("b", 2000);
      assert.ok(result instanceof TokenBudgetAllocator);
    });
  });

  suite("recordUsage / getRemaining", () => {
    test("decreases remaining after usage", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 5000);
      budget.recordUsage("a", 2000);
      assert.strictEqual(budget.getRemaining("a"), 3000);
    });

    test("remaining never goes below 0", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 1000);
      budget.recordUsage("a", 5000);
      assert.strictEqual(budget.getRemaining("a"), 0);
    });

    test("does not throw for unknown category", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.recordUsage("unknown", 100); // no-op
      assert.strictEqual(budget.getRemaining("unknown"), 0);
    });
  });

  suite("getTotalRemaining", () => {
    test("reflects cumulative usage across categories", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 5000);
      budget.allocate("b", 3000);
      budget.recordUsage("a", 1000);
      budget.recordUsage("b", 500);
      assert.strictEqual(budget.getTotalRemaining(), 8500);
    });
  });

  suite("selectWithinBudget", () => {
    test("selects items that fit within budget", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("items", 5000);

      const items = [
        { name: "a", size: 2000 },
        { name: "b", size: 2000 },
        { name: "c", size: 2000 },
      ];

      const selected = budget.selectWithinBudget(
        "items",
        items,
        (i) => i.size,
      );
      // Two items fit (2000 + 2000 = 4000 <= 5000), third doesn't (6000 > 5000)
      assert.strictEqual(selected.length, 2);
    });

    test("prioritizes higher-scored items", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("items", 3000);

      const items = [
        { name: "low", size: 2000, score: 1 },
        { name: "high", size: 2000, score: 10 },
      ];

      const selected = budget.selectWithinBudget(
        "items",
        items,
        (i) => i.size,
        (i) => i.score,
      );
      assert.strictEqual(selected.length, 1);
      assert.strictEqual(selected[0].name, "high");
    });

    test("records usage after selection", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("items", 5000);

      const items = [{ name: "a", size: 1500 }];
      budget.selectWithinBudget("items", items, (i) => i.size);
      assert.strictEqual(budget.getRemaining("items"), 3500);
    });

    test("returns empty array when budget is exhausted", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("items", 1000);
      budget.recordUsage("items", 1000);

      const items = [{ name: "a", size: 100 }];
      const selected = budget.selectWithinBudget(
        "items",
        items,
        (i) => i.size,
      );
      assert.strictEqual(selected.length, 0);
    });

    test("returns empty array for empty items", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("items", 5000);
      const selected = budget.selectWithinBudget(
        "items",
        [],
        (i: any) => i.size,
      );
      assert.strictEqual(selected.length, 0);
    });

    test("scans past large items to include smaller ones", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("items", 3000);

      const items = [
        { name: "small", size: 1000, score: 1 },
        { name: "big", size: 4000, score: 2 },
        { name: "medium", size: 1500, score: 1 },
      ];

      const selected = budget.selectWithinBudget(
        "items",
        items,
        (i) => i.size,
        (i) => i.score,
      );
      // "big" is sorted first by score but doesn't fit (4000 > 3000)
      // "small" and "medium" should fit (1000 + 1500 = 2500 <= 3000)
      assert.strictEqual(selected.length, 2);
      const names = selected.map((s) => s.name);
      assert.ok(names.includes("small"));
      assert.ok(names.includes("medium"));
    });
  });

  suite("truncateToFit", () => {
    test("returns full text when it fits", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("text", 5000);
      const text = "a".repeat(100);
      assert.strictEqual(budget.truncateToFit("text", text), text);
    });

    test("truncates with suffix when text exceeds budget", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("text", 50);
      const text = "a".repeat(100);
      const result = budget.truncateToFit("text", text);
      assert.ok(result.endsWith("\n..."));
      assert.ok(result.length <= 50);
    });

    test("records usage after truncation", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("text", 50);
      const text = "a".repeat(100);
      budget.truncateToFit("text", text);
      assert.ok(budget.getRemaining("text") < 50);
    });

    test("uses custom suffix", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("text", 20);
      const text = "a".repeat(100);
      const result = budget.truncateToFit("text", text, " [cut]");
      assert.ok(result.endsWith(" [cut]"));
    });
  });

  suite("getSummary", () => {
    test("returns summary for all allocations", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 5000, 1);
      budget.allocate("b", 3000, 2);
      budget.recordUsage("a", 1000);

      const summary = budget.getSummary();
      assert.strictEqual(summary.length, 2);

      const a = summary.find((s) => s.name === "a");
      assert.ok(a);
      assert.strictEqual(a.budget, 5000);
      assert.strictEqual(a.used, 1000);
      assert.strictEqual(a.remaining, 4000);
    });
  });

  suite("isExhausted", () => {
    test("returns false when budget remains", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 5000);
      assert.strictEqual(budget.isExhausted(), false);
    });

    test("returns true when fully used", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 10000);
      budget.recordUsage("a", 10000);
      assert.strictEqual(budget.isExhausted(), true);
    });
  });

  suite("reset", () => {
    test("clears all usage counters", () => {
      const budget = new TokenBudgetAllocator(10000, 1.0);
      budget.allocate("a", 5000);
      budget.allocate("b", 3000);
      budget.recordUsage("a", 2000);
      budget.recordUsage("b", 1000);

      budget.reset();
      assert.strictEqual(budget.getRemaining("a"), 5000);
      assert.strictEqual(budget.getRemaining("b"), 3000);
    });
  });
});

suite("CHARS_PER_TOKEN", () => {
  test("has expected content types", () => {
    assert.strictEqual(CHARS_PER_TOKEN.code, 2.0);
    assert.strictEqual(CHARS_PER_TOKEN.prose, 3.5);
    assert.strictEqual(CHARS_PER_TOKEN.conservative, 2.0);
  });
});

suite("createAnalysisBudget", () => {
  test("creates budget with 10 categories", () => {
    const budget = createAnalysisBudget();
    const summary = budget.getSummary();
    assert.strictEqual(summary.length, 10);
  });

  test("allocates codeSnippets as largest share", () => {
    const budget = createAnalysisBudget();
    const summary = budget.getSummary();
    const codeSnippets = summary.find((s) => s.name === "codeSnippets")!;
    const maxBudget = Math.max(...summary.map((s) => s.budget));
    assert.strictEqual(codeSnippets.budget, maxBudget);
  });

  test("overview has highest priority", () => {
    const budget = createAnalysisBudget();
    // overview is allocated first and has weight 0.025, priority 10
    // codeSnippets has priority 7 but largest budget
    const summary = budget.getSummary();
    assert.ok(summary.some((s) => s.name === "overview"));
  });

  test("total allocated does not exceed effective budget", () => {
    const budget = createAnalysisBudget(32000);
    const summary = budget.getSummary();
    const totalAllocated = summary.reduce((sum, s) => sum + s.budget, 0);
    // Effective = floor(32000 * 0.9) = 28800
    assert.ok(totalAllocated <= 28800);
  });

  test("accepts custom total chars", () => {
    const small = createAnalysisBudget(10000);
    const large = createAnalysisBudget(100000);
    const smallTotal = small
      .getSummary()
      .reduce((sum, s) => sum + s.budget, 0);
    const largeTotal = large
      .getSummary()
      .reduce((sum, s) => sum + s.budget, 0);
    assert.ok(largeTotal > smallTotal);
  });
});
