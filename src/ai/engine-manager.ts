import { EventEmitter } from 'eventemitter3';
import axios, { AxiosResponse } from 'axios';
import { AIEngine, APICredentials, IntegrationConfig } from '../types';

/**
 * AI Engine Integration Framework
 * Manages multiple AI engines and provides unified interface
 */
export class AIEngineManager extends EventEmitter {
  private engines: Map<string, AIEngine> = new Map();
  private integrations: Map<string, IntegrationConfig> = new Map();
  private activeEngine: string | undefined;
  private requestQueue: AIRequest[] = [];
  private isProcessing = false;
  private rateLimits: Map<string, RateLimit> = new Map();

  constructor() {
    super();
    this.initializeBuiltInEngines();
    this.startRequestProcessor();
    this.startHealthChecks();
  }

  private initializeBuiltInEngines(): void {
    // Add support for popular AI engines
    const builtInEngines: Partial<AIEngine>[] = [
      {
        id: 'openai-gpt',
        name: 'OpenAI GPT',
        version: '4.0',
        capabilities: ['text-generation', 'code-generation', 'conversation', 'analysis'],
        apiEndpoint: 'https://api.openai.com/v1',
        isActive: false,
      },
      {
        id: 'anthropic-claude',
        name: 'Anthropic Claude',
        version: '3.0',
        capabilities: ['text-generation', 'analysis', 'conversation', 'reasoning'],
        apiEndpoint: 'https://api.anthropic.com/v1',
        isActive: false,
      },
      {
        id: 'google-palm',
        name: 'Google PaLM',
        version: '2.0',
        capabilities: ['text-generation', 'code-generation', 'analysis'],
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
        isActive: false,
      },
      {
        id: 'huggingface-transformers',
        name: 'Hugging Face Transformers',
        version: '4.21',
        capabilities: ['text-generation', 'classification', 'translation'],
        apiEndpoint: 'https://api-inference.huggingface.co',
        isActive: false,
      },
      {
        id: 'cohere-command',
        name: 'Cohere Command',
        version: '1.0',
        capabilities: ['text-generation', 'classification', 'summarization'],
        apiEndpoint: 'https://api.cohere.ai/v1',
        isActive: false,
      },
    ];

    builtInEngines.forEach(engine => {
      if (engine.id) {
        this.engines.set(engine.id, engine as AIEngine);
      }
    });
  }

  private startRequestProcessor(): void {
    setInterval(() => {
      this.processRequestQueue();
    }, 100); // Process every 100ms
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, 300000); // Every 5 minutes
  }

  /**
   * Register a new AI engine
   */
  public registerEngine(engine: AIEngine, credentials?: APICredentials): void {
    this.engines.set(engine.id, engine);

    if (credentials) {
      const integration: IntegrationConfig = {
        id: engine.id,
        name: engine.name,
        type: 'ai_engine',
        credentials,
        isActive: true,
        lastHealthCheck: new Date(),
      };
      
      this.integrations.set(engine.id, integration);
    }

    this.emit('engine-registered', { engine });
  }

  /**
   * Set active AI engine
   */
  public setActiveEngine(engineId: string): boolean {
    const engine = this.engines.get(engineId);
    if (!engine) {
      console.warn(`Engine ${engineId} not found`);
      return false;
    }

    this.activeEngine = engineId;
    engine.isActive = true;

    // Deactivate other engines
    for (const [id, eng] of this.engines) {
      if (id !== engineId) {
        eng.isActive = false;
      }
    }

    this.emit('engine-activated', { engineId, engine });
    return true;
  }

  /**
   * Send request to AI engine
   */
  public async sendRequest(request: AIRequest): Promise<AIResponse> {
    // Add to queue for rate limiting and processing
    request.id = request.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    request.timestamp = new Date();
    
    this.requestQueue.push(request);
    
    return new Promise((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
    });
  }

  private async processRequestQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const request = this.requestQueue.shift();
      if (request) {
        await this.processRequest(request);
      }
    } catch (error) {
      console.error('Request processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processRequest(request: AIRequest): Promise<void> {
    try {
      // Determine which engine to use
      const engineId = request.preferredEngine || this.activeEngine || this.getBestEngine(request);
      
      if (!engineId) {
        throw new Error('No suitable AI engine available');
      }

      // Check rate limits
      if (!this.checkRateLimit(engineId)) {
        // Re-queue the request
        this.requestQueue.unshift(request);
        return;
      }

      // Process the request
      const response = await this.executeRequest(engineId, request);
      
      // Update rate limits
      this.updateRateLimit(engineId);
      
      // Resolve the promise
      if (request.resolve) {
        request.resolve(response);
      }

      this.emit('request-completed', { request, response });

    } catch (error) {
      if (request.reject) {
        request.reject(error as Error);
      }
      
      this.emit('request-failed', { request, error: (error as Error).message });
    }
  }

  private async executeRequest(engineId: string, request: AIRequest): Promise<AIResponse> {
    const engine = this.engines.get(engineId);
    const integration = this.integrations.get(engineId);

    if (!engine || !integration) {
      throw new Error(`Engine ${engineId} not properly configured`);
    }

    // Build request based on engine type
    const engineRequest = this.buildEngineRequest(engine, request);
    
    // Send request to AI engine
    const startTime = Date.now();
    
    try {
      const axiosResponse = await axios(engineRequest);
      const endTime = Date.now();
      
      // Parse response based on engine type
      const response = this.parseEngineResponse(engine, axiosResponse, request);
      response.processingTime = endTime - startTime;
      response.engineId = engineId;
      
      return response;

    } catch (error: any) {
      throw new Error(`AI engine ${engineId} request failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private buildEngineRequest(engine: AIEngine, request: AIRequest): any {
    const integration = this.integrations.get(engine.id);
    if (!integration) {
      throw new Error(`No integration config for engine ${engine.id}`);
    }

    const baseConfig = {
      timeout: 30000,
      headers: this.buildHeaders(engine, integration),
    };

    switch (engine.id) {
      case 'openai-gpt':
        return {
          ...baseConfig,
          method: 'POST',
          url: `${engine.apiEndpoint}/chat/completions`,
          data: {
            model: request.model || 'gpt-4',
            messages: this.formatMessagesForOpenAI(request),
            max_tokens: request.maxTokens || 2000,
            temperature: request.temperature || 0.7,
            top_p: request.topP || 1,
            frequency_penalty: request.frequencyPenalty || 0,
            presence_penalty: request.presencePenalty || 0,
          },
        };

      case 'anthropic-claude':
        return {
          ...baseConfig,
          method: 'POST',
          url: `${engine.apiEndpoint}/messages`,
          data: {
            model: request.model || 'claude-3-sonnet-20240229',
            messages: this.formatMessagesForAnthropic(request),
            max_tokens: request.maxTokens || 2000,
            temperature: request.temperature || 0.7,
          },
        };

      case 'google-palm':
        return {
          ...baseConfig,
          method: 'POST',
          url: `${engine.apiEndpoint}/models/text-bison:generateText`,
          data: {
            prompt: {
              text: this.formatPromptForPaLM(request),
            },
            temperature: request.temperature || 0.7,
            candidateCount: 1,
            maxOutputTokens: request.maxTokens || 2000,
          },
        };

      case 'huggingface-transformers':
        return {
          ...baseConfig,
          method: 'POST',
          url: `${engine.apiEndpoint}/models/${request.model || 'gpt2'}`,
          data: {
            inputs: this.formatInputsForHuggingFace(request),
            parameters: {
              max_length: request.maxTokens || 2000,
              temperature: request.temperature || 0.7,
              do_sample: true,
            },
          },
        };

      case 'cohere-command':
        return {
          ...baseConfig,
          method: 'POST',
          url: `${engine.apiEndpoint}/generate`,
          data: {
            model: request.model || 'command',
            prompt: this.formatPromptForCohere(request),
            max_tokens: request.maxTokens || 2000,
            temperature: request.temperature || 0.7,
            p: request.topP || 1,
          },
        };

      default:
        throw new Error(`Unsupported engine: ${engine.id}`);
    }
  }

  private buildHeaders(engine: AIEngine, integration: IntegrationConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Ultra-MetaVerse-AI-Platform/1.0',
    };

    switch (engine.id) {
      case 'openai-gpt':
        headers['Authorization'] = `Bearer ${integration.credentials.apiKey}`;
        break;
      case 'anthropic-claude':
        headers['x-api-key'] = integration.credentials.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'google-palm':
        headers['Authorization'] = `Bearer ${integration.credentials.apiKey}`;
        break;
      case 'huggingface-transformers':
        headers['Authorization'] = `Bearer ${integration.credentials.apiKey}`;
        break;
      case 'cohere-command':
        headers['Authorization'] = `Bearer ${integration.credentials.apiKey}`;
        break;
    }

    return headers;
  }

  private formatMessagesForOpenAI(request: AIRequest): any[] {
    if (request.messages) {
      return request.messages;
    }
    
    return [
      { role: 'system', content: request.systemPrompt || 'You are a helpful AI assistant.' },
      { role: 'user', content: request.prompt }
    ];
  }

  private formatMessagesForAnthropic(request: AIRequest): any[] {
    if (request.messages) {
      return request.messages.filter(msg => msg.role !== 'system');
    }
    
    return [{ role: 'user', content: request.prompt }];
  }

  private formatPromptForPaLM(request: AIRequest): string {
    if (request.systemPrompt) {
      return `${request.systemPrompt}\n\nUser: ${request.prompt}\nAssistant:`;
    }
    return request.prompt;
  }

  private formatInputsForHuggingFace(request: AIRequest): string {
    return request.prompt;
  }

  private formatPromptForCohere(request: AIRequest): string {
    if (request.systemPrompt) {
      return `${request.systemPrompt}\n\n${request.prompt}`;
    }
    return request.prompt;
  }

  private parseEngineResponse(engine: AIEngine, axiosResponse: AxiosResponse, request: AIRequest): AIResponse {
    const baseResponse: AIResponse = {
      id: `resp-${Date.now()}`,
      requestId: request.id!,
      engineId: engine.id,
      content: '',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      processingTime: 0,
      timestamp: new Date(),
    };

    switch (engine.id) {
      case 'openai-gpt':
        const openaiData = axiosResponse.data;
        return {
          ...baseResponse,
          content: openaiData.choices[0]?.message?.content || '',
          usage: {
            promptTokens: openaiData.usage?.prompt_tokens || 0,
            completionTokens: openaiData.usage?.completion_tokens || 0,
            totalTokens: openaiData.usage?.total_tokens || 0,
          },
          model: openaiData.model,
          finishReason: openaiData.choices[0]?.finish_reason,
        };

      case 'anthropic-claude':
        const anthropicData = axiosResponse.data;
        return {
          ...baseResponse,
          content: anthropicData.content[0]?.text || '',
          usage: {
            promptTokens: anthropicData.usage?.input_tokens || 0,
            completionTokens: anthropicData.usage?.output_tokens || 0,
            totalTokens: (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0),
          },
          model: anthropicData.model,
          finishReason: anthropicData.stop_reason,
        };

      case 'google-palm':
        const palmData = axiosResponse.data;
        return {
          ...baseResponse,
          content: palmData.candidates[0]?.output || '',
          model: 'text-bison',
        };

      case 'huggingface-transformers':
        const hfData = axiosResponse.data;
        return {
          ...baseResponse,
          content: Array.isArray(hfData) ? hfData[0]?.generated_text || '' : hfData.generated_text || '',
        };

      case 'cohere-command':
        const cohereData = axiosResponse.data;
        return {
          ...baseResponse,
          content: cohereData.generations[0]?.text || '',
          usage: {
            promptTokens: cohereData.meta?.billed_units?.input_tokens || 0,
            completionTokens: cohereData.meta?.billed_units?.output_tokens || 0,
            totalTokens: (cohereData.meta?.billed_units?.input_tokens || 0) + (cohereData.meta?.billed_units?.output_tokens || 0),
          },
        };

      default:
        return {
          ...baseResponse,
          content: JSON.stringify(axiosResponse.data),
        };
    }
  }

  private getBestEngine(request: AIRequest): string | undefined {
    // Find the best engine based on request requirements and capabilities
    const requiredCapabilities = request.requiredCapabilities || [];
    const availableEngines = Array.from(this.engines.values()).filter(engine => {
      const hasIntegration = this.integrations.has(engine.id);
      const hasCapabilities = requiredCapabilities.every(cap => engine.capabilities.includes(cap));
      return hasIntegration && hasCapabilities;
    });

    if (availableEngines.length === 0) {
      return undefined;
    }

    // For now, return the first available engine
    // In the future, could implement more sophisticated selection logic
    return availableEngines[0]?.id;
  }

  private checkRateLimit(engineId: string): boolean {
    const rateLimit = this.rateLimits.get(engineId);
    if (!rateLimit) {
      // Initialize rate limit
      this.rateLimits.set(engineId, {
        requests: 0,
        windowStart: Date.now(),
        maxRequests: 60, // Default: 60 requests per minute
        windowSize: 60000, // 1 minute
      });
      return true;
    }

    const now = Date.now();
    
    // Reset window if expired
    if (now - rateLimit.windowStart >= rateLimit.windowSize) {
      rateLimit.requests = 0;
      rateLimit.windowStart = now;
    }

    // Check if under limit
    return rateLimit.requests < rateLimit.maxRequests;
  }

  private updateRateLimit(engineId: string): void {
    const rateLimit = this.rateLimits.get(engineId);
    if (rateLimit) {
      rateLimit.requests++;
    }
  }

  private async performHealthChecks(): Promise<void> {
    for (const [engineId, integration] of this.integrations) {
      try {
        const isHealthy = await this.checkEngineHealth(engineId);
        const engine = this.engines.get(engineId);
        
        if (engine) {
          engine.isActive = isHealthy;
          integration.lastHealthCheck = new Date();
        }

        this.emit('health-check', { engineId, isHealthy });

      } catch (error) {
        console.error(`Health check failed for engine ${engineId}:`, error);
        
        const engine = this.engines.get(engineId);
        if (engine) {
          engine.isActive = false;
        }
      }
    }
  }

  private async checkEngineHealth(engineId: string): Promise<boolean> {
    try {
      // Send a simple test request to verify the engine is responding
      const testRequest: AIRequest = {
        id: `health-${engineId}-${Date.now()}`,
        prompt: 'Hello',
        maxTokens: 10,
        temperature: 0.1,
        timestamp: new Date(),
      };

      const response = await this.executeRequest(engineId, testRequest);
      return response.content.length > 0;

    } catch (error) {
      return false;
    }
  }

  /**
   * Get available engines
   */
  public getAvailableEngines(): AIEngine[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get active engine
   */
  public getActiveEngine(): AIEngine | undefined {
    if (!this.activeEngine) return undefined;
    return this.engines.get(this.activeEngine);
  }

  /**
   * Get engine by ID
   */
  public getEngine(engineId: string): AIEngine | undefined {
    return this.engines.get(engineId);
  }

  /**
   * Update engine credentials
   */
  public updateEngineCredentials(engineId: string, credentials: APICredentials): boolean {
    const integration = this.integrations.get(engineId);
    if (!integration) {
      return false;
    }

    integration.credentials = credentials;
    this.integrations.set(engineId, integration);
    
    this.emit('credentials-updated', { engineId });
    return true;
  }

  /**
   * Remove engine
   */
  public removeEngine(engineId: string): boolean {
    const removed = this.engines.delete(engineId);
    this.integrations.delete(engineId);
    this.rateLimits.delete(engineId);

    if (this.activeEngine === engineId) {
      this.activeEngine = undefined;
    }

    if (removed) {
      this.emit('engine-removed', { engineId });
    }

    return removed;
  }

  /**
   * Get request queue status
   */
  public getQueueStatus(): QueueStatus {
    return {
      pending: this.requestQueue.length,
      processing: this.isProcessing,
      rateLimits: Object.fromEntries(this.rateLimits),
    };
  }
}

// Supporting interfaces
interface AIRequest {
  id?: string;
  prompt: string;
  systemPrompt?: string;
  messages?: Array<{ role: string; content: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  preferredEngine?: string;
  requiredCapabilities?: string[];
  timestamp?: Date;
  resolve?: (response: AIResponse) => void;
  reject?: (error: Error) => void;
}

interface AIResponse {
  id: string;
  requestId: string;
  engineId: string;
  content: string;
  usage: TokenUsage;
  processingTime: number;
  timestamp: Date;
  model?: string;
  finishReason?: string;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface RateLimit {
  requests: number;
  windowStart: number;
  maxRequests: number;
  windowSize: number;
}

interface QueueStatus {
  pending: number;
  processing: boolean;
  rateLimits: Record<string, RateLimit>;
}