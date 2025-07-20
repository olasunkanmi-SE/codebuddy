import * as assert from "assert";
import * as sinon from "sinon";
import { CodebaseUnderstandingService } from "../../services/codebase-understanding.service";

suite("CodebaseUnderstandingService Basic Tests", () => {
  let service: CodebaseUnderstandingService;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    service = CodebaseUnderstandingService.getInstance();
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should return singleton instance", () => {
    const instance1 = CodebaseUnderstandingService.getInstance();
    const instance2 = CodebaseUnderstandingService.getInstance();

    assert.strictEqual(instance1, instance2);
  });

  test("should have cache management methods", () => {
    assert.doesNotThrow(() => service.clearCache());
    assert.doesNotThrow(() => service.clearCachePattern("test"));
    assert.doesNotThrow(() => service.getCacheStats());
  });
});
