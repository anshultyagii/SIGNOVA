import type { INLPTranslationModel, TranslationResult } from '../../../types/models';

export abstract class BaseNLPModel implements INLPTranslationModel {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly type: 'rule' | 'llm' | 'huggingface' | 'passthrough';

  protected _isReady = false;

  get isReady(): boolean {
    return this._isReady;
  }

  abstract initialize(): Promise<void>;
  abstract translate(tokens: string[]): Promise<TranslationResult>;

  dispose(): void {
    this._isReady = false;
  }
}
