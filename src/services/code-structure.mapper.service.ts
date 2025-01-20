import {
  ICodeClass,
  ICodeEntry,
  ICodeMap,
  IFunctionData,
  IMappedCode,
  IMappedFunction,
} from "../application/interfaces";
import { Logger } from "../infrastructure/logger/logger";

/**
 * CodeMapper class responsible for transforming code structure into a simplified format
 */
export class CodeStructureMapper {
  private readonly code: ICodeMap;
  private readonly logger: Logger;

  /**
   * Creates an instance of CodeMapper
   * @param code - Object containing code structure information
   */
  constructor(code: ICodeMap) {
    this.code = code;
    this.logger = new Logger("CodeRepository");
  }

  /**
   * Maps the code structure to a simplified format
   * @returns Mapped code structure with simplified format
   */
  public map(): IMappedCode[] {
    try {
      return Object.values(this.code).map((value) => {
        const primaryClass = value.classes[0];
        const mappedFunctions = this.getMappedFunctions(value, primaryClass);
        return {
          path: value.path,
          functions: mappedFunctions,
          className: primaryClass ? primaryClass.name : "",
          dependencies: value.dependencies,
        };
      });
    } catch (error) {
      this.logger.error("Error mapping code structure:", error);
      throw error;
    }
  }

  /**
   * Maps functions from either a CodeEntry's direct functions or its primary class functions.
   * @param codeEntry - The code entry containing functions or a primary class
   * @param primaryClass - The primary class containing functions
   * @returns Array of mapped functions
   */
  private getMappedFunctions(
    codeEntry: ICodeEntry,
    primaryClass: ICodeClass | null,
  ): IMappedFunction[] {
    try {
      const sourceFunctions = this.getSourceFunctions(codeEntry, primaryClass);
      if (!sourceFunctions) {
        this.logger.info("Class doesnt have functions");
        return [];
      }
      return this.mapFunctions(sourceFunctions, codeEntry);
    } catch (error) {
      this.logger.error("Error getting mapped functions:", error);
      throw error;
    }
  }

  /**
   * Determines the source functions to map based on code entry and primary class.
   * @param codeEntry - The code entry containing functions
   * @param primaryClass - The primary class containing functions
   * @returns Array of source functions to be mapped
   */
  private getSourceFunctions(
    codeEntry: ICodeEntry,
    primaryClass: ICodeClass | null,
  ): IMappedFunction[] | undefined {
    try {
      return (codeEntry.functions?.length ?? 0) > 0
        ? codeEntry.functions
        : primaryClass?.functions ?? [];
    } catch (error) {
      this.logger.error("Error getting source functions:", error);
      throw error;
    }
  }

  /**
   * Maps direct functions with additional metadata
   * @param functions - Array of direct functions
   * @returns Mapped functions with metadata
   * @private
   */
  private mapFunctions(
    functions: IMappedFunction[],
    codeEntry?: ICodeEntry,
  ): IMappedFunction[] {
    try {
      return functions.map((func) => ({
        name: func.name,
        comment: func.comments ?? "",
        description: "",
        parameters: func.parameters ?? [],
        returnType: func.returnType,
        content: (func.content ?? "").replace(/\s+/g, ""),
        compositeText: this.createCompositeText(
          func,
          codeEntry?.dependencies && codeEntry?.dependencies.length > 0
            ? codeEntry.dependencies
            : undefined,
        ),
      }));
    } catch (error) {
      this.logger.error("Error mapping functions:", error);
      throw error;
    }
  }

  private createCompositeText(
    functionProps: IMappedFunction,
    dependencies: string[] = [],
  ): string {
    if (!this.createDescriptionText(functionProps)) {
      return "";
    }
    return [
      this.createDescriptionText(functionProps),
      this.createFunctionSignature(functionProps),
      this.createDependenciesText(dependencies),
    ]
      .filter(Boolean)
      .join(" ");
  }

  private createDescriptionText(functionProps: IMappedFunction): string {
    return functionProps?.comments
      ? `Description: ${functionProps.comments}`
      : "";
  }

  private createFunctionSignature(functionProps: IMappedFunction): string {
    const returnTypeSection = functionProps.returnType
      ? `: ${functionProps.returnType}`
      : "";

    return `Function: ${functionProps.name}${returnTypeSection}`;
  }

  private createDependenciesText(dependencies: string[]): string {
    return dependencies.length
      ? `Dependencies: ${dependencies.join(", ")}`
      : "";
  }

  normalizeData(): Partial<IFunctionData>[] {
    const data: IMappedCode[] = this.map();
    const normalizedData = data.map((entry) => {
      return entry.functions?.map((func) => ({
        className: entry.className,
        path: entry.path,
        name: func.name,
        description: func.description,
        compositeText: func.compositeText,
        content: func.content,
        returnType: func.returnType,
        dependencies: entry.dependencies,
      }));
    });
    return normalizedData.flatMap((entry) => entry ?? []);
  }
}
