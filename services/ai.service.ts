import { google } from '@ai-sdk/google';
import { generateText, type LanguageModel } from 'ai';

// Simplified types: 'google' covers all Google/Gemini models
export type AIProviderType = 'google';

/**
 * Returns a typed LanguageModel.
 * Add other providers (openai, anthropic) here as needed.
 */
export const aiProvider = (
  provider: AIProviderType,
  model: string,
): LanguageModel => {
  switch (provider) {
    case 'google':
      return google(model);
    default:
      throw new Error(`Provider ${provider} is not supported.`);
  }
};

/**
 * Service to handle text generation.
 * Uses Parameters<typeof generateText>[0] to inherit all valid SDK props.
 */
const aiService = {
  generateText: async ({
    provider,
    model,
    ...props
  }: {
    provider: AIProviderType;
    model: string;
  } & Omit<Parameters<typeof generateText>[0], 'model'>) => {
    const modelProvider = aiProvider(provider, model);

    // generateText already throws if model is invalid,
    // but the wrapper is now type-safe.
    const result = await generateText({
      model: modelProvider,
      ...props,
    } as Parameters<typeof generateText>[0]);

    return result.text;
  },
};

export default aiService;
