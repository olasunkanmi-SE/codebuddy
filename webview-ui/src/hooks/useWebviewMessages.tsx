import { useEffect, useState } from "react";

export const useWebviewMessages = () => {
  const [forceUpdate, setForceUpdate] = useState(false);
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "updateStyles") {
        const { chatCss } = event.data.payload;

        // Inject the new styles
        const existingStyle = document.getElementById("dynamic-chat-css");
        if (existingStyle) {
          existingStyle.remove();
        }

        const styleElement = document.createElement("style");
        styleElement.id = "dynamic-chat-css";
        styleElement.innerHTML = chatCss;
        document.head.appendChild(styleElement);

        // Trigger a re-render
        setForceUpdate(() => !forceUpdate);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
};
