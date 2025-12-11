/**
 * Base types and interfaces for the Multi-Agent Habit Mentor System
 * Using TypeScript for type-safe agent interactions
 */

// ============================================================================
// CORE USER TYPES
// ============================================================================

export interface User {
  id: string;
  discord_id: string;
  name: string;
  timezone: string;
  best_time: string;
  trust_count: number;
  personal_channel_id: string;
  personality_type?: string;
  communication_style?: string;
  motivation_style?: string;
  learning_style?: string;
  accountability_level?: string;
  created_at: Date;
  last_active: Date;
}

// Identity Agent Data
export interface IdentityAnalysis {
  id: string;
  userId: string;
  discordId: string;
  personalityScore: number;
  habitAlignmentScore: number;
  identityEvolutionStage: string;
  recommendedHabits: string[];
  identityInsights: string;
  createdAt: string;
}

// Accountability Agent Data
export interface AccountabilitySession {
  id: string;
  userId: string;
  discordId: string;
  sessionType: 'reminder' | 'check_in' | 'intervention' | 'celebration';
  message: string;
  response?: string;
  effectiveness: number; // 1-10 scale
  nextAction?: string;
  createdAt: string;
}

// Group Agent Data
export interface GroupAnalysis {
  id: string;
  groupId: string;
  userId: string;
  discordId: string;
  compatibilityScore: number;
  influenceLevel: 'high' | 'medium' | 'low';
  groupDynamics: string;
  recommendations: string[];
  createdAt: string;
}

// Learning & Hurdles Agent Data
export interface LearningInsight {
  id: string;
  userId: string;
  discordId: string;
  insightType: 'pattern' | 'solution' | 'hurdle' | 'success';
  content: string;
  confidence: number; // 1-10 scale
  tags: string[];
  sourceData: string; // JSON of related data
  createdAt: string;
}

export interface HurdleSolution {
  id: string;
  hurdleId: string;
  solution: string;
  effectiveness: number; // 1-10 scale
  implementationSteps: string[];
  successRate: number;
  createdAt: string;
}

// User Profile for Personality DB
export interface UserProfile {
  id: string;
  discordId: string;
  user?: User; // Relation to Users DB
  joinDate?: string;
  personalityType?: string; // INTJ, ENFP, etc.
  coreValues?: string[];
  lifeVision?: string;
  mainGoals?: string[];
  bigFiveTraits?: string; // JSON as String
  lifeDomains?: string[];
  lifePhase?: string;
  desiredIdentity?: string;
  openSpace?: string;
}

export interface UserContext {
  user: User;
  current_habits: Habit[];
  recent_proofs: Proof[];
  learnings: Learning[];
  hurdles: Hurdle[];
  current_streak?: number;
  weekly_summary?: WeeklySummary;
}

// ============================================================================
// HABIT TYPES
// ============================================================================

export interface Habit {
  id: string;
  name: string;
  user_id: string;
  domains: string[];
  frequency: number;
  context: string;
  difficulty: string;
  smart_goal: string;
  why: string;
  minimal_dose: string;
  habit_loop: string;
  implementation_intentions: string;
  hurdles: string;
  reminder_type: string;
  success_rate?: number;
  best_streak?: number;
  optimal_timing?: string;
  environmental_factors?: string[];
  identity_alignment?: string;
  personality_compatibility?: number;
}

export interface Proof {
  id: string;
  user_id: string;
  habit_id: string;
  title: string;
  date: Date;
  time?: string;
  unit: string;
  note?: string;
  proof_files?: string[];
  is_minimal_dose: boolean;
  is_cheat_day: boolean;
  completion_time?: number;
  duration?: number;
  energy_level?: string;
  mood?: string;
  difficulty_felt?: string;
  environmental_context?: string[];
  social_context?: string;
  weather?: string;
  external_factors?: string;
  completed: boolean;
}

// ============================================================================
// LEARNING & HURDLE TYPES
// ============================================================================

export interface Learning {
  id: string;
  user_id: string;
  habit_id?: string;
  text: string;
  category?: string;
  confidence?: number;
  created_at: Date;
  extracted_insights?: string[];
}

export interface Hurdle {
  id: string;
  user_id: string;
  habit_id?: string;
  name: string;
  hurdle_type: string;
  description: string;
  date: Date;
  severity?: string;
  frequency?: number;
  solutions_attempted?: string[];
  resolved?: boolean;
}

// ============================================================================
// GROUP & SOCIAL TYPES
// ============================================================================

export interface Group {
  id: string;
  name: string;
  channel_id: string;
  donation_pool: number;
  members: User[];
  size?: number;
  cohesion_score?: number;
  performance_score?: number;
  created_at: Date;
}

export interface GroupPerformance {
  group_id: string;
  completion_rate: number;
  member_performances: MemberPerformance[];
  high_performers: MemberPerformance[];
  low_performers: MemberPerformance[];
  peer_influence: PeerInfluenceAnalysis;
  group_cohesion: number;
}

export interface MemberPerformance {
  user_id: string;
  performance_level: 'high' | 'medium' | 'low';
  completion_rate: number;
  streak: number;
  improvements: number;
}

export interface PeerInfluenceAnalysis {
  influence_matrix: Record<string, Record<string, number>>;
  key_influencers: string[];
  patterns: InfluencePattern[];
  recommendations: string[];
}

export interface InfluencePattern {
  influencer_type: string;
  influence_strength: number;
  affected_behaviors: string[];
  conditions: string[];
}

// ============================================================================
// PERSONALITY & IDENTITY TYPES
// ============================================================================

export interface PersonalityProfile {
  user_id: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  decision_making_style?: string;
  risk_tolerance?: string;
  change_adaptation?: string;
  social_energy?: string;
  stress_response?: string;
  learning_preferences?: string[];
  communication_preferences?: string[];
  motivation_triggers?: string[];
  work_style?: string;
  profile_completeness: number;
  last_updated: Date;
}

export interface IdentityGoals {
  user_id: string;
  identity_goals: string[];
  core_values: string[];
  life_vision: string;
  identity_strengths: string[];
  identity_growth_areas: string[];
  current_identity_strength: number;
  desired_identity_strength: number;
}

// ============================================================================
// AGENT RESPONSE TYPES
// ============================================================================

export interface AgentResponse {
  success: boolean;
  message: string;
  confidence: number;
  recommendations?: Recommendation[];
  insights?: Insight[];
  next_steps?: string[];
  metadata?: Record<string, any>;
  data?: any; // Additional data from agents
  agentId?: string; // Agent that processed the request
  timestamp: Date;
}

export interface Recommendation {
  id: string;
  type: 'habit' | 'timing' | 'environment' | 'strategy' | 'group' | 'identity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  action_steps: string[];
  expected_outcome: string;
  confidence: number;
  applicable_conditions?: string[];
}

export interface Insight {
  id: string;
  category: 'strategy' | 'mindset' | 'environment' | 'timing' | 'social' | 'pattern';
  insight: string;
  confidence: number;
  supporting_evidence: string[];
  applicability: 'individual' | 'general' | 'specific_condition';
  actionable: boolean;
}

// ============================================================================
// AGENT-SPECIFIC TYPES
// ============================================================================

export interface MentorResponse extends AgentResponse {
  habit_analysis: HabitAnalysis[];
  pattern_insights: PatternInsight[];
  coaching_advice: CoachingAdvice[];
  progress_assessment: ProgressAssessment;
}

export interface HabitAnalysis {
  habit_id: string;
  success_rate: number;
  current_streak: number;
  best_streak: number;
  optimal_conditions: OptimalConditions;
  failure_patterns: FailurePattern[];
  success_patterns: SuccessPattern[];
  // Adaptive Goals fields
  target_frequency?: number;
  actual_proofs?: number;
  completion_rate?: number; // Percentage (0-100+)
  missed_count?: number;
}

export interface OptimalConditions {
  best_time: string;
  best_duration: number;
  best_environment: string[];
  best_context: string;
  energy_level: string;
  mood: string;
}

export interface SuccessPattern {
  pattern_type: string;
  frequency: number;
  conditions: string[];
  confidence: number;
  description: string;
}

export interface FailurePattern {
  pattern_type: string;
  frequency: number;
  triggers: string[];
  confidence: number;
  description: string;
  suggested_solutions: string[];
}

export interface PatternInsight {
  pattern_name: string;
  description: string;
  confidence: number;
  implications: string[];
  recommendations: string[];
}

export interface CoachingAdvice {
  advice_type: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  expected_impact: string;
}

export interface ProgressAssessment {
  overall_progress: number;
  weekly_trend: 'improving' | 'stable' | 'declining';
  key_achievements: string[];
  areas_for_improvement: string[];
  next_milestones: string[];
}

export interface IdentityResponse extends AgentResponse {
  personality_profile: PersonalityProfile;
  habit_recommendations: HabitRecommendation[];
  identity_alignment: IdentityAlignment;
  identity_evolution: IdentityEvolution;
}

export interface HabitRecommendation {
  habit_id: string;
  compatibility_score: number;
  identity_impact: number;
  reasoning: string;
  implementation_difficulty: string;
  expected_benefits: string[];
}

export interface IdentityAlignment {
  overall_alignment: number;
  goal_alignments: Record<string, number>;
  recommendations: string[];
  misalignments: string[];
}

export interface IdentityEvolution {
  current_identity_strength: number;
  desired_identity_strength: number;
  progress_rate: number;
  supporting_habits: string[];
  hindering_factors: string[];
  evolution_strategy: string[];
}

export interface AccountabilityResponse extends AgentResponse {
  reminder_message: ReminderMessage;
  incentives: Incentive[];
  progress_update: ProgressUpdate;
  interventions: Intervention[];
  motivation: MotivationMessage;
}

export interface ReminderMessage {
  content: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timing: Date;
  channel: 'personal' | 'group' | 'public';
  personalization_level: 'low' | 'medium' | 'high';
}

export interface Incentive {
  type: string;
  description: string;
  value: number;
  conditions: string[];
  expiration?: Date;
}

export interface ProgressUpdate {
  current_streak: number;
  weekly_completion: number;
  weekly_goal: number;
  trend: 'improving' | 'stable' | 'declining';
  achievements: string[];
  challenges: string[];
}

export interface Intervention {
  type: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions: string[];
  follow_up_required: boolean;
  follow_up_date?: Date;
}

export interface MotivationMessage {
  type: string;
  content: string;
  tone: string;
  personalization: string[];
  expected_impact: string;
}

export interface GroupResponse extends Omit<AgentResponse, 'recommendations'> {
  group_analysis: GroupAnalysis;
  recommendations: GroupRecommendation[];
  interventions: GroupIntervention[];
  social_actions: SocialAction[];
  group_health: GroupHealth;
}

export interface GroupAnalysis {
  performance: GroupPerformance;
  dynamics: GroupDynamics;
  compatibility: CompatibilityMatrix;
  risks: RiskAssessment[];
}

export interface GroupDynamics {
  communication_frequency: number;
  support_exchanges: number;
  conflict_level: number;
  cohesion_score: number;
  role_clarity: number;
}

export interface CompatibilityMatrix {
  overall_compatibility: number;
  pairwise_compatibilities: Record<string, Record<string, number>>;
  compatibility_factors: string[];
  improvement_suggestions: string[];
}

export interface RiskAssessment {
  risk_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string;
  mitigation_strategies: string[];
}

export interface GroupRecommendation {
  type: string;
  description: string;
  priority: string;
  expected_impact: string;
  implementation_steps: string[];
}

export interface GroupIntervention {
  type: string;
  urgency: string;
  description: string;
  actions: string[];
  expected_outcome: string;
}

export interface SocialAction {
  type: string;
  target_users: string[];
  message: string;
  expected_response: string;
}

export interface GroupHealth {
  overall_score: number;
  communication_health: number;
  performance_health: number;
  social_health: number;
  risk_indicators: string[];
  recommendations: string[];
}

export interface LearningResponse extends Omit<AgentResponse, 'recommendations'> {
  extracted_insights: ExtractedInsight[];
  hurdle_analysis: HurdleAnalysis;
  recommendations: LearningRecommendation[];
  patterns: Pattern[];
  knowledge_updates: KnowledgeUpdate[];
}

export interface ExtractedInsight {
  insight: string;
  category: 'strategy' | 'mindset' | 'environment' | 'timing' | 'social';
  confidence: number;
  supporting_evidence: string[];
  applicability: 'individual' | 'general' | 'specific_condition';
}

export interface HurdleAnalysis {
  hurdle_id: string;
  classification: HurdleClassification;
  solution_effectiveness: SolutionEffectiveness;
  prevention_strategies: string[];
  similar_hurdles: string[];
}

export interface HurdleClassification {
  primary_category: string;
  secondary_categories: string[];
  severity: string;
  contributing_factors: string[];
  confidence: number;
}

export interface SolutionEffectiveness {
  overall: number;
  metrics: Record<string, number>;
  success_factors: string[];
  recommendations: string[];
}

export interface LearningRecommendation {
  type: string;
  description: string;
  based_on: string;
  confidence: number;
  implementation_guidance: string[];
}

export interface Pattern {
  pattern_name: string;
  themes: string[];
  recurring_elements: string[];
  significance: number;
  supporting_evidence: string[];
  category: string;
}

export interface KnowledgeUpdate {
  knowledge_id: string;
  update_type: string;
  content: string;
  confidence: number;
  source_users: string[];
  validation_status: string;
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface OrchestratorRequest {
  user_id: string;
  message: string;
  context: string;
  channel_id: string;
  timestamp: Date;
  user_context?: UserContext;
}

export interface OrchestratorResponse {
  success: boolean;
  primary_agent: string;
  agents_involved: string[];
  response: AgentResponse;
  processing_time: number;
  confidence: number;
  follow_up_required: boolean;
  follow_up_agents?: string[];
  metadata: Record<string, any>;
}

export interface AgentCapabilities {
  agent_id: string;
  capabilities: string[];
  specializations: string[];
  performance_metrics: AgentMetrics;
  availability: boolean;
  last_updated: Date;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AgentError extends Error {
  constructor(
    message: string,
    public agent: string,
    public error_code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class DataError extends Error {
  constructor(
    message: string,
    public source: 'notion' | 'neo4j' | 'discord',
    public operation: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'DataError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public expected_type: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface WeeklySummary {
  user_id: string;
  week_number: number;
  start_date: Date;
  summary: string;
  score: number;
  completion_rate: number;
  current_streak: number;
  best_streak: number;
  week_proofs: number;
  week_days: number;
  total_habits: number;
  achievements: string[];
  challenges: string[];
  next_week_focus: string[];
}

export interface SystemHealth {
  overall: boolean;
  services: {
    notion: boolean;
    neo4j: boolean;
    perplexity: boolean;
    discord: boolean;
  };
  timestamp: Date;
  response_times: Record<string, number>;
  error_rates: Record<string, number>;
}

export interface Metrics {
  agent_performance: Record<string, AgentMetrics>;
  user_engagement: UserEngagementMetrics;
  system_performance: SystemMetrics;
}

export interface AgentMetrics {
  response_time: number;
  success_rate: number;
  user_satisfaction: number;
  recommendation_accuracy: number;
  total_interactions: number;
}

export interface UserEngagementMetrics {
  daily_active_users: number;
  weekly_active_users: number;
  habit_completion_rate: number;
  feature_adoption_rate: number;
  user_retention_rate: number;
}

export interface SystemMetrics {
  uptime: number;
  error_rate: number;
  average_response_time: number;
  database_performance: number;
  api_performance: number;
}
