/**
 * Core types and interfaces for the Ultra-MetaVerse AI Platform
 */

// Core Platform Types
export interface AIEngine {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  apiEndpoint: string;
  isActive: boolean;
}

export interface IntelligenceCore {
  id: string;
  version: string;
  learningModules: LearningModule[];
  adaptationLevel: number;
  emotionalState: EmotionalState;
}

export interface LearningModule {
  id: string;
  name: string;
  type: 'pattern_recognition' | 'user_behavior' | 'tool_optimization' | 'emotional_response';
  confidence: number;
  lastUpdated: Date;
}

export interface EmotionalState {
  empathy: number;
  enthusiasm: number;
  patience: number;
  creativity: number;
  analytical: number;
}

// UI/UX Adaptation Types
export interface AdaptiveUIConfig {
  userId: string;
  preferences: UserPreferences;
  behaviorPattern: BehaviorPattern;
  adaptationHistory: AdaptationEvent[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  layout: 'compact' | 'spacious' | 'minimal';
  complexity: 'beginner' | 'intermediate' | 'expert';
  interactionStyle: 'guided' | 'autonomous' | 'hybrid';
}

export interface BehaviorPattern {
  primaryTasks: string[];
  usageFrequency: number;
  preferredTools: string[];
  errorPatterns: string[];
  learningSpeed: number;
}

export interface AdaptationEvent {
  timestamp: Date;
  trigger: string;
  adaptation: string;
  effectiveness: number;
}

// Dynamic Tool Generation Types
export interface ToolRequest {
  id: string;
  userId: string;
  description: string;
  requirements: ToolRequirement[];
  context: RequestContext;
  timestamp: Date;
}

export interface ToolRequirement {
  type: 'functional' | 'performance' | 'integration' | 'ui';
  specification: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RequestContext {
  currentProject: string;
  workflowStage: string;
  availableResources: string[];
  timeConstraints: number;
}

export interface GeneratedTool {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  code: string;
  dependencies: string[];
  emotionalTone: EmotionalTone;
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
  effectiveness: number;
}

export interface EmotionalTone {
  supportive: number;
  encouraging: number;
  professional: number;
  playful: number;
  empathetic: number;
}

// Gata-OS Integration Types
export interface GataOSConnection {
  id: string;
  endpoint: string;
  isConnected: boolean;
  capabilities: string[];
  version: string;
}

export interface CrossEnvironmentSession {
  sessionId: string;
  environments: string[];
  sharedState: Record<string, unknown>;
  permissions: Permission[];
}

export interface Permission {
  action: string;
  resource: string;
  granted: boolean;
  expiresAt?: Date;
}

// Blockchain and Decentralized Infrastructure Types
export interface BlockchainConfig {
  network: string;
  contractAddress: string;
  gasLimit: number;
  confirmations: number;
}

export interface MiningConsent {
  userId: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  resourceLimits: ResourceLimits;
  rewardsAddress: string;
}

export interface ResourceLimits {
  maxCpuUsage: number;
  maxMemoryUsage: number;
  maxBandwidth: number;
  allowedHours: number[];
}

export interface DistributedTask {
  id: string;
  type: 'ai_training' | 'data_processing' | 'computation' | 'validation';
  payload: unknown;
  requirements: TaskRequirements;
  rewards: number;
  status: 'pending' | 'assigned' | 'processing' | 'completed' | 'failed';
}

export interface TaskRequirements {
  minCpuPower: number;
  minMemory: number;
  estimatedTime: number;
  securityLevel: 'low' | 'medium' | 'high';
}

// API and Integration Types
export interface APICredentials {
  provider: string;
  apiKey: string;
  secret?: string;
  endpoint: string;
  rateLimit: number;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'ai_engine' | 'blockchain' | 'storage' | 'compute' | 'analytics';
  credentials: APICredentials;
  isActive: boolean;
  lastHealthCheck: Date;
}

// Event System Types
export interface PlatformEvent {
  id: string;
  type: string;
  source: string;
  data: unknown;
  timestamp: Date;
  processed: boolean;
}

export interface EventHandler {
  eventType: string;
  handler: (event: PlatformEvent) => Promise<void>;
  priority: number;
}

// Configuration Types
export interface PlatformConfig {
  server: ServerConfig;
  ai: AIConfig;
  blockchain: BlockchainConfig;
  ui: UIConfig;
  security: SecurityConfig;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: boolean;
  rateLimit: number;
}

export interface AIConfig {
  defaultEngine: string;
  maxConcurrentRequests: number;
  responseTimeout: number;
  learningEnabled: boolean;
}

export interface UIConfig {
  adaptationEnabled: boolean;
  adaptationInterval: number;
  maxAdaptations: number;
}

export interface SecurityConfig {
  encryptionKey: string;
  tokenExpiry: number;
  maxLoginAttempts: number;
}