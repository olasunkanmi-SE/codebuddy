import * as assert from 'assert';
import * as path from 'path';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

suite('MCP Server Integration Test', () => {
    let client: Client;
    let transport: StdioClientTransport;

    setup(async () => {
        // Path to the server file
        // In test execution, __dirname is likely src/test/suite
        // We need to find src/MCP/server.ts
        const serverPath = path.resolve(__dirname, '../../MCP/server.ts');
        
        // Initialize MCP Client with StdioClientTransport that spawns the server
        transport = new StdioClientTransport({
            command: 'npx',
            args: ['ts-node', serverPath],
            env: { ...process.env, PATH: process.env.PATH || '' }
        });

        client = new Client(
            {
                name: "test-client",
                version: "1.0.0",
            },
            {
                capabilities: {},
            }
        );

        await client.connect(transport);
    });

    teardown(async () => {
        await client?.close();
    });

    test('should list available tools', async () => {
        const result = await client.listTools();
        
        assert.ok(result.tools);
        assert.ok(result.tools.some((t: any) => t.name === 'read_file'));
        assert.ok(result.tools.some((t: any) => t.name === 'write_file'));
        assert.ok(result.tools.some((t: any) => t.name === 'list_files'));
        assert.ok(result.tools.some((t: any) => t.name === 'run_command'));
    });

    test('should execute run_command tool', async () => {
        // 1. Run the command
        const runResult: any = await client.callTool({
            name: 'run_command',
            arguments: {
                command: 'echo hello'
            }
        });

        assert.ok(runResult);
        assert.ok(runResult.content);
        assert.strictEqual(runResult.content[0].type, 'text');
        // Expect confirmation message instead of output
        assert.ok(runResult.content[0].text.includes('Command sent to session'));

        // 2. Wait for execution
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Read output
        const readResult: any = await client.callTool({
            name: 'read_terminal_output',
            arguments: {
                session_id: 'default'
            }
        });

        assert.ok(readResult);
        assert.ok(readResult.content);
        // The output should contain 'hello'
        assert.ok(readResult.content[0].text.includes('hello'));
    });
});
