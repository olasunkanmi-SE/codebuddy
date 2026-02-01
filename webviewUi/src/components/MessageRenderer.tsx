import React, { useMemo } from "react";
import { BotMessage } from "./botMessage";
import SearchResultCard from "./SearchResultCard";
import CodeAnalysisCard from "./CodeAnalysisCard";
import ErrorCard from "./ErrorCard";

interface Source {
  title: string;
  url?: string;
  snippet?: string;
  relevance?: number;
}

interface SynthesizedSearch {
  type: "synthesized_search";
  query: string;
  answer?: string;
  sources: Source[];
}

interface CodeAnalysis {
  type: "code_analysis";
  title: string;
  summary: string;
  files: Array<{ path: string; lineCount?: number }>;
  keyPoints?: string[];
}

type StructuredContent = SynthesizedSearch | CodeAnalysis;

interface MessageRendererProps {
  content: string;
  language?: string;
  isStreaming?: boolean;
}

/**
 * Attempts to detect and parse structured content from message
 */
function parseStructuredContent(content: string): StructuredContent | null {
  // Try to find JSON block in the content
  try {
    // First: check if entire content is JSON
    const parsed = JSON.parse(content);
    if (parsed.type === "synthesized_search" || parsed.type === "code_analysis") {
      return parsed as StructuredContent;
    }
  } catch {
    // Not pure JSON, continue checking
  }

  // Look for embedded JSON in markdown code blocks
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]);
      if (parsed.type === "synthesized_search" || parsed.type === "code_analysis") {
        return parsed as StructuredContent;
      }
    } catch {
      // Invalid JSON in block
    }
  }

  // Check for search result patterns in plain text
  const sourcePattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const sources: Source[] = [];
  let match;
  while ((match = sourcePattern.exec(content)) !== null) {
    sources.push({ title: match[1], url: match[2] });
  }

  // If we found multiple sources, treat as search results
  if (sources.length >= 2) {
    const queryMatch = content.match(/Search Results for: ["'](.+?)["']/i) ||
                       content.match(/searching.*for[:\s]+["']?([^"'\n]+)/i);
    
    // Extract answer (text before the sources section)
    const answerMatch = content.match(/^([\s\S]*?)(?:\*\*Sources?\*\*|##\s*Sources?|\n-\s*\[)/i);
    const answer = answerMatch?.[1]?.trim().replace(/\*\*/g, '');

    if (queryMatch || answer) {
      return {
        type: "synthesized_search",
        query: queryMatch?.[1] || "Search",
        answer: answer || undefined,
        sources: sources.slice(0, 5),
      };
    }
  }

  // Check for code analysis patterns
  const codePatterns = [
    /(?:analyzed?|reading|examining)\s+(\d+)\s+files?/i,
    /Code Analysis:/i,
    /Files? Analyzed:/i,
  ];

  const hasCodeAnalysis = codePatterns.some(p => p.test(content));
  if (hasCodeAnalysis) {
    const fileMatches = content.match(/[`']([^`']+\.[a-z]+)[`']/gi) || [];
    const files = fileMatches.map(f => ({
      path: f.replace(/[`']/g, ''),
    }));

    if (files.length > 0) {
      // Extract summary - first paragraph or line
      const summaryMatch = content.match(/^([^\n]+)/);
      
      return {
        type: "code_analysis",
        title: `Code Analysis: ${files.length} file${files.length > 1 ? 's' : ''}`,
        summary: summaryMatch?.[1] || "Analysis complete",
        files,
        keyPoints: extractKeyPoints(content),
      };
    }
  }

  return null;
}

/**
 * Extract key points from text content
 */
function extractKeyPoints(text: string): string[] {
  const points: string[] = [];

  // Look for bullet points
  const bulletMatches = text.match(/[-•*]\s+([^\n]+)/g);
  if (bulletMatches) {
    points.push(...bulletMatches.map(m => m.replace(/^[-•*]\s+/, '').trim()));
  }

  // Look for numbered items
  const numberedMatches = text.match(/\d+\.\s+([^\n]+)/g);
  if (numberedMatches) {
    points.push(...numberedMatches.map(m => m.replace(/^\d+\.\s+/, '').trim()));
  }

  return [...new Set(points)].slice(0, 5);
}

/**
 * Check if the content is an error message
 */
function isErrorMessage(content: string): boolean {
  const errorPatterns = [
    /exceeded maximum iterations/i,
    /error occurred/i,
    /couldn't find/i,
    /could not be completed/i,
    /multiple times but couldn't/i,
    /Please rephrase/i,
    /try a simpler query/i,
  ];
  return errorPatterns.some(p => p.test(content));
}

/**
 * MessageRenderer - Intelligently renders bot messages based on content type
 * 
 * Detects structured content (search results, code analysis, errors) and renders
 * appropriate UI cards. Falls back to standard markdown for plain text.
 */
const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  language,
  isStreaming = false,
}) => {
  const parsedContent = useMemo(() => {
    // Don't try to parse while still streaming
    if (isStreaming) return null;
    return parseStructuredContent(content);
  }, [content, isStreaming]);

  const isError = useMemo(() => {
    if (isStreaming) return false;
    return isErrorMessage(content);
  }, [content, isStreaming]);

  // While streaming, always show the standard bot message
  if (isStreaming) {
    return <BotMessage content={content} language={language} isStreaming={true} />;
  }

  // Render error messages with ErrorCard
  if (isError) {
    return <ErrorCard message={content} />;
  }

  // Render structured content with appropriate cards
  if (parsedContent) {
    switch (parsedContent.type) {
      case "synthesized_search":
        return (
          <SearchResultCard
            query={parsedContent.query}
            answer={parsedContent.answer}
            sources={parsedContent.sources}
          />
        );

      case "code_analysis":
        return (
          <CodeAnalysisCard
            title={parsedContent.title}
            summary={parsedContent.summary}
            files={parsedContent.files}
            keyPoints={parsedContent.keyPoints}
          />
        );

      default:
        break;
    }
  }

  // Default: render as standard bot message with markdown
  return <BotMessage content={content} language={language} isStreaming={false} />;
};

export default MessageRenderer;
