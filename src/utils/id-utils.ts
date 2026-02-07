import * as crypto from "crypto";

export const generateId = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const generateUUID = () => {
  return crypto.randomUUID();
};

export const getNonce = () => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
