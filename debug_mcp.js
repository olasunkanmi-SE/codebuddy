const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist/MCP/server.js');
console.log(`Spawning server: ${serverPath}`);

const server = spawn('node', [serverPath], {
  env: { ...process.env, CODEBUDDY_MCP_SERVER: 'true' }
});

server.stdout.on('data', (data) => {
  const str = data.toString();
  console.log(`STDOUT: ${JSON.stringify(str)}`);
  // Check if it's valid JSON-RPC
  try {
    JSON.parse(str);
    console.log("STDOUT is valid JSON");
  } catch (e) {
    console.log("STDOUT is NOT valid JSON");
  }
});

server.stderr.on('data', (data) => {
  console.log(`STDERR: ${data.toString()}`);
});

server.on('close', (code) => {
  console.log(`Exited with code ${code}`);
});

// Send initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'debug-client', version: '1.0.0' }
  }
};

setTimeout(() => {
    console.log("Sending initialize request...");
    server.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

setTimeout(() => {
    console.log("Closing...");
    server.kill();
}, 5000);
