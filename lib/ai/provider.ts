import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Initialize the AI provider
// Default to Gemini, but designed to be easily swappable
export function getAIProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
  }

  const google = createGoogleGenerativeAI({
    apiKey,
  });

  // Return the model to use
  // As specified in SPECS.md: gemini-3-flash-preview
  // To switch providers: import { createOpenAI } from '@ai-sdk/openai' and return openai('gpt-4o-mini')
  return google('gemini-3-flash-preview');
}
