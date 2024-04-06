import * as markdownit from "markdown-it";

export const formatText = (text: string): string => {
  const md = markdownit();
  return md.render(text);
};
