(async () => {
  try {
    const clientModule = await import("@modelcontextprotocol/sdk/client/index.js");
    console.log("clientModule exports:", Object.keys(clientModule));
    const { Client } = clientModule;

    // Try several transport entrypoints from SDK
    let transport = null;
    try {
      const sseModule = await import("@modelcontextprotocol/sdk/client/sse.js");
      console.log("sseModule exports:", Object.keys(sseModule));
      const Sse = sseModule.SseClientTransport ?? sseModule.SseTransport ?? sseModule.default ?? null;
      if (Sse) transport = new Sse({ url: "http://localhost:9000/sse" });
    } catch (e) {
      console.warn("sse import failed", e?.message ?? e);
    }

    if (!transport) {
      // Fallback to stdio transport (may spawn process)
      const stdioModule = await import("@modelcontextprotocol/sdk/client/stdio.js");
      console.log("stdioModule exports:", Object.keys(stdioModule));
      const Stdio = stdioModule.StdioClientTransport ?? stdioModule.default ?? null;
      if (!Stdio) throw new Error("No suitable transport found in SDK");
      transport = new Stdio({ command: "docker", args: ["mcp", "gateway", "run"] });
    }

    const client = new Client({ name: "probe", version: "1.0.0" }, {});
    if (transport.onerror) transport.onerror = (e) => console.error("transport error", e);
    if (transport.onclose) transport.onclose = () => console.warn("transport closed");

    await client.connect(transport);
    console.log("connected");
    const tools = await client.listTools();
    console.log(
      "tools:",
      tools.tools.map((t) => t.name),
    );

    // attempt to call resolve-library-id if present
    const hasResolve = tools.tools.some((t) => t.name === "resolve-library-id");
    if (hasResolve) {
      console.log("Calling resolve-library-id (dry)");
      try {
        const res = await client.callTool({ name: "resolve-library-id", arguments: { library: "" } });
        console.log("resolve-library-id result:", res);
      } catch (err) {
        console.error("resolve-library-id call error", err);
      }
    } else {
      console.log("resolve-library-id not present");
    }

    // call mcp-add to observe behavior
    const hasAdd = tools.tools.some((t) => t.name === "mcp-add");
    if (hasAdd) {
      console.log("Calling mcp-add with harmless args");
      try {
        const res = await client.callTool({ name: "mcp-add", arguments: { activate: false, name: "docker" } });
        console.log("mcp-add result:", res);
      } catch (err) {
        console.error("mcp-add call error", err);
      }
    } else {
      console.log("mcp-add not present");
    }

    try {
      await client.close();
    } catch (e) {}
    process.exit(0);
  } catch (e) {
    console.error("probe failed", e);
    process.exit(1);
  }
})();
