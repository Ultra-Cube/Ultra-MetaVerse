#!/usr/bin/env node

import dotenv from 'dotenv';
import { UltraMetaVersePlatform } from './core/platform';
import { PlatformConfig } from './types';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Ultra-MetaVerse AI Platform
 */
async function main(): Promise<void> {
  try {
    console.log('🌌 Ultra-MetaVerse AI Platform v1.0.0');
    console.log('🚀 Starting AI-powered development platform...\n');

    // Platform configuration
    const config: Partial<PlatformConfig> = {
      server: {
        port: parseInt(process.env.PORT || '8080'),
        host: process.env.HOST || 'localhost',
        cors: true,
        rateLimit: 100,
      },
      ai: {
        defaultEngine: process.env.DEFAULT_AI_ENGINE || 'openai-gpt',
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
        responseTimeout: parseInt(process.env.AI_RESPONSE_TIMEOUT || '30000'),
        learningEnabled: process.env.LEARNING_ENABLED !== 'false',
      },
      blockchain: {
        network: process.env.BLOCKCHAIN_NETWORK || 'ethereum-sepolia',
        contractAddress: process.env.CONTRACT_ADDRESS || '0x' + '0'.repeat(40),
        gasLimit: parseInt(process.env.GAS_LIMIT || '500000'),
        confirmations: parseInt(process.env.CONFIRMATIONS || '3'),
      },
      ui: {
        adaptationEnabled: process.env.ADAPTATION_ENABLED !== 'false',
        adaptationInterval: parseInt(process.env.ADAPTATION_INTERVAL || '60000'),
        maxAdaptations: parseInt(process.env.MAX_ADAPTATIONS || '100'),
      },
      security: {
        encryptionKey: process.env.ENCRYPTION_KEY || 'change-this-in-production',
        tokenExpiry: parseInt(process.env.TOKEN_EXPIRY || String(24 * 60 * 60 * 1000)),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      },
    };

    // Create and start the platform
    const platform = new UltraMetaVersePlatform(config);

    // Set up graceful shutdown
    setupGracefulShutdown(platform);

    // Register AI engines if credentials are provided
    registerAIEngines(platform);

    // Set up platform event listeners
    setupEventListeners(platform);

    // Start the platform
    await platform.start();

    // Display startup information
    displayStartupInfo(platform);

  } catch (error) {
    console.error('❌ Failed to start Ultra-MetaVerse AI Platform:', error);
    process.exit(1);
  }
}

/**
 * Register AI engines with provided credentials
 */
function registerAIEngines(platform: UltraMetaVersePlatform): void {
  const { aiManager } = platform.getComponents();

  // OpenAI GPT
  if (process.env.OPENAI_API_KEY) {
    aiManager.updateEngineCredentials('openai-gpt', {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: 'https://api.openai.com/v1',
      rateLimit: 60,
    });
    console.log('✅ OpenAI GPT engine configured');
  }

  // Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    aiManager.updateEngineCredentials('anthropic-claude', {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      endpoint: 'https://api.anthropic.com/v1',
      rateLimit: 60,
    });
    console.log('✅ Anthropic Claude engine configured');
  }

  // Google PaLM
  if (process.env.GOOGLE_API_KEY) {
    aiManager.updateEngineCredentials('google-palm', {
      provider: 'google',
      apiKey: process.env.GOOGLE_API_KEY,
      endpoint: 'https://generativelanguage.googleapis.com/v1',
      rateLimit: 60,
    });
    console.log('✅ Google PaLM engine configured');
  }

  // Hugging Face
  if (process.env.HUGGINGFACE_API_KEY) {
    aiManager.updateEngineCredentials('huggingface-transformers', {
      provider: 'huggingface',
      apiKey: process.env.HUGGINGFACE_API_KEY,
      endpoint: 'https://api-inference.huggingface.co',
      rateLimit: 100,
    });
    console.log('✅ Hugging Face Transformers engine configured');
  }

  // Cohere
  if (process.env.COHERE_API_KEY) {
    aiManager.updateEngineCredentials('cohere-command', {
      provider: 'cohere',
      apiKey: process.env.COHERE_API_KEY,
      endpoint: 'https://api.cohere.ai/v1',
      rateLimit: 100,
    });
    console.log('✅ Cohere Command engine configured');
  }

  // Set active engine if specified
  if (process.env.DEFAULT_AI_ENGINE) {
    const success = aiManager.setActiveEngine(process.env.DEFAULT_AI_ENGINE);
    if (success) {
      console.log(`✅ Active AI engine set to: ${process.env.DEFAULT_AI_ENGINE}`);
    } else {
      console.warn(`⚠️  Failed to set active AI engine: ${process.env.DEFAULT_AI_ENGINE}`);
    }
  }
}

/**
 * Set up platform event listeners for monitoring and logging
 */
function setupEventListeners(platform: UltraMetaVersePlatform): void {
  const { intelligenceCore, adaptiveUI, toolGenerator, gataOSIntegration, decentralizedInfra } = platform.getComponents();

  // Intelligence core events
  intelligenceCore.on('evolution', (data: any) => {
    console.log('🧠 Intelligence evolution:', {
      coreId: data.coreId,
      adaptationLevel: data.adaptationLevel.toFixed(3),
      timestamp: data.timestamp.toISOString(),
    });
  });

  intelligenceCore.on('adaptation-required', (data: any) => {
    console.log('🔄 Adaptation required:', {
      suggestions: data.suggestedActions.length,
      trigger: 'performance-threshold',
    });
  });

  // Adaptive UI events
  adaptiveUI.on('user-registered', (data: any) => {
    console.log('👤 New user registered for adaptive UI:', data.userId);
  });

  adaptiveUI.on('interface-adapted', (data: any) => {
    console.log('🎨 Interface adapted:', {
      userId: data.userId,
      adaptation: data.adaptation,
      trigger: data.trigger,
    });
  });

  // Tool generator events
  toolGenerator.on('tool-generated', (data: any) => {
    console.log('🛠️  New tool generated:', {
      toolId: data.tool.id,
      name: data.tool.name,
      capabilities: data.tool.capabilities.length,
    });
  });

  toolGenerator.on('tool-usage-updated', (data: any) => {
    console.log('📊 Tool usage updated:', {
      toolId: data.toolId,
      effectiveness: data.effectiveness.toFixed(3),
      usageCount: data.usageCount,
    });
  });

  // Gata-OS events
  gataOSIntegration.on('gata-os-connected', (data: any) => {
    console.log('🌐 Gata-OS connected:', {
      version: data.version,
      capabilities: data.capabilities.length,
    });
  });

  gataOSIntegration.on('environment-change', (data: any) => {
    console.log('🔄 Environment change detected:', {
      from: data.from,
      to: data.to,
    });
  });

  gataOSIntegration.on('gata-os-unavailable', () => {
    console.log('⚠️  Gata-OS not available in current environment');
  });

  // Decentralized infrastructure events
  decentralizedInfra.on('infrastructure-initialized', () => {
    console.log('🔗 Decentralized infrastructure initialized');
  });

  decentralizedInfra.on('task-completed', (data: any) => {
    console.log('✅ Distributed task completed:', {
      taskId: data.task.id,
      type: data.task.type,
      nodeId: data.node.id,
    });
  });

  decentralizedInfra.on('rewards-distributed', (data: any) => {
    console.log('💰 Rewards distributed:', {
      taskId: data.taskId,
      amount: data.amount,
      nodeId: data.nodeId,
    });
  });

  decentralizedInfra.on('consent-granted', (data: any) => {
    console.log('✅ Mining consent granted:', {
      userId: data.userId,
      resourceLimits: data.resourceLimits,
    });
  });

  // Platform events
  platform.on('platform-started', () => {
    console.log('🎉 Platform startup complete!');
  });

  platform.on('platform-stopped', () => {
    console.log('👋 Platform shutdown complete');
  });
}

/**
 * Set up graceful shutdown handlers
 */
function setupGracefulShutdown(platform: UltraMetaVersePlatform): void {
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    
    try {
      await platform.stop();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

/**
 * Display startup information and usage examples
 */
function displayStartupInfo(platform: UltraMetaVersePlatform): void {
  const config = platform.getConfig();
  const stats = platform.getStats();

  console.log('\n🌟 Platform Information:');
  console.log(`   • Server: http://${config.server.host}:${config.server.port}`);
  console.log(`   • WebSocket: ws://${config.server.host}:${config.server.port}/ws`);
  console.log(`   • API: http://${config.server.host}:${config.server.port}/api`);
  console.log(`   • Status: http://${config.server.host}:${config.server.port}/api/status`);

  console.log('\n🧠 Intelligence Core:');
  console.log(`   • Learning: ${config.ai.learningEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   • Adaptation Level: ${stats.intelligenceState.adaptationLevel.toFixed(3)}`);
  console.log(`   • Learning Modules: ${stats.intelligenceState.learningModules.length}`);

  console.log('\n🎨 Adaptive UI:');
  console.log(`   • Adaptation: ${config.ui.adaptationEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   • Interval: ${config.ui.adaptationInterval / 1000}s`);
  console.log(`   • Max Adaptations: ${config.ui.maxAdaptations}`);

  console.log('\n🤖 AI Engines:');
  console.log(`   • Available: ${stats.aiEngines}`);
  console.log(`   • Default: ${config.ai.defaultEngine}`);
  console.log(`   • Max Concurrent: ${config.ai.maxConcurrentRequests}`);

  console.log('\n🌐 Cross-Environment:');
  console.log(`   • Gata-OS: ${stats.gataOSConnected ? 'Connected' : 'Disconnected'}`);

  console.log('\n🔗 Decentralized Network:');
  console.log(`   • Active Nodes: ${stats.networkStats.activeNodes}`);
  console.log(`   • Completed Tasks: ${stats.networkStats.completedTasks}`);
  console.log(`   • Network: ${config.blockchain.network}`);

  console.log('\n📖 Usage Examples:');
  console.log('   • Generate tool: POST /api/tools/generate');
  console.log('   • Get AI engines: GET /api/ai/engines');
  console.log('   • Create session: POST /api/users/{userId}/session');
  console.log('   • Request mining consent: POST /api/blockchain/mining-consent');
  console.log('   • Submit distributed task: POST /api/distributed/tasks');

  console.log('\n🔍 Monitoring:');
  console.log('   • Watch logs for real-time platform activity');
  console.log('   • Use WebSocket connection for live updates');
  console.log('   • Check /api/status for health information');

  console.log('\n✨ Ready to power your metaverse development!');
  console.log('   Platform is now accepting connections and requests.\n');
}

// Export the main function for programmatic usage
export { main as startPlatform, UltraMetaVersePlatform };

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}