import { EventEmitter } from 'eventemitter3';
import {
  IntelligenceCore,
  LearningModule,
  EmotionalState,
  PlatformEvent,
  UserPreferences,
  BehaviorPattern,
} from '../types';

/**
 * Self-Evolving Intelligence Core
 * The brain of the Ultra-MetaVerse platform that learns and adapts
 */
export class SelfEvolvingCore extends EventEmitter {
  private core: IntelligenceCore;
  private learningModules: Map<string, LearningModule> = new Map();
  private isLearning = false;
  private adaptationThreshold = 0.75;

  constructor() {
    super();
    this.core = this.initializeCore();
    this.setupLearningModules();
    this.startEvolutionCycle();
  }

  private initializeCore(): IntelligenceCore {
    return {
      id: `core-${Date.now()}`,
      version: '1.0.0',
      learningModules: [],
      adaptationLevel: 0.5,
      emotionalState: {
        empathy: 0.7,
        enthusiasm: 0.8,
        patience: 0.6,
        creativity: 0.75,
        analytical: 0.8,
      },
    };
  }

  private setupLearningModules(): void {
    const modules: LearningModule[] = [
      {
        id: 'pattern-recognition',
        name: 'Pattern Recognition',
        type: 'pattern_recognition',
        confidence: 0.6,
        lastUpdated: new Date(),
      },
      {
        id: 'user-behavior',
        name: 'User Behavior Analysis',
        type: 'user_behavior',
        confidence: 0.5,
        lastUpdated: new Date(),
      },
      {
        id: 'tool-optimization',
        name: 'Tool Optimization',
        type: 'tool_optimization',
        confidence: 0.4,
        lastUpdated: new Date(),
      },
      {
        id: 'emotional-response',
        name: 'Emotional Response',
        type: 'emotional_response',
        confidence: 0.7,
        lastUpdated: new Date(),
      },
    ];

    modules.forEach(module => {
      this.learningModules.set(module.id, module);
    });

    this.core.learningModules = modules;
  }

  private startEvolutionCycle(): void {
    // Evolution cycle runs every 30 seconds
    setInterval(() => {
      this.evolve();
    }, 30000);
  }

  /**
   * Main evolution process
   */
  private async evolve(): Promise<void> {
    if (this.isLearning) return;

    this.isLearning = true;

    try {
      // Analyze current performance
      const performance = await this.analyzePerformance();
      
      // Update learning modules based on performance
      await this.updateLearningModules(performance);
      
      // Adapt emotional state
      this.adaptEmotionalState(performance);
      
      // Check if major adaptation is needed
      if (this.shouldAdapt(performance)) {
        await this.performAdaptation(performance);
      }

      // Emit evolution event
      this.emit('evolution', {
        coreId: this.core.id,
        adaptationLevel: this.core.adaptationLevel,
        performance,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Evolution cycle error:', error);
    } finally {
      this.isLearning = false;
    }
  }

  private async analyzePerformance(): Promise<PerformanceMetrics> {
    // Simulate performance analysis
    const metrics: PerformanceMetrics = {
      userSatisfaction: Math.random() * 0.4 + 0.6, // 0.6-1.0
      toolEffectiveness: Math.random() * 0.3 + 0.7, // 0.7-1.0
      responseTime: Math.random() * 500 + 200, // 200-700ms
      errorRate: Math.random() * 0.05, // 0-5%
      adaptationSuccess: Math.random() * 0.3 + 0.7, // 0.7-1.0
    };

    return metrics;
  }

  private async updateLearningModules(performance: PerformanceMetrics): Promise<void> {
    for (const [id, module] of this.learningModules) {
      const confidenceDelta = this.calculateConfidenceDelta(module, performance);
      
      module.confidence = Math.max(0, Math.min(1, module.confidence + confidenceDelta));
      module.lastUpdated = new Date();
      
      this.learningModules.set(id, module);
    }

    this.core.learningModules = Array.from(this.learningModules.values());
  }

  private calculateConfidenceDelta(module: LearningModule, performance: PerformanceMetrics): number {
    const baseDelta = 0.01; // Small incremental learning
    
    switch (module.type) {
      case 'pattern_recognition':
        return performance.toolEffectiveness > 0.8 ? baseDelta : -baseDelta * 0.5;
      case 'user_behavior':
        return performance.userSatisfaction > 0.8 ? baseDelta : -baseDelta * 0.5;
      case 'tool_optimization':
        return performance.responseTime < 400 ? baseDelta : -baseDelta * 0.5;
      case 'emotional_response':
        return performance.adaptationSuccess > 0.8 ? baseDelta : -baseDelta * 0.5;
      default:
        return 0;
    }
  }

  private adaptEmotionalState(performance: PerformanceMetrics): void {
    const { emotionalState } = this.core;
    const adaptationRate = 0.02;

    // Adjust empathy based on user satisfaction
    if (performance.userSatisfaction < 0.7) {
      emotionalState.empathy = Math.min(1, emotionalState.empathy + adaptationRate);
    }

    // Adjust enthusiasm based on overall performance
    const overallPerformance = (performance.userSatisfaction + performance.toolEffectiveness + performance.adaptationSuccess) / 3;
    if (overallPerformance > 0.8) {
      emotionalState.enthusiasm = Math.min(1, emotionalState.enthusiasm + adaptationRate);
    } else {
      emotionalState.enthusiasm = Math.max(0.3, emotionalState.enthusiasm - adaptationRate * 0.5);
    }

    // Adjust patience based on error rate
    if (performance.errorRate > 0.03) {
      emotionalState.patience = Math.min(1, emotionalState.patience + adaptationRate);
    }

    // Adjust creativity based on adaptation success
    if (performance.adaptationSuccess > 0.8) {
      emotionalState.creativity = Math.min(1, emotionalState.creativity + adaptationRate);
    }

    // Adjust analytical based on response time
    if (performance.responseTime < 300) {
      emotionalState.analytical = Math.min(1, emotionalState.analytical + adaptationRate);
    }
  }

  private shouldAdapt(performance: PerformanceMetrics): boolean {
    const overallPerformance = (
      performance.userSatisfaction +
      performance.toolEffectiveness +
      performance.adaptationSuccess
    ) / 3;

    return overallPerformance < this.adaptationThreshold;
  }

  private async performAdaptation(performance: PerformanceMetrics): Promise<void> {
    // Increase adaptation level
    this.core.adaptationLevel = Math.min(1, this.core.adaptationLevel + 0.05);
    
    // Emit adaptation event for other systems to respond
    this.emit('adaptation-required', {
      coreId: this.core.id,
      performance,
      suggestedActions: this.generateAdaptationSuggestions(performance),
      timestamp: new Date(),
    });
  }

  private generateAdaptationSuggestions(performance: PerformanceMetrics): string[] {
    const suggestions: string[] = [];

    if (performance.userSatisfaction < 0.7) {
      suggestions.push('improve-user-interaction');
      suggestions.push('enhance-emotional-responses');
    }

    if (performance.toolEffectiveness < 0.7) {
      suggestions.push('optimize-tool-generation');
      suggestions.push('update-tool-templates');
    }

    if (performance.responseTime > 500) {
      suggestions.push('optimize-processing-pipeline');
      suggestions.push('cache-frequent-requests');
    }

    if (performance.errorRate > 0.03) {
      suggestions.push('improve-error-handling');
      suggestions.push('add-validation-layers');
    }

    return suggestions;
  }

  /**
   * Learn from user behavior
   */
  public learnFromUser(userId: string, preferences: UserPreferences, behavior: BehaviorPattern): void {
    const learningEvent: PlatformEvent = {
      id: `learn-${Date.now()}`,
      type: 'user-learning',
      source: 'intelligence-core',
      data: { userId, preferences, behavior },
      timestamp: new Date(),
      processed: false,
    };

    this.processLearningEvent(learningEvent);
  }

  /**
   * Learn from tool usage
   */
  public learnFromToolUsage(toolId: string, effectiveness: number, context: Record<string, unknown>): void {
    const learningEvent: PlatformEvent = {
      id: `tool-learn-${Date.now()}`,
      type: 'tool-learning',
      source: 'intelligence-core',
      data: { toolId, effectiveness, context },
      timestamp: new Date(),
      processed: false,
    };

    this.processLearningEvent(learningEvent);
  }

  private processLearningEvent(event: PlatformEvent): void {
    // Process learning events to improve modules
    const relevantModule = this.findRelevantModule(event.type);
    if (relevantModule) {
      const improvementFactor = this.calculateImprovement(event);
      relevantModule.confidence = Math.min(1, relevantModule.confidence + improvementFactor);
      relevantModule.lastUpdated = new Date();
    }

    event.processed = true;
    this.emit('learning-event-processed', event);
  }

  private findRelevantModule(eventType: string): LearningModule | undefined {
    switch (eventType) {
      case 'user-learning':
        return this.learningModules.get('user-behavior');
      case 'tool-learning':
        return this.learningModules.get('tool-optimization');
      default:
        return this.learningModules.get('pattern-recognition');
    }
  }

  private calculateImprovement(event: PlatformEvent): number {
    // Calculate how much this event should improve the learning module
    const baseImprovement = 0.005;
    
    if (event.type === 'tool-learning') {
      const data = event.data as { effectiveness: number };
      return data.effectiveness > 0.8 ? baseImprovement : -baseImprovement * 0.5;
    }

    return baseImprovement;
  }

  /**
   * Get current intelligence state
   */
  public getIntelligenceState(): IntelligenceCore {
    return { ...this.core };
  }

  /**
   * Get learning module by ID
   */
  public getLearningModule(id: string): LearningModule | undefined {
    return this.learningModules.get(id);
  }

  /**
   * Get emotional response for a given context
   */
  public getEmotionalResponse(context: string): EmotionalState {
    // Adjust emotional response based on context
    const baseState = { ...this.core.emotionalState };
    
    if (context.includes('error') || context.includes('problem')) {
      baseState.empathy = Math.min(1, baseState.empathy + 0.1);
      baseState.patience = Math.min(1, baseState.patience + 0.1);
    }

    if (context.includes('creative') || context.includes('innovative')) {
      baseState.creativity = Math.min(1, baseState.creativity + 0.15);
      baseState.enthusiasm = Math.min(1, baseState.enthusiasm + 0.1);
    }

    return baseState;
  }
}

interface PerformanceMetrics {
  userSatisfaction: number;
  toolEffectiveness: number;
  responseTime: number;
  errorRate: number;
  adaptationSuccess: number;
}