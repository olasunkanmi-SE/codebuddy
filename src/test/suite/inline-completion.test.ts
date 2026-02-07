
import * as assert from "assert";
import * as sinon from "sinon";
import { InlineCompletionService } from "../../services/inline-completion.service";
import { CompletionConfigService } from "../../services/completion-config.service";
import { ContextCompletionService } from "../../services/context-completion.service";
import { FIMPromptService } from "../../services/fim-prompt.service";
import { LocalLLM } from "../../llms/local/local";
import { CodeBuddyToolProvider } from "../../tools/factory/tool";
import { Orchestrator } from "../../orchestrator";
import { InlineCompletionTriggerKind } from "../../interfaces/editor-host";

describe("InlineCompletionService", () => {
    let sandbox: sinon.SinonSandbox;
    let service: InlineCompletionService;
    let configServiceStub: sinon.SinonStubbedInstance<CompletionConfigService>;
    let contextServiceStub: sinon.SinonStubbedInstance<ContextCompletionService>;
    let fimServiceStub: sinon.SinonStubbedInstance<FIMPromptService>;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Stub global dependencies to prevent side effects during LocalLLM instantiation
        sandbox.stub(CodeBuddyToolProvider, "initialize");
        sandbox.stub(Orchestrator, "getInstance").returns({} as any);

        // Mock Config Service
        configServiceStub = sandbox.createStubInstance(CompletionConfigService);
        configServiceStub.getConfig.returns({
            enabled: true,
            provider: "local",
            model: "qwen2.5-coder",
            triggerMode: "automatic",
            debounceMs: 0,
            maxTokens: 128,
            temperature: 0.1,
            contextLines: 20
        } as any);
        configServiceStub.isFimSupported.returns(true);
        sandbox.stub(CompletionConfigService, "getInstance").returns(configServiceStub as any);

        // Mock Context Service
        contextServiceStub = sandbox.createStubInstance(ContextCompletionService);
        contextServiceStub.gatherContext.resolves({
            prefix: "const a = 1;",
            suffix: "",
            languageId: "typescript",
            imports: [],
            cursorPosition: { line: 0, character: 12 }
        });
        sandbox.stub(ContextCompletionService, "getInstance").returns(contextServiceStub as any);

        // Mock FIM Service
        fimServiceStub = sandbox.createStubInstance(FIMPromptService);
        fimServiceStub.buildPrompt.returns({
            prompt: "<|fim_prefix|>const a = 1;<|fim_suffix|><|fim_middle|>",
            stopSequences: ["<|file_separator|>"]
        });
        sandbox.stub(FIMPromptService, "getInstance").returns(fimServiceStub as any);

        // Mock VS Code OutputChannel
        const outputChannel = {
            append: sandbox.stub(),
            appendLine: sandbox.stub(),
            clear: sandbox.stub(),
            show: sandbox.stub(),
            hide: sandbox.stub(),
            dispose: sandbox.stub(),
            name: "Test",
            replace: sandbox.stub(),
        };
        
        // Mock LocalLLM.prototype.completeCode
        // We need to make sure we stub the method on the prototype because the service creates a new instance
        sandbox.stub(LocalLLM.prototype, "completeCode").resolves("const b = 2;");
        sandbox.stub(LocalLLM.prototype, "updateConfig");
        
        service = new InlineCompletionService("/test/path", outputChannel as any);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("should provide inline completion items", async () => {
        const document = {
            fileName: "test.ts",
            lineAt: (line: number) => ({ text: "const a = 1;" }),
            getText: () => "const a = 1;",
            languageId: "typescript",
            offsetAt: () => 0,
            positionAt: () => ({ line: 0, character: 0 }),
        } as any;
        const position = { line: 0, character: 12 };
        const context = {
            triggerKind: InlineCompletionTriggerKind.Automatic,
            selectedCompletionInfo: undefined
        } as any;
        const token = {
            isCancellationRequested: false,
            onCancellationRequested: sandbox.stub()
        } as any;

        const result = await service.provideInlineCompletionItems(document, position, context, token);

        assert.ok(result);
        if (Array.isArray(result)) {
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].insertText, "const b = 2;");
        }
    });

    it("should return null if disabled", async () => {
        configServiceStub.getConfig.returns({ enabled: false } as any);
        
        const document = {} as any;
        const position = { line: 0, character: 0 };
        const context = {} as any;
        const token = { isCancellationRequested: false } as any;

        const result = await service.provideInlineCompletionItems(document, position, context, token);
        assert.strictEqual(result, null);
    });

    it("should cache results", async () => {
        const document = {
            fileName: "test.ts",
            lineAt: (line: number) => ({ text: "const a = 1;" }),
            getText: () => "const a = 1;",
            languageId: "typescript",
            offsetAt: () => 0,
            positionAt: () => ({ line: 0, character: 0 }),
        } as any;
        const position = { line: 0, character: 12 };
        const context = {
            triggerKind: InlineCompletionTriggerKind.Automatic,
        } as any;
        const token = {
            isCancellationRequested: false,
            onCancellationRequested: sandbox.stub()
        } as any;

        // First call - should hit LLM
        await service.provideInlineCompletionItems(document, position, context, token);
        
        // Second call - same input - should hit cache
        // We can verify this by checking if completeCode was called only once
        await service.provideInlineCompletionItems(document, position, context, token);

        // Access the stub from the prototype again to check call count
        // Note: In a real integration test, we'd check the spy, but since we stubbed prototype:
        const completeCodeStub = LocalLLM.prototype.completeCode as sinon.SinonStub;
        assert.strictEqual(completeCodeStub.callCount, 1, "LLM should only be called once due to caching");
    });
});
