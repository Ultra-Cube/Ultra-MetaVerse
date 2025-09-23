import { EventEmitter } from 'eventemitter3';
import { WebSocket } from 'ws';
import axios from 'axios';
import {
  GataOSConnection,
  CrossEnvironmentSession,
  Permission,
  PlatformEvent,
} from '../types';

/**
 * Gata-OS Integration Module
 * Provides cross-environment navigation and seamless integration
 */
export class GataOSIntegration extends EventEmitter {
  private webSocket?: WebSocket | undefined;
  private connection?: GataOSConnection | undefined;
  private sessions: Map<string, CrossEnvironmentSession> = new Map();
  private permissions: Map<string, Permission[]> = new Map();
  private connectionRetries = 0;
  private maxRetries = 5;
  private isConnecting = false;

  constructor() {
    super();
    this.initializeGataOSDetection();
  }

  /**
   * Initialize Gata-OS detection and auto-connection
   */
  private async initializeGataOSDetection(): Promise<void> {
    try {
      // Check if Gata-OS is available in the environment
      const gataOSInfo = await this.detectGataOS();
      
      if (gataOSInfo) {
        await this.connectToGataOS(gataOSInfo);
      } else {
        console.log('Gata-OS not detected in current environment');
        this.emit('gata-os-unavailable');
      }
    } catch (error) {
      console.warn(`Gata-OS detection failed:`, error);
      this.emit('gata-os-detection-failed', { error: (error as Error).message });
    }
  }

  /**
   * Detect Gata-OS in the current environment
   */
  private async detectGataOS(): Promise<GataOSInfo | null> {
    // Check multiple possible Gata-OS endpoints and methods
    const detectionMethods = [
      () => this.checkEnvironmentVariables(),
      () => this.checkLocalEndpoints(),
      () => this.checkBrowserIntegration(),
      () => this.checkProcessList(),
    ];

    for (const method of detectionMethods) {
      try {
        const result = await method();
        if (result) {
          this.emit('gata-os-detected', result);
          return result;
        }
      } catch (error) {
        // Continue to next detection method
        continue;
      }
    }

    return null;
  }

  private async checkEnvironmentVariables(): Promise<GataOSInfo | null> {
    const gataOSEndpoint = process.env.GATA_OS_ENDPOINT;
    const gataOSVersion = process.env.GATA_OS_VERSION;
    
    if (gataOSEndpoint) {
      try {
        const response = await axios.get(`${gataOSEndpoint}/health`, { timeout: 5000 });
        
        if (response.status === 200) {
          return {
            endpoint: gataOSEndpoint,
            version: gataOSVersion || response.data.version || '1.0.0',
            capabilities: response.data.capabilities || [],
            transport: 'http',
          };
        }
      } catch (error) {
        // Endpoint not responsive
      }
    }

    return null;
  }

  private async checkLocalEndpoints(): Promise<GataOSInfo | null> {
    const commonPorts = [8080, 8081, 3000, 3001, 4000, 9000];
    const commonPaths = ['/gata-os', '/api/gata', '/gata'];

    for (const port of commonPorts) {
      for (const path of commonPaths) {
        try {
          const endpoint = `http://localhost:${port}${path}`;
          const response = await axios.get(`${endpoint}/health`, { timeout: 2000 });
          
          if (response.status === 200 && response.data.system === 'gata-os') {
            return {
              endpoint,
              version: response.data.version || '1.0.0',
              capabilities: response.data.capabilities || [],
              transport: 'http',
            };
          }
        } catch (error) {
          // Continue checking
        }
      }
    }

    return null;
  }

  private async checkBrowserIntegration(): Promise<GataOSInfo | null> {
    // Check if running in browser with Gata-OS extension/integration
    if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
      const window = (globalThis as any).window;
      const gataAPI = window.gataOS;
      
      if (gataAPI && gataAPI.isAvailable) {
        try {
          const info = await gataAPI.getSystemInfo();
          return {
            endpoint: 'browser-extension',
            version: info.version || '1.0.0',
            capabilities: info.capabilities || [],
            transport: 'browser-api',
          };
        } catch (error) {
          // Extension not properly initialized
        }
      }
    }

    return null;
  }

  private async checkProcessList(): Promise<GataOSInfo | null> {
    // This would check running processes for Gata-OS
    // Implementation depends on the platform and available APIs
    // For now, return null as this requires system-level access
    return null;
  }

  /**
   * Connect to Gata-OS
   */
  public async connectToGataOS(gataInfo: GataOSInfo): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.connection = {
        id: `gata-connection-${Date.now()}`,
        endpoint: gataInfo.endpoint,
        isConnected: false,
        capabilities: gataInfo.capabilities,
        version: gataInfo.version,
      };

      // Establish connection based on transport type
      if (gataInfo.transport === 'http') {
        await this.establishHTTPConnection(gataInfo);
      } else if (gataInfo.transport === 'websocket') {
        await this.establishWebSocketConnection(gataInfo);
      } else if (gataInfo.transport === 'browser-api') {
        await this.establishBrowserAPIConnection(gataInfo);
      }

      this.connection.isConnected = true;
      this.connectionRetries = 0;
      
      this.emit('gata-os-connected', this.connection);
      
      // Start session management
      this.startSessionManagement();

    } catch (error) {
      this.handleConnectionError(error);
    } finally {
      this.isConnecting = false;
    }
  }

  private async establishHTTPConnection(gataInfo: GataOSInfo): Promise<void> {
    // Test the connection
    const response = await axios.get(`${gataInfo.endpoint}/health`);
    
    if (response.status !== 200) {
      throw new Error('Gata-OS HTTP endpoint not responsive');
    }

    // Try to establish WebSocket connection if supported
    const wsEndpoint = gataInfo.endpoint.replace('http', 'ws') + '/websocket';
    
    try {
      await this.establishWebSocketConnection({ ...gataInfo, endpoint: wsEndpoint, transport: 'websocket' });
    } catch (error) {
      // WebSocket not available, continue with HTTP only
      console.log('WebSocket not available, using HTTP polling');
    }
  }

  private async establishWebSocketConnection(gataInfo: GataOSInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsTimeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.webSocket = new WebSocket(gataInfo.endpoint);

      this.webSocket.on('open', () => {
        clearTimeout(wsTimeout);
        this.setupWebSocketHandlers();
        resolve();
      });

      this.webSocket.on('error', (error) => {
        clearTimeout(wsTimeout);
        reject(error);
      });
    });
  }

  private async establishBrowserAPIConnection(_gataInfo: GataOSInfo): Promise<void> {
    if (typeof globalThis === 'undefined' || !(globalThis as any).window) {
      throw new Error('Browser API connection only available in browser environment');
    }

    const window = (globalThis as any).window;
    const gataAPI = window.gataOS;
    
    if (!gataAPI || !gataAPI.isAvailable) {
      throw new Error('Gata-OS browser API not available');
    }

    // Initialize the API connection
    await gataAPI.initialize({
      appId: 'ultra-metaverse',
      version: '1.0.0',
      permissions: ['cross-environment', 'state-sync', 'navigation'],
    });

    // Set up event listeners
    gataAPI.onEnvironmentChange = (event: any) => {
      this.handleEnvironmentChange(event);
    };

    gataAPI.onSessionUpdate = (event: any) => {
      this.handleSessionUpdate(event);
    };
  }

  private setupWebSocketHandlers(): void {
    if (!this.webSocket) return;

    this.webSocket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleGataOSMessage(message);
      } catch (error) {
        console.error('Failed to parse Gata-OS message:', error);
      }
    });

    this.webSocket.on('close', () => {
      this.connection!.isConnected = false;
      this.emit('gata-os-disconnected');
      this.attemptReconnection();
    });

    this.webSocket.on('error', (error) => {
      console.error('Gata-OS WebSocket error:', error);
      this.emit('gata-os-error', { error: error.message });
    });
  }

  private handleGataOSMessage(message: GataOSMessage): void {
    switch (message.type) {
      case 'environment-change':
        this.handleEnvironmentChange(message.data);
        break;
      case 'session-update':
        this.handleSessionUpdate(message.data);
        break;
      case 'permission-request':
        this.handlePermissionRequest(message.data);
        break;
      case 'cross-environment-event':
        this.handleCrossEnvironmentEvent(message.data);
        break;
      default:
        this.emit('gata-os-message', message);
    }
  }

  private handleEnvironmentChange(data: any): void {
    this.emit('environment-change', {
      from: data.from,
      to: data.to,
      context: data.context,
      timestamp: new Date(),
    });
  }

  private handleSessionUpdate(data: any): void {
    const session = this.sessions.get(data.sessionId);
    if (session) {
      Object.assign(session.sharedState, data.stateChanges);
      this.sessions.set(data.sessionId, session);
      
      this.emit('session-updated', {
        sessionId: data.sessionId,
        changes: data.stateChanges,
      });
    }
  }

  private handlePermissionRequest(data: any): void {
    this.emit('permission-request', {
      requestId: data.requestId,
      permissions: data.permissions,
      origin: data.origin,
    });
  }

  private handleCrossEnvironmentEvent(data: any): void {
    const event: PlatformEvent = {
      id: data.id,
      type: 'cross-environment',
      source: 'gata-os',
      data: data.payload,
      timestamp: new Date(data.timestamp),
      processed: false,
    };

    this.emit('cross-environment-event', event);
  }

  private handleConnectionError(error: any): void {
    console.error('Gata-OS connection error:', error);
    
    this.connectionRetries++;
    
    if (this.connectionRetries < this.maxRetries) {
      console.log(`Retrying Gata-OS connection (${this.connectionRetries}/${this.maxRetries})...`);
      setTimeout(() => {
        this.attemptReconnection();
      }, Math.pow(2, this.connectionRetries) * 1000); // Exponential backoff
    } else {
      this.emit('gata-os-connection-failed', { 
        error: error.message, 
        retries: this.connectionRetries 
      });
    }
  }

  private async attemptReconnection(): Promise<void> {
    if (this.connection && !this.isConnecting) {
      try {
        await this.connectToGataOS({
          endpoint: this.connection.endpoint,
          version: this.connection.version,
          capabilities: this.connection.capabilities,
          transport: 'http', // Default to HTTP for reconnection
        });
      } catch (error) {
        this.handleConnectionError(error);
      }
    }
  }

  private startSessionManagement(): void {
    // Periodic session synchronization
    setInterval(() => {
      this.synchronizeSessions();
    }, 30000); // Every 30 seconds
  }

  private async synchronizeSessions(): Promise<void> {
    if (!this.connection?.isConnected) return;

    try {
      for (const [sessionId, session] of this.sessions) {
        await this.syncSessionWithGataOS(sessionId, session);
      }
    } catch (error) {
      console.error('Session synchronization error:', error);
    }
  }

  /**
   * Create a new cross-environment session
   */
  public async createCrossEnvironmentSession(
    environments: string[],
    initialState?: Record<string, unknown>
  ): Promise<CrossEnvironmentSession> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CrossEnvironmentSession = {
      sessionId,
      environments,
      sharedState: initialState || {},
      permissions: [],
    };

    this.sessions.set(sessionId, session);

    // Notify Gata-OS about the new session
    if (this.connection?.isConnected) {
      await this.sendToGataOS({
        type: 'session-create',
        data: {
          sessionId,
          environments,
          initialState,
        },
      });
    }

    this.emit('session-created', session);
    return session;
  }

  /**
   * Update session state
   */
  public async updateSessionState(
    sessionId: string,
    stateChanges: Record<string, unknown>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    Object.assign(session.sharedState, stateChanges);
    this.sessions.set(sessionId, session);

    // Sync with Gata-OS
    if (this.connection?.isConnected) {
      await this.sendToGataOS({
        type: 'session-update',
        data: {
          sessionId,
          stateChanges,
        },
      });
    }

    this.emit('session-state-updated', { sessionId, stateChanges });
  }

  /**
   * Navigate to different environment
   */
  public async navigateToEnvironment(
    targetEnvironment: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    if (!this.connection?.isConnected) {
      throw new Error('Gata-OS not connected');
    }

    await this.sendToGataOS({
      type: 'navigate',
      data: {
        target: targetEnvironment,
        context,
        source: 'ultra-metaverse',
      },
    });

    this.emit('navigation-requested', { target: targetEnvironment, context });
  }

  /**
   * Request permissions for cross-environment operations
   */
  public async requestPermissions(permissions: Omit<Permission, 'granted'>[]): Promise<boolean> {
    if (!this.connection?.isConnected) {
      throw new Error('Gata-OS not connected');
    }

    const requestId = `perm-req-${Date.now()}`;
    
    return new Promise((resolve) => {
      // Set up listener for permission response
      const responseHandler = (data: any) => {
        if (data.requestId === requestId) {
          this.off('permission-response', responseHandler);
          
          // Store granted permissions
          const grantedPermissions = data.permissions.filter((p: Permission) => p.granted);
          this.permissions.set('default', grantedPermissions);
          
          resolve(grantedPermissions.length === permissions.length);
        }
      };

      this.on('permission-response', responseHandler);

      // Send permission request
      this.sendToGataOS({
        type: 'permission-request',
        data: {
          requestId,
          permissions,
        },
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        this.off('permission-response', responseHandler);
        resolve(false);
      }, 30000);
    });
  }

  /**
   * Send message to Gata-OS
   */
  private async sendToGataOS(message: GataOSMessage): Promise<void> {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message));
    } else if (this.connection?.endpoint.startsWith('http')) {
      // Fallback to HTTP
      await axios.post(`${this.connection.endpoint}/messages`, message);
    } else if (typeof globalThis !== 'undefined' && (globalThis as any).window?.gataOS) {
      // Browser API
      const window = (globalThis as any).window;
      await window.gataOS.sendMessage(message);
    } else {
      throw new Error('No available transport to Gata-OS');
    }
  }

  private async syncSessionWithGataOS(sessionId: string, session: CrossEnvironmentSession): Promise<void> {
    await this.sendToGataOS({
      type: 'session-sync',
      data: {
        sessionId,
        session,
      },
    });
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): GataOSConnection | null {
    return this.connection || null;
  }

  /**
   * Get active sessions
   */
  public getActiveSessions(): CrossEnvironmentSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session by ID
   */
  public getSession(sessionId: string): CrossEnvironmentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Close session
   */
  public async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.sessions.delete(sessionId);

    if (this.connection?.isConnected) {
      await this.sendToGataOS({
        type: 'session-close',
        data: { sessionId },
      });
    }

    this.emit('session-closed', { sessionId });
  }

  /**
   * Disconnect from Gata-OS
   */
  public disconnect(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = undefined;
    }

    if (this.connection) {
      this.connection.isConnected = false;
      this.connection = undefined;
    }

    this.sessions.clear();
    this.permissions.clear();

    this.emit('gata-os-disconnected');
  }

  /**
   * Check if specific capability is available
   */
  public hasCapability(capability: string): boolean {
    return this.connection?.capabilities.includes(capability) || false;
  }

  /**
   * Get available capabilities
   */
  public getCapabilities(): string[] {
    return this.connection?.capabilities || [];
  }
}

// Supporting interfaces
interface GataOSInfo {
  endpoint: string;
  version: string;
  capabilities: string[];
  transport: 'http' | 'websocket' | 'browser-api';
}

interface GataOSMessage {
  type: string;
  data: any;
  timestamp?: Date;
  id?: string;
}