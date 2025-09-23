import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';

import { SelfEvolvingCore } from '../core/intelligence';
import { AdaptiveUISystem } from '../ui/adaptive-ui';
import { DynamicToolGenerator } from '../tools/dynamic-generator';
import { AIEngineManager } from '../ai/engine-manager';
import { GataOSIntegration } from '../gata-os/integration';
import { DecentralizedInfrastructure } from '../blockchain/infrastructure';

import {
  PlatformConfig,
  ToolRequest,
  UserPreferences,
  AIEngine,
  APICredentials,
} from '../types';

/**
 * Ultra-MetaVerse AI Platform
 * Main orchestrator that integrates all platform components
 */
export class UltraMetaVersePlatform extends EventEmitter {
  private app: express.Application;
  private server: any;
  private wsServer?: WebSocketServer;
  private config: PlatformConfig;

  // Core components
  private intelligenceCore!: SelfEvolvingCore;
  private adaptiveUI!: AdaptiveUISystem;
  private toolGenerator!: DynamicToolGenerator;
  private aiManager!: AIEngineManager;
  private gataOSIntegration!: GataOSIntegration;
  private decentralizedInfra!: DecentralizedInfrastructure;

  // Connection management
  private connectedClients: Map<string, WebSocket> = new Map();
  private userSessions: Map<string, UserSession> = new Map();

  constructor(config?: Partial<PlatformConfig>) {
    super();
    
    this.config = this.mergeConfig(config);
    this.app = express();
    
    this.initializeComponents();
    this.setupExpressApp();
    this.setupWebSocketServer();
    this.setupEventHandlers();
  }

  private mergeConfig(userConfig?: Partial<PlatformConfig>): PlatformConfig {
    const defaultConfig: PlatformConfig = {
      server: {
        port: parseInt(process.env.PORT || '8080'),
        host: process.env.HOST || 'localhost',
        cors: true,
        rateLimit: 100,
      },
      ai: {
        defaultEngine: 'openai-gpt',
        maxConcurrentRequests: 10,
        responseTimeout: 30000,
        learningEnabled: true,
      },
      blockchain: {
        network: 'ethereum-sepolia',
        contractAddress: '0x' + '0'.repeat(40),
        gasLimit: 500000,
        confirmations: 3,
      },
      ui: {
        adaptationEnabled: true,
        adaptationInterval: 60000,
        maxAdaptations: 100,
      },
      security: {
        encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
        tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
        maxLoginAttempts: 5,
      },
    };

    return { ...defaultConfig, ...userConfig };
  }

  private initializeComponents(): void {
    console.log('🚀 Initializing Ultra-MetaVerse AI Platform components...');

    // Initialize core intelligence
    this.intelligenceCore = new SelfEvolvingCore();
    console.log('✅ Self-Evolving Intelligence Core initialized');

    // Initialize adaptive UI system
    this.adaptiveUI = new AdaptiveUISystem();
    console.log('✅ Adaptive UI/UX System initialized');

    // Initialize dynamic tool generator
    this.toolGenerator = new DynamicToolGenerator();
    console.log('✅ Dynamic Tool Generation Engine initialized');

    // Initialize AI engine manager
    this.aiManager = new AIEngineManager();
    console.log('✅ AI Engine Manager initialized');

    // Initialize Gata-OS integration
    this.gataOSIntegration = new GataOSIntegration();
    console.log('✅ Gata-OS Integration initialized');

    // Initialize decentralized infrastructure
    this.decentralizedInfra = new DecentralizedInfrastructure();
    console.log('✅ Decentralized Infrastructure initialized');
  }

  private setupExpressApp(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS middleware
    if (this.config.server.cors) {
      this.app.use(cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
      }));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // API routes
    this.setupAPIRoutes();

    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  private setupAPIRoutes(): void {
    const router = express.Router();

    // Platform status
    router.get('/status', (_req, res) => {
      res.json({
        status: 'operational',
        version: '1.0.0',
        components: {
          intelligence: 'active',
          adaptiveUI: 'active',
          toolGenerator: 'active',
          aiManager: 'active',
          gataOS: this.gataOSIntegration.getConnectionStatus()?.isConnected ? 'connected' : 'disconnected',
          blockchain: this.decentralizedInfra.isReady() ? 'active' : 'initializing',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // User management
    router.post('/users/:userId/session', (req, res) => {
      const { userId } = req.params;
      const { preferences } = req.body;
      
      const session = this.createUserSession(userId, preferences);
      res.json({ session });
    });

    router.get('/users/:userId/config', (req, res) => {
      const { userId } = req.params;
      const config = this.adaptiveUI.getUserConfig(userId);
      
      if (!config) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ config });
    });

    // Tool generation
    router.post('/tools/generate', async (req, res) => {
      try {
        const { description, requirements, context, userId } = req.body;
        
        const toolRequest: ToolRequest = {
          id: uuidv4(),
          userId,
          description,
          requirements: requirements || [],
          context: context || {},
          timestamp: new Date(),
        };

        const emotionalState = this.intelligenceCore.getEmotionalResponse(description);
        const tool = await this.toolGenerator.generateTool(toolRequest, emotionalState);
        
        res.json({ tool });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    router.get('/tools/:toolId', (req, res) => {
      const { toolId } = req.params;
      const tool = this.toolGenerator.getGeneratedTool(toolId);
      
      if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
      }
      
      return res.json({ tool });
    });

    // AI engine management
    router.get('/ai/engines', (_req, res) => {
      const engines = this.aiManager.getAvailableEngines();
      const activeEngine = this.aiManager.getActiveEngine();
      
      return res.json({ engines, activeEngine });
    });

    router.post('/ai/engines/:engineId/activate', (req, res) => {
      const { engineId } = req.params;
      const success = this.aiManager.setActiveEngine(engineId);
      
      if (!success) {
        return res.status(404).json({ error: 'Engine not found' });
      }
      
      return res.json({ success: true });
    });

    router.post('/ai/engines/:engineId/credentials', (req, res) => {
      const { engineId } = req.params;
      const { credentials } = req.body;
      
      const success = this.aiManager.updateEngineCredentials(engineId, credentials);
      
      if (!success) {
        return res.status(404).json({ error: 'Engine not found' });
      }
      
      return res.json({ success: true });
    });

    // Gata-OS integration
    router.get('/gata-os/status', (req, res) => {
      const status = this.gataOSIntegration.getConnectionStatus();
      const capabilities = this.gataOSIntegration.getCapabilities();
      
      res.json({ status, capabilities });
    });

    router.post('/gata-os/sessions', async (req, res) => {
      try {
        const { environments, initialState } = req.body;
        const session = await this.gataOSIntegration.createCrossEnvironmentSession(
          environments,
          initialState
        );
        
        res.json({ session });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Blockchain and distributed computing
    router.get('/blockchain/stats', (req, res) => {
      const stats = this.decentralizedInfra.getNetworkStats();
      const config = this.decentralizedInfra.getBlockchainConfig();
      
      res.json({ stats, config });
    });

    router.post('/blockchain/mining-consent', async (req, res) => {
      try {
        const { userId, resourceLimits, rewardsAddress } = req.body;
        const consent = await this.decentralizedInfra.requestMiningConsent(
          userId,
          resourceLimits,
          rewardsAddress
        );
        
        res.json({ consent });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    router.post('/distributed/tasks', async (req, res) => {
      try {
        const { type, payload, requirements, rewards } = req.body;
        const task = await this.decentralizedInfra.submitDistributedTask(
          type,
          payload,
          requirements,
          rewards
        );
        
        res.json({ task });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Intelligence insights
    router.get('/intelligence/state', (req, res) => {
      const state = this.intelligenceCore.getIntelligenceState();
      res.json({ state });
    });

    router.post('/intelligence/learn', (req, res) => {
      const { userId, preferences, behavior } = req.body;
      this.intelligenceCore.learnFromUser(userId, preferences, behavior);
      
      res.json({ success: true });
    });

    this.app.use('/api', router);

    // Serve static files for web interface
    this.app.use(express.static('public'));

    // Default route
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Ultra-MetaVerse AI Platform',
        version: '1.0.0',
        description: 'AI-powered development platform with self-evolving intelligence',
        endpoints: {
          status: '/api/status',
          docs: '/api/docs',
          websocket: `ws://${this.config.server.host}:${this.config.server.port}/ws`,
        },
      });
    });
  }

  private setupWebSocketServer(): void {
    this.wsServer = new WebSocketServer({ noServer: true });

    this.wsServer.on('connection', (ws: WebSocket, request) => {
      const clientId = uuidv4();
      this.connectedClients.set(clientId, ws);

      console.log(`🔗 Client connected: ${clientId}`);

      ws.on('message', (data) => {
        this.handleWebSocketMessage(clientId, data);
      });

      ws.on('close', () => {
        this.connectedClients.delete(clientId);
        console.log(`🔌 Client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        data: {
          clientId,
          platform: 'Ultra-MetaVerse AI Platform',
          version: '1.0.0',
        },
      });
    });
  }

  private handleWebSocketMessage(clientId: string, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'track-interaction':
          this.handleTrackInteraction(clientId, message.data);
          break;
        case 'request-adaptation':
          this.handleRequestAdaptation(clientId, message.data);
          break;
        case 'ai-request':
          this.handleAIRequest(clientId, message.data);
          break;
        case 'tool-usage':
          this.handleToolUsage(clientId, message.data);
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message from ${clientId}:`, error);
    }
  }

  private handleTrackInteraction(clientId: string, data: any): void {
    const { userId, interaction } = data;
    
    if (userId) {
      this.adaptiveUI.trackInteraction(userId, interaction);
    }
  }

  private handleRequestAdaptation(clientId: string, data: any): void {
    const { userId } = data;
    
    if (userId) {
      const emotionalState = this.intelligenceCore.getEmotionalResponse('adaptation-request');
      const adaptation = this.adaptiveUI.adaptToEmotionalContext(userId, emotionalState);
      
      this.sendToClient(clientId, {
        type: 'adaptation-response',
        data: { userId, adaptation },
      });
    }
  }

  private async handleAIRequest(clientId: string, data: any): Promise<void> {
    try {
      const response = await this.aiManager.sendRequest(data);
      
      this.sendToClient(clientId, {
        type: 'ai-response',
        data: { requestId: data.id, response },
      });
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'ai-error',
        data: { requestId: data.id, error: (error as Error).message },
      });
    }
  }

  private handleToolUsage(clientId: string, data: any): void {
    const { toolId, effectiveness, context } = data;
    
    this.toolGenerator.updateToolUsage(toolId, effectiveness);
    this.intelligenceCore.learnFromToolUsage(toolId, effectiveness, context);
  }

  private setupEventHandlers(): void {
    // Intelligence core events
    this.intelligenceCore.on('evolution', (data) => {
      this.broadcastToClients({
        type: 'intelligence-evolution',
        data,
      });
    });

    this.intelligenceCore.on('adaptation-required', (data) => {
      this.handleIntelligenceAdaptation(data);
    });

    // Adaptive UI events
    this.adaptiveUI.on('interface-adapted', (data) => {
      this.broadcastToClients({
        type: 'interface-adapted',
        data,
      });
    });

    // Tool generator events
    this.toolGenerator.on('tool-generated', (data) => {
      this.broadcastToClients({
        type: 'tool-generated',
        data,
      });
    });

    // AI manager events
    this.aiManager.on('engine-activated', (data) => {
      this.broadcastToClients({
        type: 'ai-engine-activated',
        data,
      });
    });

    // Gata-OS events
    this.gataOSIntegration.on('gata-os-connected', (data) => {
      console.log('🌐 Gata-OS connected:', data);
      this.broadcastToClients({
        type: 'gata-os-connected',
        data,
      });
    });

    this.gataOSIntegration.on('environment-change', (data) => {
      this.broadcastToClients({
        type: 'environment-change',
        data,
      });
    });

    // Blockchain events
    this.decentralizedInfra.on('task-completed', (data) => {
      this.broadcastToClients({
        type: 'distributed-task-completed',
        data,
      });
    });

    this.decentralizedInfra.on('rewards-distributed', (data) => {
      this.broadcastToClients({
        type: 'rewards-distributed',
        data,
      });
    });
  }

  private handleIntelligenceAdaptation(data: any): void {
    // Handle suggestions from the intelligence core
    data.suggestedActions.forEach((action: string) => {
      switch (action) {
        case 'improve-user-interaction':
          this.optimizeUserInteractions();
          break;
        case 'enhance-emotional-responses':
          this.enhanceEmotionalResponses();
          break;
        case 'optimize-tool-generation':
          this.optimizeToolGeneration();
          break;
        case 'optimize-processing-pipeline':
          this.optimizeProcessingPipeline();
          break;
      }
    });
  }

  private optimizeUserInteractions(): void {
    // Implement user interaction optimizations
    console.log('🎯 Optimizing user interactions...');
  }

  private enhanceEmotionalResponses(): void {
    // Enhance emotional responsiveness
    console.log('💝 Enhancing emotional responses...');
  }

  private optimizeToolGeneration(): void {
    // Optimize tool generation process
    console.log('🛠️ Optimizing tool generation...');
  }

  private optimizeProcessingPipeline(): void {
    // Optimize processing pipeline
    console.log('⚡ Optimizing processing pipeline...');
  }

  private createUserSession(userId: string, preferences?: Partial<UserPreferences>): UserSession {
    const session: UserSession = {
      id: uuidv4(),
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    };

    this.userSessions.set(session.id, session);

    // Register user with adaptive UI
    this.adaptiveUI.registerUser(userId, preferences);

    return session;
  }

  private sendToClient(clientId: string, message: any): void {
    const client = this.connectedClients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private broadcastToClients(message: any): void {
    this.connectedClients.forEach((client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  private errorHandler(error: any, req: express.Request, res: express.Response, next: express.NextFunction): void {
    console.error('Express error:', error);
    
    res.status(error.status || 500).json({
      error: (error as Error).message || 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Start the platform
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.server.port, this.config.server.host, () => {
          console.log(`🌟 Ultra-MetaVerse AI Platform started!`);
          console.log(`🚀 Server running on http://${this.config.server.host}:${this.config.server.port}`);
          console.log(`🔌 WebSocket server ready for connections`);
          console.log(`📡 API available at http://${this.config.server.host}:${this.config.server.port}/api`);
          
          this.emit('platform-started');
          resolve();
        });

        // Handle WebSocket upgrade
        this.server.on('upgrade', (request: any, socket: any, head: any) => {
          const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
          
          if (pathname === '/ws' && this.wsServer) {
            this.wsServer.handleUpgrade(request, socket, head, (ws) => {
              this.wsServer!.emit('connection', ws, request);
            });
          } else {
            socket.destroy();
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the platform
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 Ultra-MetaVerse AI Platform stopped');
          this.emit('platform-stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get platform configuration
   */
  public getConfig(): PlatformConfig {
    return { ...this.config };
  }

  /**
   * Get component instances (for advanced usage)
   */
  public getComponents() {
    return {
      intelligenceCore: this.intelligenceCore,
      adaptiveUI: this.adaptiveUI,
      toolGenerator: this.toolGenerator,
      aiManager: this.aiManager,
      gataOSIntegration: this.gataOSIntegration,
      decentralizedInfra: this.decentralizedInfra,
    };
  }

  /**
   * Register external AI engine
   */
  public registerAIEngine(engine: AIEngine, credentials: APICredentials): void {
    this.aiManager.registerEngine(engine, credentials);
  }

  /**
   * Get platform statistics
   */
  public getStats(): PlatformStats {
    return {
      connectedClients: this.connectedClients.size,
      activeSessions: this.userSessions.size,
      intelligenceState: this.intelligenceCore.getIntelligenceState(),
      networkStats: this.decentralizedInfra.getNetworkStats(),
      aiEngines: this.aiManager.getAvailableEngines().length,
      gataOSConnected: this.gataOSIntegration.getConnectionStatus()?.isConnected || false,
      uptime: process.uptime(),
    };
  }
}

// Supporting interfaces
interface UserSession {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

interface PlatformStats {
  connectedClients: number;
  activeSessions: number;
  intelligenceState: any;
  networkStats: any;
  aiEngines: number;
  gataOSConnected: boolean;
  uptime: number;
}