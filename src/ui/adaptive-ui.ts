import { EventEmitter } from 'eventemitter3';
import {
  AdaptiveUIConfig,
  UserPreferences,
  BehaviorPattern,
  AdaptationEvent,
  EmotionalState,
} from '../types';

/**
 * Adaptive UI/UX System
 * Dynamically adjusts interface based on user behavior and emotional context
 */
export class AdaptiveUISystem extends EventEmitter {
  private userConfigs: Map<string, AdaptiveUIConfig> = new Map();
  private adaptationRules: AdaptationRule[] = [];
  private isAdapting = false;

  constructor() {
    super();
    this.initializeAdaptationRules();
    this.startAdaptationCycle();
  }

  private initializeAdaptationRules(): void {
    this.adaptationRules = [
      {
        id: 'complexity-adjustment',
        trigger: 'user-struggle',
        condition: (pattern: BehaviorPattern) => pattern.errorPatterns.length > 5,
        adaptation: 'simplify-interface',
        priority: 'high',
      },
      {
        id: 'efficiency-boost',
        trigger: 'expert-behavior',
        condition: (pattern: BehaviorPattern) => pattern.learningSpeed > 0.8,
        adaptation: 'advanced-features',
        priority: 'medium',
      },
      {
        id: 'theme-adjustment',
        trigger: 'time-of-day',
        condition: () => this.isNightTime(),
        adaptation: 'dark-theme',
        priority: 'low',
      },
      {
        id: 'layout-optimization',
        trigger: 'frequent-tasks',
        condition: (pattern: BehaviorPattern) => pattern.primaryTasks.length > 0,
        adaptation: 'optimize-layout',
        priority: 'medium',
      },
    ];
  }

  private startAdaptationCycle(): void {
    // Check for adaptations every 60 seconds
    setInterval(() => {
      this.performAdaptationCycle();
    }, 60000);
  }

  /**
   * Register a new user for adaptive UI
   */
  public registerUser(userId: string, initialPreferences?: Partial<UserPreferences>): AdaptiveUIConfig {
    const config: AdaptiveUIConfig = {
      userId,
      preferences: {
        theme: initialPreferences?.theme || 'auto',
        layout: initialPreferences?.layout || 'spacious',
        complexity: initialPreferences?.complexity || 'intermediate',
        interactionStyle: initialPreferences?.interactionStyle || 'guided',
      },
      behaviorPattern: {
        primaryTasks: [],
        usageFrequency: 0,
        preferredTools: [],
        errorPatterns: [],
        learningSpeed: 0.5,
      },
      adaptationHistory: [],
    };

    this.userConfigs.set(userId, config);
    this.emit('user-registered', { userId, config });
    
    return config;
  }

  /**
   * Update user behavior pattern
   */
  public updateBehaviorPattern(userId: string, behaviorData: Partial<BehaviorPattern>): void {
    const config = this.userConfigs.get(userId);
    if (!config) {
      console.warn(`User ${userId} not found for behavior update`);
      return;
    }

    // Merge behavior data
    Object.assign(config.behaviorPattern, behaviorData);

    // Update learning speed based on recent performance
    if (behaviorData.errorPatterns) {
      const recentErrors = behaviorData.errorPatterns.slice(-10);
      config.behaviorPattern.learningSpeed = Math.max(0.1, 1 - (recentErrors.length / 10));
    }

    this.userConfigs.set(userId, config);
    this.emit('behavior-updated', { userId, pattern: config.behaviorPattern });
  }

  /**
   * Track user interaction
   */
  public trackInteraction(userId: string, interaction: UserInteraction): void {
    const config = this.userConfigs.get(userId);
    if (!config) return;

    // Update usage frequency
    config.behaviorPattern.usageFrequency += 1;

    // Track primary tasks
    if (interaction.task && !config.behaviorPattern.primaryTasks.includes(interaction.task)) {
      config.behaviorPattern.primaryTasks.push(interaction.task);
      
      // Keep only top 10 tasks
      if (config.behaviorPattern.primaryTasks.length > 10) {
        config.behaviorPattern.primaryTasks = config.behaviorPattern.primaryTasks.slice(-10);
      }
    }

    // Track preferred tools
    if (interaction.tool && !config.behaviorPattern.preferredTools.includes(interaction.tool)) {
      config.behaviorPattern.preferredTools.push(interaction.tool);
      
      // Keep only top 15 tools
      if (config.behaviorPattern.preferredTools.length > 15) {
        config.behaviorPattern.preferredTools = config.behaviorPattern.preferredTools.slice(-15);
      }
    }

    // Track errors
    if (interaction.error) {
      config.behaviorPattern.errorPatterns.push(interaction.error);
      
      // Keep only last 20 errors
      if (config.behaviorPattern.errorPatterns.length > 20) {
        config.behaviorPattern.errorPatterns = config.behaviorPattern.errorPatterns.slice(-20);
      }
    }

    this.userConfigs.set(userId, config);

    // Check if immediate adaptation is needed
    this.checkImmediateAdaptation(userId, interaction);
  }

  private checkImmediateAdaptation(userId: string, interaction: UserInteraction): void {
    if (interaction.error) {
      // If user encounters multiple errors quickly, simplify interface
      const config = this.userConfigs.get(userId);
      if (config) {
        const recentErrors = config.behaviorPattern.errorPatterns.slice(-3);
        if (recentErrors.length === 3) {
          this.adaptInterface(userId, 'simplify-interface', 'frequent-errors');
        }
      }
    }
  }

  /**
   * Adapt interface based on emotional context
   */
  public adaptToEmotionalContext(userId: string, emotionalState: EmotionalState): UIAdaptation {
    const config = this.userConfigs.get(userId);
    if (!config) {
      return this.getDefaultAdaptation();
    }

    const adaptation: UIAdaptation = {
      colors: this.getEmotionalColors(emotionalState),
      animations: this.getEmotionalAnimations(emotionalState),
      messaging: this.getEmotionalMessaging(emotionalState),
      interactions: this.getEmotionalInteractions(emotionalState),
    };

    this.emit('emotional-adaptation', { userId, emotionalState, adaptation });
    return adaptation;
  }

  private getEmotionalColors(emotional: EmotionalState): ColorScheme {
    return {
      primary: emotional.enthusiasm > 0.7 ? '#4CAF50' : '#2196F3',
      secondary: emotional.creativity > 0.7 ? '#FF9800' : '#607D8B',
      accent: emotional.empathy > 0.7 ? '#E91E63' : '#9C27B0',
      background: emotional.patience > 0.6 ? '#FAFAFA' : '#F5F5F5',
      text: emotional.analytical > 0.7 ? '#212121' : '#424242',
    };
  }

  private getEmotionalAnimations(emotional: EmotionalState): AnimationConfig {
    return {
      duration: emotional.patience > 0.7 ? 300 : 150,
      easing: emotional.creativity > 0.7 ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'ease-in-out',
      intensity: emotional.enthusiasm > 0.7 ? 'high' : 'medium',
    };
  }

  private getEmotionalMessaging(emotional: EmotionalState): MessagingTone {
    return {
      supportiveness: emotional.empathy,
      enthusiasm: emotional.enthusiasm,
      formality: 1 - emotional.creativity,
      patience: emotional.patience,
    };
  }

  private getEmotionalInteractions(emotional: EmotionalState): InteractionStyle {
    return {
      guidance: emotional.empathy > 0.7 ? 'high' : 'medium',
      feedback: emotional.patience > 0.6 ? 'detailed' : 'concise',
      confirmations: emotional.analytical > 0.7 ? 'required' : 'optional',
      shortcuts: emotional.enthusiasm > 0.7 ? 'enabled' : 'minimal',
    };
  }

  /**
   * Perform adaptation cycle for all users
   */
  private async performAdaptationCycle(): Promise<void> {
    if (this.isAdapting) return;

    this.isAdapting = true;

    try {
      for (const [userId, config] of this.userConfigs) {
        await this.evaluateAdaptations(userId, config);
      }
    } catch (error) {
      console.error('Adaptation cycle error:', error);
    } finally {
      this.isAdapting = false;
    }
  }

  private async evaluateAdaptations(userId: string, config: AdaptiveUIConfig): Promise<void> {
    for (const rule of this.adaptationRules) {
      if (rule.condition(config.behaviorPattern)) {
        const shouldAdapt = await this.shouldApplyAdaptation(userId, rule);
        if (shouldAdapt) {
          this.adaptInterface(userId, rule.adaptation, rule.trigger);
        }
      }
    }
  }

  private async shouldApplyAdaptation(userId: string, rule: AdaptationRule): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (!config) return false;

    // Check if this adaptation was recently applied
    const recentAdaptations = config.adaptationHistory
      .filter(event => event.adaptation === rule.adaptation)
      .filter(event => Date.now() - event.timestamp.getTime() < 300000); // 5 minutes

    return recentAdaptations.length === 0;
  }

  private adaptInterface(userId: string, adaptation: string, trigger: string): void {
    const config = this.userConfigs.get(userId);
    if (!config) return;

    const adaptationEvent: AdaptationEvent = {
      timestamp: new Date(),
      trigger,
      adaptation,
      effectiveness: 0, // Will be updated based on user feedback
    };

    config.adaptationHistory.push(adaptationEvent);

    // Keep only last 50 adaptations
    if (config.adaptationHistory.length > 50) {
      config.adaptationHistory = config.adaptationHistory.slice(-50);
    }

    // Apply the adaptation
    this.applyAdaptation(userId, adaptation);

    this.userConfigs.set(userId, config);
    this.emit('interface-adapted', { userId, adaptation, trigger });
  }

  private applyAdaptation(userId: string, adaptation: string): void {
    const config = this.userConfigs.get(userId);
    if (!config) return;

    switch (adaptation) {
      case 'simplify-interface':
        config.preferences.complexity = 'beginner';
        config.preferences.layout = 'compact';
        break;
      case 'advanced-features':
        config.preferences.complexity = 'expert';
        config.preferences.interactionStyle = 'autonomous';
        break;
      case 'dark-theme':
        config.preferences.theme = 'dark';
        break;
      case 'optimize-layout':
        config.preferences.layout = this.getOptimalLayout(config.behaviorPattern);
        break;
    }

    this.userConfigs.set(userId, config);
  }

  private getOptimalLayout(pattern: BehaviorPattern): 'compact' | 'spacious' | 'minimal' {
    if (pattern.primaryTasks.length > 7) return 'compact';
    if (pattern.preferredTools.length > 10) return 'spacious';
    return 'minimal';
  }

  private isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 20 || hour <= 6;
  }

  private getDefaultAdaptation(): UIAdaptation {
    return {
      colors: {
        primary: '#2196F3',
        secondary: '#607D8B',
        accent: '#9C27B0',
        background: '#FAFAFA',
        text: '#212121',
      },
      animations: {
        duration: 250,
        easing: 'ease-in-out',
        intensity: 'medium',
      },
      messaging: {
        supportiveness: 0.7,
        enthusiasm: 0.6,
        formality: 0.5,
        patience: 0.7,
      },
      interactions: {
        guidance: 'medium',
        feedback: 'balanced',
        confirmations: 'optional',
        shortcuts: 'minimal',
      },
    };
  }

  /**
   * Get current UI configuration for user
   */
  public getUserConfig(userId: string): AdaptiveUIConfig | undefined {
    return this.userConfigs.get(userId);
  }

  /**
   * Update adaptation effectiveness based on user feedback
   */
  public updateAdaptationEffectiveness(userId: string, adaptationIndex: number, effectiveness: number): void {
    const config = this.userConfigs.get(userId);
    if (!config || !config.adaptationHistory[adaptationIndex]) return;

    config.adaptationHistory[adaptationIndex].effectiveness = effectiveness;
    this.userConfigs.set(userId, config);

    this.emit('adaptation-feedback', { userId, adaptationIndex, effectiveness });
  }

  /**
   * Generate UI recommendations based on behavior
   */
  public generateUIRecommendations(userId: string): UIRecommendation[] {
    const config = this.userConfigs.get(userId);
    if (!config) return [];

    const recommendations: UIRecommendation[] = [];
    const pattern = config.behaviorPattern;

    if (pattern.errorPatterns.length > 3) {
      recommendations.push({
        type: 'simplification',
        description: 'Simplify interface to reduce errors',
        impact: 'high',
        effort: 'low',
      });
    }

    if (pattern.learningSpeed > 0.8) {
      recommendations.push({
        type: 'advanced-features',
        description: 'Enable advanced features for expert user',
        impact: 'medium',
        effort: 'medium',
      });
    }

    if (pattern.preferredTools.length > 8) {
      recommendations.push({
        type: 'tool-organization',
        description: 'Organize tools in customizable workspace',
        impact: 'high',
        effort: 'high',
      });
    }

    return recommendations;
  }
}

// Supporting interfaces
interface AdaptationRule {
  id: string;
  trigger: string;
  condition: (pattern: BehaviorPattern) => boolean;
  adaptation: string;
  priority: 'low' | 'medium' | 'high';
}

interface UserInteraction {
  task?: string;
  tool?: string;
  error?: string;
  duration?: number;
  success?: boolean;
}

interface UIAdaptation {
  colors: ColorScheme;
  animations: AnimationConfig;
  messaging: MessagingTone;
  interactions: InteractionStyle;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface AnimationConfig {
  duration: number;
  easing: string;
  intensity: 'low' | 'medium' | 'high';
}

interface MessagingTone {
  supportiveness: number;
  enthusiasm: number;
  formality: number;
  patience: number;
}

interface InteractionStyle {
  guidance: 'low' | 'medium' | 'high';
  feedback: 'concise' | 'balanced' | 'detailed';
  confirmations: 'required' | 'optional' | 'minimal';
  shortcuts: 'disabled' | 'minimal' | 'enabled';
}

interface UIRecommendation {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}