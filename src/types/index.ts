export interface User {
  id: string;
  discordId: string;
  name: string;
  timezone: string;
  bestTime: string;
  trustCount: number;
  personalChannelId?: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  domains: string[];
  frequency: number; // Days per week (1-7)
  context: string;
  difficulty: string;
  smartGoal: string;
  why: string;
  minimalDose: string;
  habitLoop: string;
  implementationIntentions: string;
  hurdles: string;
  reminderType: string;
}

export interface Proof {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  unit: string;
  note?: string;
  attachmentUrl?: string;
  isMinimalDose: boolean;
  isCheatDay: boolean;
}

export interface Learning {
  id: string;
  userId: string;
  habitId?: string;
  discordId?: string;
  text: string;
  createdAt: string;
}

export interface Hurdle {
  id: string;
  userId: string;
  habitId?: string;
  name: string;
  hurdleType: 'Time Management' | 'Motivation' | 'Environment' | 'Social' | 'Health' | 'Resources' | 'Knowledge' | 'Habit Stacking' | 'Perfectionism' | 'Other';
  description: string;
  date: string;
}

export interface Week {
  id: string;
  userId: string;
  discordId?: string;
  weekNum: number;
  startDate: string;
  summary?: string;
  score: number;
}

export interface Group {
  id: string;
  name: string;
  channelId: string;
  donationPool: number;
}

// User Profile für Personality DB
export interface UserProfile {
  id: string;
  discordId: string;
  user?: User; // Relation zur Users DB
  joinDate?: string;
  personalityType?: string; // INTJ, ENFP, etc.
  coreValues?: string[];
  lifeVision?: string;
  mainGoals?: string[];
  bigFiveTraits?: string; // JSON als String
  lifeDomains?: string[];
  lifePhase?: string;
  desiredIdentity?: string;
  openSpace?: string;
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