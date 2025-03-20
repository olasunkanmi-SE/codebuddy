export const updateStyles = (data: string) => {
  const styleElement = document.createElement("style");
  styleElement.id = "dynamic-chat-css";
  styleElement.innerHTML = data;
  document.head.appendChild(styleElement);
  console.log("Updating extension css style.");
};
