import React from "react";

interface MessageProps {
  message: string;
  alias?: string;
}

export const UserMessage: React.FC<MessageProps> = ({ message, alias }) => {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
      <div className="message-container user-message" style={{ flexDirection: "row-reverse" }}>
        <div className="avatar-container">
          <div className="avatar">{alias || "U"}</div>
        </div>
        <div className="message-content" style={{ textAlign: "left" }}>{message}</div>
      </div>
    </div>
  );
};
