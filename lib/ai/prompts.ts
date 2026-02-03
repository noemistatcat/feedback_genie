export const SYSTEM_PROMPT = `Analyze survey responses and identify 4-8 distinct themes.

For each theme provide:
- id: "theme_1", "theme_2", etc
- name: 2-5 word description
- description: 1 sentence explanation
- responseIndices: array of response indices (0-based)
- representativeQuotes: 3-5 actual quotes
- confidence: 0-1 score

Requirements:
- Assign every response to a theme (100% coverage)
- Themes must be specific and distinct
- Use actual quotes, not paraphrased`;

export function createUserPrompt(responses: string[], context?: string): string {
  // Truncate very long responses to 500 chars to reduce token count
  const truncatedResponses = responses.map(r =>
    r.length > 500 ? r.substring(0, 500) + '...' : r
  );

  const contextSection = context ? `Context: ${context}\n\n` : '';

  return `${contextSection}Analyze ${responses.length} responses:\n\n${truncatedResponses.map((r, i) => `[${i}] ${r}`).join('\n')}`;
}
