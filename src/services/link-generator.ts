/**
 * Link Generator
 *
 * Generates clickable file links for VS Code output channels.
 */

import { IPosition } from "../ast/query-types";

export class LinkGenerator {
  /**
   * Creates a clickable file link in VS Code's file:line:column format
   */
  static createFileLink(
    filePath: string,
    line: number,
    column: number = 0,
  ): string {
    return `${filePath}:${line + 1}:${column + 1}`;
  }

  /**
   * Creates a link from a Position object
   */
  static createLinkFromPosition(filePath: string, position: IPosition): string {
    return this.createFileLink(filePath, position.row, position.column);
  }

  /**
   * Creates a formatted link with a label
   */
  static createLabeledLink(
    filePath: string,
    position: IPosition,
    label: string,
  ): string {
    const link = this.createLinkFromPosition(filePath, position);
    return `${label} (${link})`;
  }

  /**
   * Creates a file icon with link
   */
  static createFileIconLink(filePath: string): string {
    return `📂 ${this.createFileLink(filePath, 0)}`;
  }

  /**
   * Creates a location icon with link
   */
  static createLocationIconLink(filePath: string, position: IPosition): string {
    return `📍 Location: ${this.createLinkFromPosition(filePath, position)}`;
  }
}
