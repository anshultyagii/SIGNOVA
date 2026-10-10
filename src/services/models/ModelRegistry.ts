import type { ISignRecognitionModel, INLPTranslationModel } from '../../types/models';
import { HeuristicSignModel } from './sign/HeuristicSignModel';
import { ONNXSignModel } from './sign/ONNXSignModel';
import { TFJSSignModel } from './sign/TFJSSignModel';
import { WebSocketSignModel } from './sign/WebSocketSignModel';
import { RuleGrammarNLPModel } from './nlp/RuleGrammarNLPModel';
import { LLMNLPModel } from './nlp/LLMNLPModel';
import { PassthroughNLPModel } from './nlp/PassthroughNLPModel';

export class ModelRegistry {
  private static signModels: Map<string, ISignRecognitionModel> = new Map();
  private static nlpModels: Map<string, INLPTranslationModel> = new Map();
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;

    // Register default sign models
    this.registerSignModel(new HeuristicSignModel());
    this.registerSignModel(new ONNXSignModel());
    this.registerSignModel(new TFJSSignModel());
    this.registerSignModel(new WebSocketSignModel());

    // Register default NLP models
    this.registerNLPModel(new RuleGrammarNLPModel());
    this.registerNLPModel(new LLMNLPModel());
    this.registerNLPModel(new PassthroughNLPModel());

    this.initialized = true;
  }

  public static registerSignModel(model: ISignRecognitionModel): void {
    this.signModels.set(model.id, model);
  }

  public static registerNLPModel(model: INLPTranslationModel): void {
    this.nlpModels.set(model.id, model);
  }

  public static getSignModel(id: string): ISignRecognitionModel {
    this.initialize();
    const model = this.signModels.get(id);
    if (!model) {
      console.warn(`[ModelRegistry] Sign model "${id}" not found. Falling back to heuristic_rules.`);
      return this.signModels.get('heuristic_rules')!;
    }
    return model;
  }

  public static getNLPModel(id: string): INLPTranslationModel {
    this.initialize();
    const model = this.nlpModels.get(id);
    if (!model) {
      console.warn(`[ModelRegistry] NLP model "${id}" not found. Falling back to rule_grammar.`);
      return this.nlpModels.get('rule_grammar')!;
    }
    return model;
  }

  public static getAllSignModels(): ISignRecognitionModel[] {
    this.initialize();
    return Array.from(this.signModels.values());
  }

  public static getAllNLPModels(): INLPTranslationModel[] {
    this.initialize();
    return Array.from(this.nlpModels.values());
  }
}
