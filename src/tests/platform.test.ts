import { UltraMetaVersePlatform } from '../index';

describe('Ultra-MetaVerse Platform', () => {
  let platform: UltraMetaVersePlatform;

  beforeAll(() => {
    platform = new UltraMetaVersePlatform({
      server: { port: 8081, host: 'localhost', cors: true, rateLimit: 100 }
    });
  });

  afterAll(async () => {
    if (platform) {
      await platform.stop();
    }
  });

  test('should initialize platform successfully', () => {
    expect(platform).toBeDefined();
    expect(platform.getConfig()).toBeDefined();
  });

  test('should have all required components', () => {
    const components = platform.getComponents();
    
    expect(components.intelligenceCore).toBeDefined();
    expect(components.adaptiveUI).toBeDefined();
    expect(components.toolGenerator).toBeDefined();
    expect(components.aiManager).toBeDefined();
    expect(components.gataOSIntegration).toBeDefined();
    expect(components.decentralizedInfra).toBeDefined();
  });

  test('should provide platform statistics', () => {
    const stats = platform.getStats();
    
    expect(stats).toBeDefined();
    expect(stats.connectedClients).toBeDefined();
    expect(stats.activeSessions).toBeDefined();
    expect(stats.intelligenceState).toBeDefined();
    expect(stats.networkStats).toBeDefined();
    expect(stats.aiEngines).toBeDefined();
    expect(stats.gataOSConnected).toBeDefined();
    expect(stats.uptime).toBeDefined();
  });

  test('should start and stop successfully', async () => {
    await expect(platform.start()).resolves.not.toThrow();
    await expect(platform.stop()).resolves.not.toThrow();
  }, 10000);
});