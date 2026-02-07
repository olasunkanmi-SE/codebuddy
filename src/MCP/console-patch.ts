// Override console methods to protect stdio transport
// This must be the first import in the entry point to ensure all subsequent
// imports and code use the overridden methods.

// Redirect log/info/warn to stderr so they don't corrupt stdout (used for JSON-RPC)
console.log = (...args: any[]) => {
  console.error(...args);
};

console.info = (...args: any[]) => {
  console.error(...args);
};

console.warn = (...args: any[]) => {
  console.error(...args);
};

// console.error already writes to stderr, so it's safe.
// We don't need to override it, but we can if we want to add a prefix.
// For now, leaving it as is is fine.

export {};
