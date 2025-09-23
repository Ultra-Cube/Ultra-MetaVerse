/**
 * Example Usage - Ultra-MetaVerse AI Platform
 * 
 * This file demonstrates how to use the Ultra-MetaVerse platform programmatically
 */

import { UltraMetaVersePlatform } from '../src/index';
import { ToolRequest } from '../src/types';

async function demonstratePlatform() {
  console.log('🌟 Ultra-MetaVerse Platform Example');
  console.log('=====================================\n');

  // Create platform instance with custom configuration
  const platform = new UltraMetaVersePlatform({
    server: {
      port: 8082,
      host: 'localhost',
      cors: true,
      rateLimit: 50,
    },
    ai: {
      defaultEngine: 'openai-gpt',
      maxConcurrentRequests: 5,
      responseTimeout: 20000,
      learningEnabled: true,
    },
    ui: {
      adaptationEnabled: true,
      adaptationInterval: 30000,
      maxAdaptations: 50,
    },
  });

  try {
    // Start the platform
    console.log('🚀 Starting platform...');
    await platform.start();
    console.log('✅ Platform started successfully!\n');

    // Get platform components
    const components = platform.getComponents();

    // 1. Demonstrate Intelligence Core
    console.log('🧠 Intelligence Core Example:');
    const intelligenceState = components.intelligenceCore.getIntelligenceState();
    console.log(`   Adaptation Level: ${intelligenceState.adaptationLevel}`);
    console.log(`   Learning Modules: ${intelligenceState.learningModules.length}`);
    console.log(`   Emotional State: Empathy=${intelligenceState.emotionalState.empathy.toFixed(2)}\n`);

    // 2. Demonstrate Adaptive UI
    console.log('🎨 Adaptive UI Example:');
    const userConfig = components.adaptiveUI.registerUser('demo-user', {
      theme: 'dark',
      complexity: 'intermediate',
      layout: 'spacious',
      interactionStyle: 'guided',
    });
    console.log(`   User registered: ${userConfig.userId}`);
    console.log(`   Preferences: ${JSON.stringify(userConfig.preferences)}\n`);

    // 3. Demonstrate Tool Generation
    console.log('🛠️  Dynamic Tool Generation Example:');
    const toolRequest: ToolRequest = {
      id: 'example-tool-1',
      userId: 'demo-user',
      description: 'Create a file organizer that sorts files by type and date',
      requirements: [
        {
          type: 'functional',
          specification: 'Sort files by extension and creation date',
          priority: 'high',
        },
        {
          type: 'ui',
          specification: 'Simple drag-and-drop interface',
          priority: 'medium',
        },
      ],
      context: {
        currentProject: 'file-management-system',
        workflowStage: 'development',
        availableResources: ['filesystem', 'ui-framework'],
        timeConstraints: 3600000, // 1 hour
      },
      timestamp: new Date(),
    };

    const emotionalState = components.intelligenceCore.getEmotionalResponse('tool-creation');
    const generatedTool = await components.toolGenerator.generateTool(toolRequest, emotionalState);
    
    console.log(`   Generated Tool: ${generatedTool.name}`);
    console.log(`   Description: ${generatedTool.description}`);
    console.log(`   Capabilities: ${generatedTool.capabilities.length}`);
    console.log(`   Emotional Tone: Supportive=${generatedTool.emotionalTone.supportive.toFixed(2)}\n`);

    // 4. Demonstrate AI Engine Management
    console.log('🤖 AI Engine Management Example:');
    const availableEngines = components.aiManager.getAvailableEngines();
    console.log(`   Available AI Engines: ${availableEngines.length}`);
    availableEngines.forEach(engine => {
      console.log(`   - ${engine.name} (${engine.capabilities.join(', ')})`);
    });
    console.log();

    // 5. Demonstrate Gata-OS Integration
    console.log('🌐 Gata-OS Integration Example:');
    const gataStatus = components.gataOSIntegration.getConnectionStatus();
    if (gataStatus) {
      console.log(`   Status: ${gataStatus.isConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`   Capabilities: ${gataStatus.capabilities.join(', ')}`);
    } else {
      console.log('   Gata-OS not available in current environment');
    }
    console.log();

    // 6. Demonstrate Decentralized Infrastructure
    console.log('🔗 Decentralized Infrastructure Example:');
    const networkStats = components.decentralizedInfra.getNetworkStats();
    console.log(`   Active Nodes: ${networkStats.activeNodes}`);
    console.log(`   Completed Tasks: ${networkStats.completedTasks}`);
    console.log(`   Average Reputation: ${networkStats.averageReputation.toFixed(3)}`);

    // Submit a test distributed task
    const testTask = await components.decentralizedInfra.submitComputationTask(
      { operation: 'fibonacci', input: 20 },
      0.1 // small reward
    );
    console.log(`   Submitted Task: ${testTask.id} (${testTask.type})\n`);

    // 7. Demonstrate Platform Statistics
    console.log('📊 Platform Statistics:');
    const stats = platform.getStats();
    console.log(`   Connected Clients: ${stats.connectedClients}`);
    console.log(`   Active Sessions: ${stats.activeSessions}`);
    console.log(`   AI Engines: ${stats.aiEngines}`);
    console.log(`   Gata-OS Connected: ${stats.gataOSConnected}`);
    console.log(`   Uptime: ${stats.uptime.toFixed(1)} seconds\n`);

    // 8. Demonstrate Real-time Learning
    console.log('📚 Real-time Learning Example:');
    
    // Simulate user behavior
    components.adaptiveUI.trackInteraction('demo-user', {
      task: 'file-organization',
      tool: 'file-organizer',
      duration: 45000,
      success: true,
    });

    // Learn from tool usage
    components.intelligenceCore.learnFromToolUsage(
      generatedTool.id,
      0.9, // high effectiveness
      { context: 'file-management', userSatisfaction: 'high' }
    );

    console.log('   User interaction tracked and learning applied\n');

    console.log('🎉 Example completed successfully!');
    console.log('   The platform is now ready for production use.');
    console.log('   Check the API endpoints and WebSocket for real-time features.\n');

  } catch (error) {
    console.error('❌ Example failed:', error);
  } finally {
    // Stop the platform
    console.log('🛑 Stopping platform...');
    await platform.stop();
    console.log('✅ Platform stopped successfully');
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  demonstratePlatform().catch(console.error);
}

export { demonstratePlatform };