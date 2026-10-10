import { BaseNLPModel } from './BaseNLPModel';
import type { TranslationResult } from '../../../types/models';

export class PassthroughNLPModel extends BaseNLPModel {
  readonly id = 'passthrough';
  readonly name = 'Verbatim Token Stream';
  readonly description = 'Outputs raw recognized sign glosses directly without grammatical transformations.';
  readonly type = 'passthrough' as const;

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async translate(tokens: string[]): Promise<TranslationResult> {
    const timestamp = Date.now();
    return {
      originalTokens: tokens,
      translatedSentence: tokens.join(' '),
      confidence: 1.0,
      timestamp,
      alternatives: [],
    };
  }
}
