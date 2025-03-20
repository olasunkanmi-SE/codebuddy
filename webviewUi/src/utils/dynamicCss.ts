export const updateStyles = (data: string) => {
  const styleId = "dynamic-chat-css";
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  if (styleElement) {
    return;
  } else {
    styleElement = document.createElement("style");
    styleElement.id = "dynamic-chat-css";
    styleElement.innerHTML = data;
    document.head.appendChild(styleElement);
    console.log("Updating extension css style.");
  }
};
