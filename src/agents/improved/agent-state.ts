/**
 * Explicit State Management - Graph-based pattern from chatbot
 * Enables better agent collaboration and data flow visibility
 */

import { User, Habit, Proof, Learning, Hurdle } from '../../types';

// ============================================================================
// BASE STATE - Shared across all agents
// ============================================================================

export interface BaseAgentState {
  // Request metadata
  query: string;
  requestTimestamp: Date;
  iteration: number; // Prevents infinite loops
  maxIterations: number;

  // User context
  user: User | null;
  habits: Habit[];
  proofs: Proof[];
  learnings: Learning[];
  hurdles: Hurdle[];

  // Processing state
  isComplete: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// MENTOR AGENT STATE
// ============================================================================

export interface MentorAgentState extends BaseAgentState {
  // Analysis data
  habitAnalysis: Array<{
    habitId: string;
    habitName: string;
    targetFrequency: number;
    actualProofs: number;
    completionRate: number;
    streak: number;
  }>;

  // Patterns identified
  successPatterns: string[];
  failurePatterns: string[];
  timePatterns: {
    morning: number;
    afternoon: number;
    evening: number;
  };

  // Buddy context
  buddyProgress: {
    nickname: string;
    completionRate: number;
    currentStreak: number;
  } | null;

  // Output
  analysis: {
    performance: {
      rating: 'excellent' | 'good' | 'moderate' | 'needs_attention';
      completionRate: number;
      streak: number;
    };
    priorityAction: string;
    quickWin: string;
  } | null;
}

// ============================================================================
// ACCOUNTABILITY AGENT STATE
// ============================================================================

export interface AccountabilityAgentState extends BaseAgentState {
  // Progress tracking
  currentDay: number;
  totalDays: number;
  activeStreaks: number;
  longestStreak: number;

  // Week performance
  weekPerformance: Array<{
    habitName: string;
    completed: number;
    target: number;
    streak: number;
    status: 'on_track' | 'behind' | 'critical';
  }>;

  // Intervention triggers
  interventionNeeded: boolean;
  interventionReason: string[];

  // Output
  motivationMessage: string;
  actions: string[];
}

// ============================================================================
// GROUP AGENT STATE
// ============================================================================

export interface GroupAgentState extends BaseAgentState {
  // Group data
  groupMembers: Array<{
    name: string;
    completionRate: number;
    activeHabits: number;
  }>;

  // Buddy data
  buddy: {
    name: string;
    completionRate: number;
    habits: Habit[];
    proofs: Proof[];
  } | null;

  // Analysis
  rankings: Array<{
    rank: number;
    name: string;
    completionRate: number;
  }>;

  learningOpportunities: Array<{
    learnFrom: string;
    skill: string;
    suggestion: string;
  }>;

  // Output
  groupInsight: string;
  buddySyncMessage: string;
}

// ============================================================================
// LEARNING AGENT STATE
// ============================================================================

export interface LearningAgentState extends BaseAgentState {
  // Learning patterns
  learningTopics: Map<string, number>; // topic -> frequency
  topInsights: Array<{
    topic: string;
    insight: string;
    frequency: number;
  }>;

  // Hurdle solutions
  hurdleSolutions: Array<{
    hurdle: string;
    solution: string;
    effectiveness: 'high' | 'medium' | 'low';
    timesUsed: number;
  }>;

  // Meta-patterns
  metaPattern: string;
  recommendation: string;
}

// ============================================================================
// ORCHESTRATOR STATE - Coordinates all agents
// ============================================================================

export interface OrchestratorState extends BaseAgentState {
  // Agent selection
  selectedAgents: string[]; // e.g., ['mentor', 'accountability']
  primaryAgent: string; // Main agent handling request
  supportingAgents: string[]; // Agents providing context

  // Agent results
  agentResults: Map<string, any>; // agentId -> result

  // Aggregated response
  finalResponse: string;
  confidenceScore: number;

  // Context refinement
  usedContext: Array<{
    type: 'habit' | 'proof' | 'learning' | 'hurdle';
    id: string;
    relevance: number;
  }>;
}

// ============================================================================
// STATE FACTORY - Creates initial states
// ============================================================================

export class AgentStateFactory {
  static createBaseState(query: string, maxIterations: number = 5): BaseAgentState {
    return {
      query,
      requestTimestamp: new Date(),
      iteration: 0,
      maxIterations,
      user: null,
      habits: [],
      proofs: [],
      learnings: [],
      hurdles: [],
      isComplete: false,
      errors: [],
      warnings: [],
    };
  }

  static createMentorState(query: string): MentorAgentState {
    return {
      ...this.createBaseState(query),
      habitAnalysis: [],
      successPatterns: [],
      failurePatterns: [],
      timePatterns: { morning: 0, afternoon: 0, evening: 0 },
      buddyProgress: null,
      analysis: null,
    };
  }

  static createAccountabilityState(query: string): AccountabilityAgentState {
    return {
      ...this.createBaseState(query),
      currentDay: 0,
      totalDays: 90,
      activeStreaks: 0,
      longestStreak: 0,
      weekPerformance: [],
      interventionNeeded: false,
      interventionReason: [],
      motivationMessage: '',
      actions: [],
    };
  }

  static createGroupState(query: string): GroupAgentState {
    return {
      ...this.createBaseState(query),
      groupMembers: [],
      buddy: null,
      rankings: [],
      learningOpportunities: [],
      groupInsight: '',
      buddySyncMessage: '',
    };
  }

  static createLearningState(query: string): LearningAgentState {
    return {
      ...this.createBaseState(query),
      learningTopics: new Map(),
      topInsights: [],
      hurdleSolutions: [],
      metaPattern: '',
      recommendation: '',
    };
  }

  static createOrchestratorState(query: string): OrchestratorState {
    return {
      ...this.createBaseState(query, 10), // Higher max for orchestrator
      selectedAgents: [],
      primaryAgent: '',
      supportingAgents: [],
      agentResults: new Map(),
      finalResponse: '',
      confidenceScore: 0,
      usedContext: [],
    };
  }
}

// ============================================================================
// STATE TRANSITIONS - Type-safe state updates
// ============================================================================

export class StateTransitions {
  /**
   * Increment iteration safely
   */
  static incrementIteration<T extends BaseAgentState>(state: T): T {
    return {
      ...state,
      iteration: state.iteration + 1,
    };
  }

  /**
   * Add error safely
   */
  static addError<T extends BaseAgentState>(state: T, error: string): T {
    return {
      ...state,
      errors: [...state.errors, error],
    };
  }

  /**
   * Add warning safely
   */
  static addWarning<T extends BaseAgentState>(state: T, warning: string): T {
    return {
      ...state,
      warnings: [...state.warnings, warning],
    };
  }

  /**
   * Mark complete
   */
  static markComplete<T extends BaseAgentState>(state: T): T {
    return {
      ...state,
      isComplete: true,
    };
  }

  /**
   * Update user context
   */
  static updateUserContext<T extends BaseAgentState>(
    state: T,
    user: User,
    habits: Habit[],
    proofs: Proof[],
    learnings: Learning[],
    hurdles: Hurdle[]
  ): T {
    return {
      ...state,
      user,
      habits,
      proofs,
      learnings,
      hurdles,
    };
  }

  /**
   * Check if max iterations reached
   */
  static hasReachedMaxIterations<T extends BaseAgentState>(state: T): boolean {
    return state.iteration >= state.maxIterations;
  }

  /**
   * Check if state has errors
   */
  static hasErrors<T extends BaseAgentState>(state: T): boolean {
    return state.errors.length > 0;
  }

  /**
   * Get state summary for logging
   */
  static getSummary<T extends BaseAgentState>(state: T): {
    query: string;
    iteration: number;
    hasUser: boolean;
    habitsCount: number;
    proofsCount: number;
    errorsCount: number;
    isComplete: boolean;
  } {
    return {
      query: state.query.substring(0, 50),
      iteration: state.iteration,
      hasUser: !!state.user,
      habitsCount: state.habits.length,
      proofsCount: state.proofs.length,
      errorsCount: state.errors.length,
      isComplete: state.isComplete,
    };
  }
}

// ============================================================================
// GRAPH CONTEXT - Passed through graph nodes
// ============================================================================

export interface GraphContext<State extends BaseAgentState, Deps> {
  state: State;
  deps: Deps;

  // Helper methods
  updateState(updates: Partial<State>): void;
  incrementIteration(): void;
  addError(error: string): void;
  addWarning(warning: string): void;
  markComplete(): void;
  getSummary(): any;
}

/**
 * Creates graph context with helper methods
 */
export function createGraphContext<State extends BaseAgentState, Deps>(
  state: State,
  deps: Deps
): GraphContext<State, Deps> {
  let currentState = state;

  return {
    get state() {
      return currentState;
    },
    deps,

    updateState(updates: Partial<State>) {
      currentState = { ...currentState, ...updates };
    },

    incrementIteration() {
      currentState = StateTransitions.incrementIteration(currentState);
    },

    addError(error: string) {
      currentState = StateTransitions.addError(currentState, error);
    },

    addWarning(warning: string) {
      currentState = StateTransitions.addWarning(currentState, warning);
    },

    markComplete() {
      currentState = StateTransitions.markComplete(currentState);
    },

    getSummary() {
      return StateTransitions.getSummary(currentState);
    },
  };
}

// ============================================================================
// DEPENDENCIES - Injected services
// ============================================================================

export interface AgentDependencies {
  notionClient: any; // NotionClient
  perplexityClient: any; // PerplexityClient
  logger: any; // DiscordLogger
  config: {
    maxIterations: number;
    cacheEnabled: boolean;
    debugMode: boolean;
  };
}
