/**
 * Keyword Weighting Utilities
 *
 * Assigns weights to keywords based on their position in the array.
 * Keywords earlier in the array get higher weights.
 */

export type WeightedKeyword = [string, number];

/**
 * Assigns weights to keywords based on their position.
 * First keyword gets highest weight, last gets lowest.
 *
 * @param keywords - Array of keywords
 * @param maxWeight - Maximum weight for first keyword (default: 10)
 * @param minWeight - Minimum weight for last keyword (default: 1)
 * @returns Array of [keyword, weight] tuples
 *
 * @example
 * assignWeights(['authentication', 'jwt', 'token', 'login'])
 * // Returns: [['authentication', 10], ['jwt', 7.66], ['token', 5.33], ['login', 3]]
 */
export function assignWeights(
  keywords: string[],
  maxWeight = 10,
  minWeight = 1,
): WeightedKeyword[] {
  if (keywords.length === 0) {
    return [];
  }

  if (keywords.length === 1) {
    return [[keywords[0], maxWeight]];
  }

  const weightRange = maxWeight - minWeight;
  const step = weightRange / (keywords.length - 1);

  return keywords.map((keyword, index) => {
    const weight = maxWeight - step * index;
    return [keyword, Math.round(weight * 100) / 100]; // Round to 2 decimals
  });
}

/**
 * Assigns integer weights (no decimals)
 *
 * @example
 * assignIntegerWeights(['authentication', 'jwt', 'token', 'login'])
 * // Returns: [['authentication', 10], ['jwt', 8], ['token', 5], ['login', 3]]
 */
export function assignIntegerWeights(
  keywords: string[],
  maxWeight = 10,
  minWeight = 1,
): WeightedKeyword[] {
  if (keywords.length === 0) {
    return [];
  }

  if (keywords.length === 1) {
    return [[keywords[0], maxWeight]];
  }

  const weightRange = maxWeight - minWeight;
  const step = weightRange / (keywords.length - 1);

  return keywords.map((keyword, index) => {
    const weight = Math.round(maxWeight - step * index);
    return [keyword, weight];
  });
}

/**
 * Assigns weights using a logarithmic scale (emphasizes top keywords more)
 *
 * @example
 * assignLogarithmicWeights(['authentication', 'jwt', 'token', 'login'])
 * // Returns: [['authentication', 10], ['jwt', 6.31], ['token', 3.98], ['login', 2.51]]
 */
export function assignLogarithmicWeights(
  keywords: string[],
  maxWeight = 10,
  minWeight = 1,
): WeightedKeyword[] {
  if (keywords.length === 0) {
    return [];
  }

  if (keywords.length === 1) {
    return [[keywords[0], maxWeight]];
  }

  return keywords.map((keyword, index) => {
    // Logarithmic decay: weight = maxWeight * log(length - index) / log(length)
    const position = keywords.length - index;
    const normalizedLog = Math.log(position) / Math.log(keywords.length);
    const weight = minWeight + (maxWeight - minWeight) * normalizedLog;
    return [keyword, Math.round(weight * 100) / 100];
  });
}

/**
 * Assigns weights using an exponential scale (gradual decrease)
 *
 * @example
 * assignExponentialWeights(['authentication', 'jwt', 'token', 'login'])
 * // Returns: [['authentication', 10], ['jwt', 8.16], ['token', 6.67], ['login', 5.45]]
 */
export function assignExponentialWeights(
  keywords: string[],
  maxWeight = 10,
  minWeight = 1,
  decay = 0.8, // Decay factor (0-1, lower = faster decay)
): WeightedKeyword[] {
  if (keywords.length === 0) {
    return [];
  }

  if (keywords.length === 1) {
    return [[keywords[0], maxWeight]];
  }

  return keywords.map((keyword, index) => {
    const weight = maxWeight * Math.pow(decay, index);
    return [keyword, Math.max(minWeight, Math.round(weight * 100) / 100)];
  });
}

/**
 * Assigns weights with tiers (groups of keywords get same weight)
 *
 * @param tierSizes - Number of keywords per tier [high, medium, low]
 *
 * @example
 * assignTieredWeights(['auth', 'jwt', 'token', 'login', 'session', 'password'], [2, 2, 2])
 * // Returns: [['auth', 10], ['jwt', 10], ['token', 6], ['login', 6], ['session', 2], ['password', 2]]
 */
export function assignTieredWeights(
  keywords: string[],
  tierSizes: number[] = [3, 5, 10], // High, Medium, Low tier sizes
  tierWeights: number[] = [10, 6, 2], // Corresponding weights
): WeightedKeyword[] {
  const result: WeightedKeyword[] = [];
  let index = 0;

  for (
    let tierIndex = 0;
    tierIndex < tierSizes.length && index < keywords.length;
    tierIndex++
  ) {
    const tierSize = tierSizes[tierIndex];
    const weight = tierWeights[tierIndex] || 1;

    for (let i = 0; i < tierSize && index < keywords.length; i++, index++) {
      result.push([keywords[index], weight]);
    }
  }

  // Assign minimum weight to remaining keywords
  while (index < keywords.length) {
    result.push([keywords[index], tierWeights[tierWeights.length - 1] || 1]);
    index++;
  }

  return result;
}

/**
 * Assigns weights based on predefined importance map
 * Falls back to position-based weight if keyword not in map
 *
 * @example
 * const importanceMap = {
 *   'authentication': 10,
 *   'jwt': 9,
 *   'password': 8
 * };
 * assignWeightsWithMap(['authentication', 'jwt', 'token'], importanceMap)
 * // Returns: [['authentication', 10], ['jwt', 9], ['token', 5]]
 */
export function assignWeightsWithMap(
  keywords: string[],
  importanceMap: Record<string, number>,
  defaultMaxWeight = 10,
  defaultMinWeight = 1,
): WeightedKeyword[] {
  const unmappedKeywords: string[] = [];
  const mappedResults: WeightedKeyword[] = [];

  // First pass: use map for known keywords
  keywords.forEach((keyword) => {
    if (keyword in importanceMap) {
      mappedResults.push([keyword, importanceMap[keyword]]);
    } else {
      unmappedKeywords.push(keyword);
    }
  });

  // Second pass: assign position-based weights to unmapped keywords
  const unmappedWeights = assignWeights(
    unmappedKeywords,
    defaultMaxWeight,
    defaultMinWeight,
  );

  // Merge results maintaining original order
  const result: WeightedKeyword[] = [];
  let mappedIndex = 0;
  let unmappedIndex = 0;

  keywords.forEach((keyword) => {
    if (keyword in importanceMap) {
      result.push(mappedResults[mappedIndex++]);
    } else {
      result.push(unmappedWeights[unmappedIndex++]);
    }
  });

  return result;
}

/**
 * Convert weighted keywords to a Map for easy lookup
 *
 * @example
 * const weights = assignWeights(['authentication', 'jwt', 'token']);
 * const map = toWeightMap(weights);
 * console.log(map.get('jwt')); // 7.66
 */
export function toWeightMap(
  weightedKeywords: WeightedKeyword[],
): Map<string, number> {
  return new Map(weightedKeywords);
}

/**
 * Convert weighted keywords to an object for easy lookup
 *
 * @example
 * const weights = assignWeights(['authentication', 'jwt', 'token']);
 * const obj = toWeightObject(weights);
 * console.log(obj['jwt']); // 7.66
 */
export function toWeightObject(
  weightedKeywords: WeightedKeyword[],
): Record<string, number> {
  return Object.fromEntries(weightedKeywords);
}

/**
 * Normalize weights to sum to a specific value
 *
 * @example
 * normalizeWeights([['auth', 10], ['jwt', 5]], 100)
 * // Returns: [['auth', 66.67], ['jwt', 33.33]] (sums to 100)
 */
export function normalizeWeights(
  weightedKeywords: WeightedKeyword[],
  targetSum = 100,
): WeightedKeyword[] {
  const currentSum = weightedKeywords.reduce(
    (sum, [, weight]) => sum + weight,
    0,
  );

  if (currentSum === 0) {
    return weightedKeywords;
  }

  const multiplier = targetSum / currentSum;

  return weightedKeywords.map(([keyword, weight]) => [
    keyword,
    Math.round(weight * multiplier * 100) / 100,
  ]);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example usage with authentication keywords
 */
export function exampleUsage() {
  const keywords = [
    "authentication",
    "jwt",
    "token",
    "login",
    "session",
    "password",
  ];

  console.log("=== Linear Weights ===");
  console.log(assignWeights(keywords));
  // [['authentication', 10], ['jwt', 8], ['token', 6], ['login', 4], ['session', 2], ['password', 1]]

  console.log("\n=== Integer Weights ===");
  console.log(assignIntegerWeights(keywords));
  // [['authentication', 10], ['jwt', 8], ['token', 6], ['login', 4], ['session', 2], ['password', 1]]

  console.log("\n=== Logarithmic Weights (emphasizes top) ===");
  console.log(assignLogarithmicWeights(keywords));
  // [['authentication', 10], ['jwt', 6.93], ['token', 5.16], ...]

  console.log("\n=== Exponential Weights (gradual) ===");
  console.log(assignExponentialWeights(keywords));
  // [['authentication', 10], ['jwt', 8], ['token', 6.4], ...]

  console.log("\n=== Tiered Weights ===");
  console.log(assignTieredWeights(keywords, [2, 2, 2], [10, 6, 2]));
  // [['authentication', 10], ['jwt', 10], ['token', 6], ['login', 6], ...]

  console.log("\n=== As Map ===");
  const weightMap = toWeightMap(assignWeights(keywords));
  console.log(weightMap.get("jwt")); // 8

  console.log("\n=== As Object ===");
  const weightObj = toWeightObject(assignWeights(keywords));
  console.log(weightObj["jwt"]); // 8
}
