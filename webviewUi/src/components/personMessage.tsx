import React from "react";
import "./personMessage.css";

interface MessageProps {
  message: string;
}

export const UserMessage: React.FC<MessageProps> = ({ message }) => {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
      <div className="message-container user-message" style={{ flexDirection: "row-reverse" }}>
        <div className="message-content" style={{ textAlign: "left" }}>{message}</div>
      </div>
    </div>
  );
};
