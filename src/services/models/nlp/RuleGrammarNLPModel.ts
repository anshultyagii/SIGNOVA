import { BaseNLPModel } from './BaseNLPModel';
import type { TranslationResult } from '../../../types/models';

export class RuleGrammarNLPModel extends BaseNLPModel {
  readonly id = 'rule_grammar';
  readonly name = 'Sign-to-English Grammar Engine';
  readonly description = 'Rule-based linguistic converter translating sign gloss tokens into fluent natural English sentences.';
  readonly type = 'rule' as const;

  // Sign Gloss phrase mapping templates
  private static phraseDictionary: Record<string, { sentence: string; alternatives: string[] }> = {
    'HELLO': {
      sentence: 'Hello there!',
      alternatives: ['Hi, greetings!', 'Hello everyone.'],
    },
    'THANK YOU': {
      sentence: 'Thank you very much!',
      alternatives: ['Thanks a lot!', 'I appreciate it.'],
    },
    'HELLO+THANK YOU': {
      sentence: 'Hello, thank you very much!',
      alternatives: ['Hi, thanks for having me.', 'Greetings and thank you.'],
    },
    'I LOVE YOU': {
      sentence: 'I love you!',
      alternatives: ['Sending you lots of love!', 'Love you always.'],
    },
    'CALL ME': {
      sentence: 'Please give me a call when you can.',
      alternatives: ['Call me later.', 'Reach out to me by phone.'],
    },
    'PEACE': {
      sentence: 'Peace and harmony to all.',
      alternatives: ['Peace out!', 'Wishing you peace.'],
    },
    'GOOD / THUMBS UP': {
      sentence: 'That looks great and sounds good!',
      alternatives: ['Good job!', 'All good!'],
    },
    'PLEASE': {
      sentence: 'Please, could you help me with this?',
      alternatives: ['Please if you don’t mind.', 'Kindly assist.'],
    },
    'YES': {
      sentence: 'Yes, absolutely agreed.',
      alternatives: ['Yes, that is correct.', 'Definitely yes.'],
    },
    'NO': {
      sentence: 'No, that is not the case.',
      alternatives: ['No, thank you.', 'I disagree.'],
    },
    'STOP': {
      sentence: 'Please stop right there.',
      alternatives: ['Hold on, pause for a moment.', 'Stop please.'],
    },
    'WOW / SURPRISED': {
      sentence: 'Wow, that is truly amazing!',
      alternatives: ['Oh wow, I am surprised!', 'Incredible!'],
    },
  };

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

    // Deduplicate consecutive tokens (e.g. ['HELLO', 'HELLO'] -> ['HELLO'])
    const uniqueTokens: string[] = [];
    for (const t of tokens) {
      if (uniqueTokens.length === 0 || uniqueTokens[uniqueTokens.length - 1] !== t) {
        uniqueTokens.push(t);
      }
    }

    const key = uniqueTokens.join('+');

    // 1. Direct matched phrase
    if (RuleGrammarNLPModel.phraseDictionary[key]) {
      const match = RuleGrammarNLPModel.phraseDictionary[key];
      return {
        originalTokens: uniqueTokens,
        translatedSentence: match.sentence,
        confidence: 0.95,
        timestamp,
        alternatives: match.alternatives,
      };
    }

    // 2. Synthesize from individual token meanings
    const fragments: string[] = [];
    for (const token of uniqueTokens) {
      if (RuleGrammarNLPModel.phraseDictionary[token]) {
        // Strip trailing punctuation for chaining
        const text = RuleGrammarNLPModel.phraseDictionary[token].sentence.replace(/[.!?]+$/, '');
        fragments.push(text);
      } else {
        fragments.push(token.toLowerCase());
      }
    }

    let assembled = fragments.join(', ');
    if (assembled.length > 0) {
      assembled = assembled.charAt(0).toUpperCase() + assembled.slice(1) + '.';
    }

    return {
      originalTokens: uniqueTokens,
      translatedSentence: assembled,
      confidence: 0.88,
      timestamp,
      alternatives: [
        `Signs detected: ${uniqueTokens.join(' -> ')}`,
        `Direct transcript: "${assembled}"`,
      ],
    };
  }
}
