import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

async function main() {
  console.log("Starting MCP Server verification...");

  const serverPath = path.join(__dirname, "server.ts");
  console.log(`Server path: ${serverPath}`);

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["ts-node", serverPath],
    env: { ...process.env, CODEBUDDY_DISABLE_FILE_LOGGING: "true" },
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  try {
    console.log("Connecting to server...");
    await client.connect(transport);
    console.log("Connected!");

    console.log("Listing tools...");
    const tools = await client.listTools();
    console.log(
      "Tools found:",
      tools.tools.map((t) => t.name),
    );

    if (tools.tools.length > 0) {
      console.log("Verification SUCCESS");
    } else {
      console.log("Verification FAILED: No tools found");
    }
  } catch (error) {
    console.error("Verification FAILED with error:", error);
  } finally {
    await client.close();
  }
}

main();
