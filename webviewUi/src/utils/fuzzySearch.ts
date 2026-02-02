/**
 * Fuzzy search utility for file matching
 */

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

/**
 * Flatten a nested folder structure into a flat list of files
 */
export function flattenFileTree(
  tree: any[],
  parentPath: string = "",
): FileItem[] {
  const results: FileItem[] = [];

  for (const item of tree) {
    const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;

    if (item.children && item.children.length > 0) {
      // It's a directory - recurse into children
      results.push(...flattenFileTree(item.children, currentPath));
    } else {
      // It's a file
      results.push({
        name: item.name,
        path: currentPath,
        isDirectory: false,
      });
    }
  }

  return results;
}

/**
 * Simple fuzzy match - checks if query characters appear in order in the target
 */
export function fuzzyMatch(
  query: string,
  target: string,
): { matches: boolean; score: number } {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  if (queryLower.length === 0) {
    return { matches: true, score: 0 };
  }

  if (targetLower.includes(queryLower)) {
    // Exact substring match gets highest score
    const position = targetLower.indexOf(queryLower);
    // Prefer matches at start of filename
    return { matches: true, score: 100 - position };
  }

  // Fuzzy match - characters must appear in order
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;
  let lastMatchIndex = -1;

  for (
    let i = 0;
    i < targetLower.length && queryIndex < queryLower.length;
    i++
  ) {
    if (targetLower[i] === queryLower[queryIndex]) {
      queryIndex++;

      // Bonus for consecutive matches
      if (lastMatchIndex === i - 1) {
        consecutiveMatches++;
        score += consecutiveMatches * 2;
      } else {
        consecutiveMatches = 1;
      }

      // Bonus for matching at word boundaries (after /, ., -, _)
      if (i === 0 || "/.-_".includes(target[i - 1])) {
        score += 10;
      }

      lastMatchIndex = i;
      score += 1;
    }
  }

  const matches = queryIndex === queryLower.length;
  return { matches, score: matches ? score : 0 };
}

/**
 * Search files with fuzzy matching
 */
export function searchFiles(
  files: FileItem[],
  query: string,
  limit: number = 20,
): FileItem[] {
  if (!query || query.length === 0) {
    // Return first N files when no query
    return files.slice(0, limit);
  }

  const scored = files
    .map((file) => {
      // Match against filename (higher weight) and path
      const nameMatch = fuzzyMatch(query, file.name);
      const pathMatch = fuzzyMatch(query, file.path);

      // Combine scores, prioritizing filename matches
      const score = nameMatch.score * 2 + pathMatch.score;
      const matches = nameMatch.matches || pathMatch.matches;

      return { file, score, matches };
    })
    .filter((item) => item.matches)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.file);

  return scored;
}

/**
 * Get the directory path from a full file path
 */
export function getDirectory(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash > 0 ? path.substring(0, lastSlash) : "";
}
