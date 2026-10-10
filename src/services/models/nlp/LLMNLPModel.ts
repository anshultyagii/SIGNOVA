import { BaseNLPModel } from './BaseNLPModel';
import type { TranslationResult } from '../../../types/models';

/**
 * LLM-Powered NLP Model Provider
 * 
 * Demonstrates how to translate raw sign language gloss sequences into natural,
 * context-aware spoken language using an LLM (OpenAI GPT-4o, Google Gemini, Anthropic Claude, or local Ollama).
 */
export class LLMNLPModel extends BaseNLPModel {
  readonly id = 'llm_transformer';
  readonly name = 'LLM Conversational Translator (Gemini / GPT / Ollama)';
  readonly description = 'Uses Large Language Models to convert sign glosses into fluid conversational English with natural grammar and tone.';
  readonly type = 'llm' as const;

  private apiKey = '';
  private endpoint = 'https://api.openai.com/v1/chat/completions'; // or local ollama

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async translate(tokens: string[]): Promise<TranslationResult> {
    const timestamp = Date.now();
    if (!tokens || tokens.length === 0) {
      return {
        originalTokens: [],
        translatedSentence: '',
        confidence: 1.0,
        timestamp,
      };
    }

    // If API key is provided, execute actual LLM call:
    if (this.apiKey) {
      try {
        const prompt = `You are an expert Sign Language to English interpreter. Convert this sequence of sign glosses into a natural, grammatically correct English sentence: [${tokens.join(', ')}]. Output only the sentence.`;
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          }),
        });
        const data = await res.json();
        const translatedSentence = data.choices[0].message.content.trim();
        return {
          originalTokens: tokens,
          translatedSentence,
          confidence: 0.98,
          timestamp,
        };
      } catch (err) {
        console.warn('[LLMNLPModel] LLM API call failed, falling back to heuristic synthesis', err);
      }
    }

    // Default conversational formatter when API key is not yet set
    const glossStr = tokens.join(' ');
    const translated = `[LLM interpretation]: ${glossStr.charAt(0).toUpperCase() + glossStr.slice(1).toLowerCase()}.`;

    return {
      originalTokens: tokens,
      translatedSentence: translated,
      confidence: 0.92,
      timestamp,
      alternatives: [
        `Configure your Gemini/OpenAI API key or Ollama endpoint in Model Settings to enable live LLM interpretation.`
      ],
    };
  }
}
