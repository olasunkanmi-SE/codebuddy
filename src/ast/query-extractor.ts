import {
  Query,
  Tree,
  TreeCursor,
  Point,
  QueryMatch,
  Node,
} from "web-tree-sitter";
import { languageConfigs } from "./language-config";
import { QueryExecutor } from "./query-executor";
import { ICodeElement, IParsedFile } from "./query-types";
import { generateId } from "../utils/utils";

export class LairExtractor {
  private readonly queryExecutor: QueryExecutor;
  private static Elements: ICodeElement[] = [];
  private static ClassMap = new Map<Node, ICodeElement>();
  private static instance: LairExtractor;

  constructor() {
    this.queryExecutor = QueryExecutor.getInstance();
  }

  static getInstance() {
    return (LairExtractor.instance ??= new LairExtractor());
  }

  async extract(parsedFile: IParsedFile): Promise<ICodeElement[]> {
    const { tree, language, content, filePath } = parsedFile;
    const config = languageConfigs[language];

    if (!config) {
      return [];
    }

    if (config.queries.classDefinitions) {
      this.classExtractor(
        tree,
        language,
        config.queries.classDefinitions,
        filePath,
        content,
      );
    }

    if (config.queries.methodDefinitions) {
      this.methodExtractor(
        tree,
        language,
        config.queries.methodDefinitions,
        filePath,
        content,
      );
    }

    if (config.queries.functionDefinitions) {
      this.functionExtractor(
        tree,
        language,
        config.queries.functionDefinitions,
        filePath,
        content,
      );
    }

    return LairExtractor.Elements;
  }

  private classExtractor(
    tree: Tree,
    language: string,
    query: string,
    filePath: string,
    content: string,
  ) {
    const classMatches: QueryMatch[] = this.queryExecutor.execute(
      tree,
      language,
      "class",
      query,
    );
    for (const match of classMatches) {
      const nameNode = match.captures.find((c) => c.name === "name")?.node;
      const classNode = match.captures.find((c) =>
        c.name.endsWith(".definition"),
      )?.node;

      if (nameNode && classNode) {
        const classElement = this.addElement(
          classNode,
          "class",
          nameNode.text,
          filePath,
          content,
        );
        if (classElement) {
          LairExtractor.ClassMap.set(classNode, classElement);
        }
      }
    }
  }

  private functionExtractor(
    tree: Tree,
    language: string,
    query: string,
    filePath: string,
    content: string,
  ) {
    const functionMatches: QueryMatch[] = this.queryExecutor.execute(
      tree,
      language,
      "function",
      query,
    );

    for (const match of functionMatches) {
      const nameNode = match.captures.find((c) => c.name === "name")?.node;
      const functionNode = match.captures.find((c) =>
        c.name.endsWith(".definition"),
      )?.node;

      if (nameNode && functionNode) {
        this.addElement(
          functionNode,
          "function",
          nameNode.text,
          filePath,
          content,
        );
      }
    }
  }

  filterByType(
    elements: ICodeElement[],
    type: ICodeElement["type"],
  ): ICodeElement[] {
    return elements.filter((el) => el.type === type);
  }

  filterByKeyWords(
    elements: ICodeElement[],
    keywords: string[],
  ): ICodeElement[] {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    return elements.filter((e) =>
      lowerKeywords.some(
        (k) =>
          e.name.toLowerCase().includes(k) ||
          e.codeSnippet.toLowerCase().includes(k),
      ),
    );
  }

  private methodExtractor(
    tree: Tree,
    language: string,
    query: string,
    filePath: string,
    content: string,
  ) {
    const methodMatches: QueryMatch[] = this.queryExecutor.execute(
      tree,
      language,
      "method",
      query,
    );

    for (const match of methodMatches) {
      const nameNode = match.captures.find((c) => c.name === "name")?.node;
      const methodNode = match.captures.find((c) =>
        c.name.endsWith(".definition"),
      )?.node;
      if (nameNode && methodNode) {
        let parentClassNode: Node | null = methodNode.parent;
        let parentClassElement: ICodeElement | undefined;

        while (parentClassNode && parentClassNode !== tree.rootNode) {
          if (LairExtractor.ClassMap.has(parentClassNode)) {
            parentClassElement = LairExtractor.ClassMap.get(parentClassNode);
            break;
          }
          parentClassNode = parentClassNode.parent;
        }

        if (parentClassElement) {
          const methodElement = this.addElement(
            methodNode,
            "method",
            nameNode.text,
            filePath,
            content,
            parentClassElement.id,
          );
          if (methodElement) {
            parentClassElement.children?.push(methodElement);
          }
        } else {
          this.addElement(
            methodNode,
            "function",
            nameNode.text,
            filePath,
            content,
          );
        }
      }
    }
  }

  private addElement = (
    node: any,
    type: ICodeElement["type"],
    name: string,
    filePath: string,
    content: string,
    parentId?: string,
  ): ICodeElement | null => {
    const processNodes = new Set<string>();
    const nodeKey = `${node.startIndex}-${node.endIndex}-${type}`;
    if (processNodes.has(nodeKey)) {
      return null;
    }
    processNodes.add(nodeKey);
    const newElement: ICodeElement = {
      id: generateId(),
      type,
      name,
      filePath,
      startPosition: node.startPosition,
      endPosition: node.endPosition,
      codeSnippet: content.substring(node.startIndex, node.endIndex),
      parent: parentId,
      children: [],
    };

    LairExtractor.Elements.push(newElement);
    return newElement;
  };

  getAllChildren(element: ICodeElement): ICodeElement[] {
    const children: ICodeElement[] = [];
    if (element.children) {
      for (const child of element.children) {
        children.push(child);
        children.push(...this.getAllChildren(child));
      }
    }
    return children;
  }

  findById(elements: ICodeElement[], id: string): ICodeElement | undefined {
    for (const element of elements) {
      if (element.id === id) {
        return element;
      }
      if (element.children) {
        const found = this.findById(element.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }
}
