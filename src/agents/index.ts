/**
 * Main entry point for the Multi-Agent Habit Mentor System
 * Exports all agents and provides system initialization
 */

import { Orchestrator } from './orchestrator/orchestrator';

export { BaseAgent, AgentRegistry } from './base/agent';
export { MentorAgent } from './mentor/mentor_agent';
export { IdentityAgent } from './identity/identity_agent';
export { AccountabilityAgent } from './accountability/accountability_agent';
export { GroupAgent } from './group/group_agent';
export { LearningAgent } from './learning/learning_agent';
export { Orchestrator } from './orchestrator/orchestrator';

// Export all types
export * from './base/types';

// System initialization
export class AgentSystem {
  private static instance: AgentSystem;
  private orchestrator: Orchestrator | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AgentSystem {
    if (!AgentSystem.instance) {
      AgentSystem.instance = new AgentSystem();
    }
    return AgentSystem.instance;
  }

  async initialize(
    perplexityClient: any,
    notionClient: any
  ): Promise<void> {
    if (this.isInitialized) {
      console.log('Agent system already initialized');
      return;
    }

    console.log('Initializing Multi-Agent Habit Mentor System...');

    try {
      // Initialize orchestrator
      this.orchestrator = new Orchestrator(perplexityClient, notionClient);
      await this.orchestrator.initialize();

      this.isInitialized = true;
      console.log('Multi-Agent System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize agent system:', error);
      throw error;
    }
  }

  async processUserMessage(
    userContext: any,
    message: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    if (!this.isInitialized || !this.orchestrator) {
      throw new Error('Agent system not initialized');
    }

    return await this.orchestrator.processRequest(userContext, message, metadata);
  }

  async getSystemHealth(): Promise<any> {
    if (!this.orchestrator) {
      return { overall: false, error: 'System not initialized' };
    }

    return await this.orchestrator.getSystemHealth();
  }

  async getSystemStatus(): Promise<any> {
    if (!this.orchestrator) {
      return { agents: [], capabilities: [], health: { overall: false } };
    }

    return await this.orchestrator.getSystemStatus();
  }

  async shutdown(): Promise<void> {
    if (this.orchestrator) {
      await this.orchestrator.cleanup();
      this.orchestrator = null;
    }
    this.isInitialized = false;
    console.log('Agent system shutdown complete');
  }
}
