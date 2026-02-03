/**
 * Simple HTML sanitizer for LLM outputs
 * Removes potentially dangerous HTML elements while preserving markdown-like formatting
 */
export class LLMOutputSanitizer {
  private static readonly ALLOWED_TAGS = new Set([
    "p",
    "br",
    "strong",
    "em",
    "i",
    "b",
    "u",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "span",
    "div",
  ]);

  private static readonly DANGEROUS_ATTRIBUTES = new Set([
    "onload",
    "onclick",
    "onmouseover",
    "onmouseout",
    "onfocus",
    "onblur",
    "onchange",
    "onsubmit",
    "onreset",
    "onselect",
    "onerror",
    "onabort",
    "javascript:",
    "vbscript:",
    "data:",
    "file:",
  ]);

  /**
   * Sanitize HTML content from LLM outputs
   * @param htmlContent - The HTML content to sanitize
   * @returns Sanitized HTML content
   */
  public static sanitize(htmlContent: string): string {
    if (!htmlContent) return "";

    // First, escape any script tags completely
    htmlContent = htmlContent.replace(/<script[\s\S]*?<\/script>/gi, "");
    htmlContent = htmlContent.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
    htmlContent = htmlContent.replace(/<object[\s\S]*?<\/object>/gi, "");
    htmlContent = htmlContent.replace(/<embed[\s\S]*?>/gi, "");
    htmlContent = htmlContent.replace(/<form[\s\S]*?<\/form>/gi, "");

    // Remove dangerous event handlers and protocols
    for (const dangerous of this.DANGEROUS_ATTRIBUTES) {
      const regex = new RegExp(dangerous, "gi");
      htmlContent = htmlContent.replace(regex, "");
    }

    // Remove style attributes that could contain malicious CSS
    htmlContent = htmlContent.replace(/style\s*=\s*["'][^"']*["']/gi, "");

    // Sanitize href attributes to only allow safe protocols
    htmlContent = htmlContent.replace(
      /href\s*=\s*["']([^"']*)["']/gi,
      (match, url) => {
        if (
          url.startsWith("http://") ||
          url.startsWith("https://") ||
          url.startsWith("#") ||
          url.startsWith("/")
        ) {
          return match;
        }
        return 'href="#"'; // Replace dangerous URLs with safe anchor
      },
    );

    return htmlContent;
  }

  /**
   * Sanitize plain text content that might contain markdown
   * @param textContent - The text content to sanitize
   * @returns Sanitized text content
   */
  public static sanitizeText(textContent: string): string {
    if (!textContent) return "";

    // Escape HTML entities
    return textContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Sanitize markdown content before conversion to HTML
   * @param markdownContent - The markdown content to sanitize
   * @returns Sanitized markdown content
   */
  public static sanitizeMarkdown(markdownContent: string): string {
    if (!markdownContent) return "";

    // Remove potentially dangerous markdown elements
    markdownContent = markdownContent.replace(
      /\[.*?\]\(javascript:.*?\)/gi,
      "",
    );
    markdownContent = markdownContent.replace(/\[.*?\]\(data:.*?\)/gi, "");
    markdownContent = markdownContent.replace(/\[.*?\]\(vbscript:.*?\)/gi, "");

    // Remove HTML script tags that might be embedded in markdown
    markdownContent = markdownContent.replace(
      /<script[\s\S]*?<\/script>/gi,
      "",
    );
    markdownContent = markdownContent.replace(
      /<iframe[\s\S]*?<\/iframe>/gi,
      "",
    );

    return markdownContent;
  }

  /**
   * Comprehensive sanitization for LLM outputs that may contain mixed content
   * @param content - The content to sanitize
   * @param isHtml - Whether the content is HTML or markdown/text
   * @returns Sanitized content
   */
  public static sanitizeLLMOutput(content: string, isHtml = false): string {
    if (!content) return "";

    if (isHtml) {
      return this.sanitize(content);
    } else {
      // For markdown/text content, sanitize markdown first
      const sanitizedMarkdown = this.sanitizeMarkdown(content);
      return sanitizedMarkdown;
    }
  }
}
