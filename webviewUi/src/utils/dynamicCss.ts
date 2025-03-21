export const updateStyles = (data: string) => {
  const styleId = "dynamic-chat-css";
  const styleElement = document.createElement("style");
  styleElement.id = styleId;
  styleElement.innerHTML = data;
  document.head.appendChild(styleElement);
};
