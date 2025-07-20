import { BaseAnalysisStrategy } from "./base-analysis-strategy";
import * as ts from "typescript";

interface IDataModel {
  name: string;
  file: string;
  properties: { name: string; type: string; optional: boolean }[];
  relationships: string[];
  decorators: string[];
}

export class DataModelStrategy extends BaseAnalysisStrategy {
  constructor() {
    super("DataModel");
  }

  async analyze(files: string[]): Promise<IDataModel[]> {
    this.logger.info("Starting data model analysis...");

    const models: IDataModel[] = [];
    const relevantFiles = this.filterRelevantFiles(files);

    // Process files in batches
    const batchSize = 15;
    for (let i = 0; i < relevantFiles.length; i += batchSize) {
      const batch = relevantFiles.slice(i, i + batchSize);
      const batchModels = await Promise.all(
        batch.map((file) => this.analyzeFileForModels(file)),
      );
      models.push(...batchModels.flat());
    }

    this.logger.info(`Found ${models.length} data models`);
    return models;
  }

  private filterRelevantFiles(files: string[]): string[] {
    const patterns = [
      /model/i,
      /entity/i,
      /dto/i,
      /interface/i,
      /type/i,
      /schema/i,
    ];

    const extensions = [".ts", ".js"];

    return files.filter((file) => {
      const hasRelevantExtension = extensions.some((ext) => file.endsWith(ext));
      const hasRelevantPattern = patterns.some((pattern) => pattern.test(file));
      const isNotTest = !file.includes("test") && !file.includes("spec");

      return (
        hasRelevantExtension &&
        (hasRelevantPattern || file.includes("src/")) &&
        isNotTest
      );
    });
  }

  private async analyzeFileForModels(filePath: string): Promise<IDataModel[]> {
    const content = await this.readFileContent(filePath);
    if (!content) {
      return [];
    }

    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
      );

      const models: IDataModel[] = [];
      this.visitNodeForModels(sourceFile, models, filePath);

      return models;
    } catch (error) {
      this.logger.warn(`Failed to parse TypeScript file ${filePath}`, error);
      return [];
    }
  }

  private visitNodeForModels(
    node: ts.Node,
    models: IDataModel[],
    filePath: string,
  ): void {
    // Look for class declarations
    if (ts.isClassDeclaration(node)) {
      const model = this.extractClassModel(node, filePath);
      if (model) {
        models.push(model);
      }
    }

    // Look for interface declarations
    if (ts.isInterfaceDeclaration(node)) {
      const model = this.extractInterfaceModel(node, filePath);
      if (model) {
        models.push(model);
      }
    }

    // Look for type aliases
    if (ts.isTypeAliasDeclaration(node)) {
      const model = this.extractTypeAliasModel(node, filePath);
      if (model) {
        models.push(model);
      }
    }

    ts.forEachChild(node, (child) =>
      this.visitNodeForModels(child, models, filePath),
    );
  }

  private extractClassModel(
    node: ts.ClassDeclaration,
    filePath: string,
  ): IDataModel | null {
    const name = node.name?.getText();
    if (!name) {
      return null;
    }

    const properties = this.extractClassProperties(node);
    const decorators = this.extractClassDecorators(node);
    const relationships = this.extractRelationships(node);

    return {
      name,
      file: filePath,
      properties,
      relationships,
      decorators,
    };
  }

  private extractInterfaceModel(
    node: ts.InterfaceDeclaration,
    filePath: string,
  ): IDataModel | null {
    const name = node.name.getText();
    const properties = this.extractInterfaceProperties(node);
    const relationships = this.extractInterfaceRelationships(node);

    return {
      name,
      file: filePath,
      properties,
      relationships,
      decorators: [],
    };
  }

  private extractTypeAliasModel(
    node: ts.TypeAliasDeclaration,
    filePath: string,
  ): IDataModel | null {
    const name = node.name.getText();

    // Only process object type aliases
    if (!ts.isTypeLiteralNode(node.type)) {
      return null;
    }

    const properties = this.extractTypeProperties(node.type);

    return {
      name,
      file: filePath,
      properties,
      relationships: [],
      decorators: [],
    };
  }

  private extractClassProperties(
    node: ts.ClassDeclaration,
  ): { name: string; type: string; optional: boolean }[] {
    const properties: { name: string; type: string; optional: boolean }[] = [];

    node.members.forEach((member) => {
      if (ts.isPropertyDeclaration(member) && member.name) {
        const name = member.name.getText();
        const type = member.type ? member.type.getText() : "any";
        const optional = !!member.questionToken;

        properties.push({ name, type, optional });
      }
    });

    return properties;
  }

  private extractInterfaceProperties(
    node: ts.InterfaceDeclaration,
  ): { name: string; type: string; optional: boolean }[] {
    const properties: { name: string; type: string; optional: boolean }[] = [];

    node.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name) {
        const name = member.name.getText();
        const type = member.type ? member.type.getText() : "any";
        const optional = !!member.questionToken;

        properties.push({ name, type, optional });
      }
    });

    return properties;
  }

  private extractTypeProperties(
    node: ts.TypeLiteralNode,
  ): { name: string; type: string; optional: boolean }[] {
    return this.extractPropertiesFromMembers(node.members);
  }

  private extractPropertiesFromMembers(
    members: ts.NodeArray<ts.TypeElement>,
  ): { name: string; type: string; optional: boolean }[] {
    const properties: { name: string; type: string; optional: boolean }[] = [];

    members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name) {
        const name = member.name.getText();
        const type = member.type ? member.type.getText() : "any";
        const optional = !!member.questionToken;

        properties.push({ name, type, optional });
      }
    });

    return properties;
  }

  private extractClassDecorators(node: ts.ClassDeclaration): string[] {
    const decorators = ts.getDecorators(node);
    if (!decorators) {
      return [];
    }

    return decorators.map((decorator) => {
      if (ts.isCallExpression(decorator.expression)) {
        return decorator.expression.expression.getText();
      }
      return decorator.expression.getText();
    });
  }

  private extractRelationships(node: ts.ClassDeclaration): string[] {
    const relationships: string[] = [];
    const relationshipPattern = /^[A-Z][a-zA-Z]*$/;

    node.members.forEach((member) => {
      if (ts.isPropertyDeclaration(member) && member.type) {
        const typeText = member.type.getText();

        // Look for common relationship patterns
        if (typeText.includes("[]") || typeText.includes("Array")) {
          relationships.push(`hasMany: ${typeText}`);
        } else if (relationshipPattern.exec(typeText)) {
          relationships.push(`hasOne: ${typeText}`);
        }
      }
    });

    return relationships;
  }

  private extractInterfaceRelationships(
    node: ts.InterfaceDeclaration,
  ): string[] {
    const relationships: string[] = [];
    const relationshipPattern = /^[A-Z][a-zA-Z]*$/;

    node.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.type) {
        const typeText = member.type.getText();

        if (typeText.includes("[]") || typeText.includes("Array")) {
          relationships.push(`hasMany: ${typeText}`);
        } else if (relationshipPattern.exec(typeText)) {
          relationships.push(`hasOne: ${typeText}`);
        }
      }
    });

    return relationships;
  }
}
