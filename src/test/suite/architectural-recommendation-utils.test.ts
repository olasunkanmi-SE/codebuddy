import * as assert from "assert";
import {
  scoreDependency,
  getRelativePath,
} from "../../commands/architectural-recommendation";

suite("scoreDependency", () => {
  suite("base scoring", () => {
    test("unknown packages get base score of 1", () => {
      assert.strictEqual(scoreDependency("lodash"), 1);
      assert.strictEqual(scoreDependency("some-random-lib"), 1);
    });
  });

  suite("Tier 1: core framework packages", () => {
    test("scores React packages as frameworks (+3)", () => {
      assert.strictEqual(scoreDependency("react"), 4);
      assert.strictEqual(scoreDependency("react-dom"), 4);
    });

    test("scores meta-frameworks (+3)", () => {
      assert.strictEqual(scoreDependency("next"), 4);
      assert.strictEqual(scoreDependency("nuxt"), 4);
    });

    test("scores backend frameworks (+3)", () => {
      assert.strictEqual(scoreDependency("express"), 4);
      assert.strictEqual(scoreDependency("fastify"), 4);
      assert.strictEqual(scoreDependency("koa"), 4);
      assert.strictEqual(scoreDependency("hono"), 4);
    });

    test("scores ORMs (+3)", () => {
      assert.strictEqual(scoreDependency("prisma"), 4);
      assert.strictEqual(scoreDependency("typeorm"), 4);
      assert.strictEqual(scoreDependency("mongoose"), 4);
      assert.strictEqual(scoreDependency("sequelize"), 4);
      assert.strictEqual(scoreDependency("drizzle-orm"), 4);
    });

    test("scores build tools (+3)", () => {
      assert.strictEqual(scoreDependency("typescript"), 4);
      assert.strictEqual(scoreDependency("webpack"), 4);
      assert.strictEqual(scoreDependency("vite"), 4);
      assert.strictEqual(scoreDependency("esbuild"), 4);
    });

    test("is case-insensitive", () => {
      assert.strictEqual(scoreDependency("React"), 4);
      assert.strictEqual(scoreDependency("TYPESCRIPT"), 4);
    });
  });

  suite("Tier 2: scoped package normalization", () => {
    test("scores @angular/* via scope (+3)", () => {
      assert.strictEqual(scoreDependency("@angular/core"), 4);
      assert.strictEqual(scoreDependency("@angular/router"), 4);
    });

    test("scores @nestjs/* via scope (+3)", () => {
      assert.strictEqual(scoreDependency("@nestjs/core"), 4);
      assert.strictEqual(scoreDependency("@nestjs/common"), 4);
    });

    test("scores @prisma/* via scope (+3)", () => {
      assert.strictEqual(scoreDependency("@prisma/client"), 4);
    });

    test("scores @trpc/* via scope (+3)", () => {
      assert.strictEqual(scoreDependency("@trpc/server"), 4);
      assert.strictEqual(scoreDependency("@trpc/client"), 4);
    });

    test("does not boost unknown scoped packages", () => {
      assert.strictEqual(scoreDependency("@types/node"), 1);
      assert.strictEqual(scoreDependency("@babel/core"), 1);
    });
  });

  suite("question relevance", () => {
    test("boosts score when question mentions dependency (+5)", () => {
      assert.strictEqual(
        scoreDependency("express", "How do I set up express routes?"),
        9, // 1 + 3 (framework) + 5 (question)
      );
    });

    test("no boost when question doesn't mention dependency", () => {
      assert.strictEqual(
        scoreDependency("express", "How do I use React hooks?"),
        4, // 1 + 3 (framework only)
      );
    });

    test("question match is case-insensitive", () => {
      assert.strictEqual(
        scoreDependency("React", "I need help with react components"),
        9,
      );
    });

    test("no question = no question boost", () => {
      assert.strictEqual(scoreDependency("react"), 4);
      assert.strictEqual(scoreDependency("react", undefined), 4);
    });
  });

  suite("edge cases", () => {
    test("next-auth does not match as next", () => {
      // "next-auth" is not in CORE_FRAMEWORK_NAMES — only "next" is
      assert.strictEqual(scoreDependency("next-auth"), 1);
    });

    test("scoped package with core name gets tier 1 match", () => {
      // @scope/react → unscopedName = "react" → matches tier 1
      assert.strictEqual(scoreDependency("@scope/react"), 4);
    });
  });
});

suite("getRelativePath", () => {
  test("returns 'unknown' for empty path", () => {
    assert.strictEqual(getRelativePath(""), "unknown");
  });

  test("finds deepest src/ marker (lastIndexOf)", () => {
    const result = getRelativePath(
      "/workspace/packages/mylib/src/utils/helpers.ts",
    );
    assert.strictEqual(result, "src/utils/helpers.ts");
  });

  test("handles lib/ marker", () => {
    const result = getRelativePath("/project/lib/core/index.ts");
    assert.strictEqual(result, "lib/core/index.ts");
  });

  test("handles app/ marker", () => {
    const result = getRelativePath("/project/app/controllers/main.ts");
    assert.strictEqual(result, "app/controllers/main.ts");
  });

  test("handles pages/ marker", () => {
    const result = getRelativePath("/project/pages/index.tsx");
    assert.strictEqual(result, "pages/index.tsx");
  });

  test("handles components/ marker", () => {
    const result = getRelativePath("/project/components/Button.tsx");
    assert.strictEqual(result, "components/Button.tsx");
  });

  test("returns basename for node_modules paths", () => {
    const result = getRelativePath(
      "/project/node_modules/express/lib/router.js",
    );
    assert.strictEqual(result, "router.js");
  });

  test("falls back to basename when no marker found", () => {
    const result = getRelativePath("/some/random/path/file.txt");
    assert.strictEqual(result, "file.txt");
  });

  test("normalizes Windows paths", () => {
    const result = getRelativePath("C:\\project\\src\\utils\\file.ts");
    assert.strictEqual(result, "src/utils/file.ts");
  });

  test("uses deepest marker in monorepo structure", () => {
    // /workspace/src/packages/backend/src/server.ts
    // lastIndexOf('/src/') finds the inner src, not the outer one
    const result = getRelativePath(
      "/workspace/src/packages/backend/src/server.ts",
    );
    assert.strictEqual(result, "src/server.ts");
  });
});
