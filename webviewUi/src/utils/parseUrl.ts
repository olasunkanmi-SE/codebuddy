export interface IParseURL {
  url: string;
  favicon: string;
  title: string;
}

export const parseUrl = (htmlString: string): IParseURL[] => {
  try {
    const parser: DOMParser = new DOMParser();
    const doc: Document = parser.parseFromString(htmlString, "text/html");
    const pTags: HTMLCollectionOf<HTMLParagraphElement> =
      doc.getElementsByTagName("p");
    const result: IParseURL[] = Array.from(pTags).map((tag) => {
      return JSON.parse(tag.textContent ?? "");
    });
    return result;
  } catch (error) {
    console.error("Error parsing urls", error);
    throw error;
  }
};
