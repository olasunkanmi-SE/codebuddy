import React from "react";
import { UserMessage } from "./personMessage";

export const UserMessageTest: React.FC = () => {
  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ color: "var(--vscode-foreground)", marginBottom: "20px" }}>
        User Message Component Test - Simplified
      </h2>

      <UserMessage
        message="Hello! This is a test message from the user with the new simplified design that has a subtle background."
        alias="John Doe"
      />

      <UserMessage
        message="This is a longer message that might span multiple lines. The design now focuses on simplicity with just a nice background that blends with the VS Code theme."
        alias="Jane Smith"
      />

      <UserMessage message="Short message." alias="A" />

      <UserMessage message="This message has no alias set, so it should show the default 'U' avatar." />

      <UserMessage
        message="The simplified design is clean and focuses on readability while maintaining the VS Code aesthetic."
        alias="Test User"
      />
    </div>
  );
};
