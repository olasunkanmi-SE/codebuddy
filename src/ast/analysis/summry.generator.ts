/**
 * Summary Generator
 *
 * Generates formatted text summaries of analysis results.
 */

import * as path from "path";
import { IAnalysisOutput, ICodeElement } from "../query-types";
import { LinkGenerator } from "../../services/link-generator";

export class SummaryGenerator {
  /**
   * Generates a complete analysis summary with clickable links
   */
  generate(analysis: IAnalysisOutput, workspaceRoot: string): string {
    let summary = this.generateHeader();
    summary += this.generateSummaryStats(analysis);
    summary += this.generateFileDetails(analysis, workspaceRoot);
    summary += this.generateFooter(analysis);

    return summary;
  }

  /**
   * Generates the header section
   */
  private generateHeader(): string {
    return `Authentication Analysis Results\n${"=".repeat(50)}\n\n`;
  }

  /**
   * Generates summary statistics
   */
  private generateSummaryStats(analysis: IAnalysisOutput): string {
    let summary = `Summary:\n`;
    summary += `  Total Elements: ${analysis.summary.totalElements}\n`;
    summary += `  Files Analyzed: ${analysis.summary.fileCount}\n`;
    summary += `  Elements by Type:\n`;

    for (const [type, count] of Object.entries(
      analysis.summary.elementsByType,
    )) {
      summary += `    ${type}: ${count}\n`;
    }

    summary += `\n${"=".repeat(50)}\n\n`;
    return summary;
  }

  /**
   * Generates detailed file information
   */
  private generateFileDetails(
    analysis: IAnalysisOutput,
    workspaceRoot: string,
  ): string {
    let details = "";

    for (const file of analysis.files) {
      details += `File: ${file.relativePath}\n`;
      details += `  ${LinkGenerator.createFileIconLink(file.path)}\n`;
      details += `${"-".repeat(50)}\n`;

      for (const element of file.elements) {
        details += this.generateElementDetails(element, file.elements);
      }

      details += "\n";
    }

    return details;
  }

  /**
   * Generates details for a single code element
   */
  private generateElementDetails(
    element: ICodeElement,
    allElements: ICodeElement[],
  ): string {
    let details = `  [${element.type.toUpperCase()}] ${element.name}\n`;

    // Add parent information
    if (element.parent) {
      const parentElement = allElements.find((e) => e.id === element.parent);
      if (parentElement) {
        details += `    Parent: ${parentElement.type} ${parentElement.name}\n`;
      }
    }

    // Add location link
    details += `    ${LinkGenerator.createLocationIconLink(element.filePath, element.startPosition)}\n`;

    // Add code snippet
    const ext = path.extname(element.filePath).slice(1) || "text";
    details += `    Snippet:\n\`\`\`${ext}\n${element.codeSnippet}\n\`\`\`\n\n`;

    // Add child methods
    if (element.children && element.children.length > 0) {
      details += `    Child Methods:\n`;
      for (const child of element.children) {
        const childLink = LinkGenerator.createLinkFromPosition(
          child.filePath,
          child.startPosition,
        );
        details += `      - ${child.name} (${childLink})\n`;
      }
      details += "\n";
    }

    return details;
  }

  /**
   * Generates the footer section
   */
  private generateFooter(analysis: IAnalysisOutput): string {
    let footer = "=".repeat(50) + "\n";
    footer += `Analysis complete. ${analysis.summary.totalElements} elements identified `;
    footer += `across ${analysis.summary.fileCount} files.\n\n`;
    footer +=
      "💡 Tip: Click on any file path or location link above to jump to that code!\n";

    return footer;
  }

  /**
   * Generates a compact summary (for notifications)
   */
  generateCompact(analysis: IAnalysisOutput): string {
    return (
      `Analysis complete. Found ${analysis.summary.totalElements} ` +
      `authentication-related elements across ${analysis.summary.fileCount} files. ` +
      `See "CodeBuddy Analysis" output channel for details.`
    );
  }

  /**
   * Generates a JSON summary (for LLM integration)
   */
  generateJSON(analysis: IAnalysisOutput): string {
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Generates a markdown summary
   */
  generateMarkdown(analysis: IAnalysisOutput, workspaceRoot: string): string {
    let md = "# Authentication Analysis Results\n\n";

    md += "## Summary\n\n";
    md += `- **Total Elements**: ${analysis.summary.totalElements}\n`;
    md += `- **Files Analyzed**: ${analysis.summary.fileCount}\n\n`;

    md += "### Elements by Type\n\n";
    for (const [type, count] of Object.entries(
      analysis.summary.elementsByType,
    )) {
      md += `- **${type}**: ${count}\n`;
    }

    md += "\n## Detailed Results\n\n";

    for (const file of analysis.files) {
      md += `### ${file.relativePath}\n\n`;

      for (const element of file.elements) {
        md += `#### ${element.type}: ${element.name}\n\n`;
        md += `**Location**: Line ${element.startPosition.row + 1}\n\n`;

        const ext = path.extname(file.path).slice(1) || "text";
        md += `\`\`\`${ext}\n${element.codeSnippet}\n\`\`\`\n\n`;
      }
    }

    return md;
  }
}
