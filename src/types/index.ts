export interface User {
  id: string;
  discordId: string;
  name: string;
  nickname?: string; // User's nickname (from nickname field in Notion)
  timezone: string;
  bestTime: string;
  trustCount: number;
  personalChannelId?: string;
  status?: 'active' | 'pause';
  pauseReason?: string;
  pauseDuration?: string;
  buddy?: string; // Nickname of buddy (select field stores nickname)
  buddyStart?: string; // Date when buddy pairing started (YYYY-MM-DD)
  batch?: string[]; // Multi-select of batches user has participated in (e.g., ["january 2026", "february 2026"])
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  domains: string[];
  frequency: number; // Days per week (1-7)
  selectedDays?: string[]; // Array of selected days (Mon, Tue, Wed, etc.)
  context: string;
  difficulty: string;
  smartGoal: string;
  why: string;
  minimalDose: string;
  habitLoop: string;
  implementationIntentions?: string; // Made optional (removed from form)
  hurdles: string;
  reminderType: string;
  autonomy?: string; // Autonomy reflection
  curiosityPassionPurpose?: string; // Triangle of curiosity, passion, purpose
  consequences?: string; // Consequences of not committing
  commitmentSignature?: string; // 90-day commitment confirmation
  batch?: string; // Current active batch when habit was created (e.g., "january 2026")
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
  batch?: string; // Batch the proof belongs to (inherited from habit at creation time)
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
  reflectionResponses?: string;
  reflectionCompleted?: boolean;
  reflectionDate?: string;
}

export interface Group {
  id: string;
  name: string;
  channelId: string;
  donationPool: number;
}

export type BatchStatus = 'pre-phase' | 'active' | 'completed';

export interface BatchMetadata {
  name: string; // e.g., "january 2026"
  createdDate: string; // ISO date string (YYYY-MM-DD) - when batch was created
  startDate: string; // ISO date string (YYYY-MM-DD) - when batch officially starts (Day 1)
  endDate: string; // ISO date string (YYYY-MM-DD) - when batch ends (Day 90)
  status: BatchStatus; // Current batch status
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
  responseStyle?: string; // AI response style/tone of voice
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

// Price Pool Entry (Money Accountability)
export interface PricePoolEntry {
  id: string;
  discordId: string;
  userId?: string; // Relation to Users DB
  weekDate: string; // Monday of the week (YYYY-MM-DD)
  message: string; // Description of the charge
  price: number; // Charge amount in euros
  batch?: string; // Batch the charge belongs to (e.g., "january 2026")
}

// Habit Compliance Tracking
export interface HabitCompliance {
  habitId: string;
  habitName: string;
  targetFrequency: number; // Expected completions per week
  actualProofs: number; // Actual completions
  missedCount: number; // Number of missed iterations
  charge: number; // Fee charged (€0.50 per miss)
  completionRate: number; // Percentage (0-100)
}

// User Compliance for Weekly Report
export interface UserCompliance {
  userId: string;
  discordId: string;
  name: string;
  habits: HabitCompliance[];
  totalCharge: number;
  perfectWeek: boolean; // All habits completed
  totalHabits: number;
  completedHabits: number; // Habits with 100% compliance
  overallCompletionRate: number; // Average across all habits
  currentStreak: number; // Consecutive perfect weeks
}

// Weekly Report Summary
export interface WeeklyAccountabilitySummary {
  totalUsers: number;
  perfectWeeks: number;
  usersWithCharges: number;
  totalCharges: number;
  poolBalance: number;
}

// Weekly Report Pool Summary
export interface WeeklyPoolContributor {
  name: string;
  amount: number;
}

export interface WeeklyPoolSummary {
  weeklyCharges: number;
  poolBalance: number;
  topContributors: WeeklyPoolContributor[];
}

// User Compliance Summary (limited view for report)
export interface UserComplianceSummary {
  name: string;
  discordId: string;
  completionRate: number;
  habits: HabitCompliance[];
  totalCharge: number;
  streak: number;
  oneLiner: string;
}

export interface ChallengingHabitSummary {
  habitName: string;
  avgCompletionRate: number;
  usersStruggling: number;
}

export type BuddyPerformanceStatus = 'both_on_track' | 'mixed' | 'both_struggling';

export interface BuddyPerformancePair {
  userA: string;
  userB: string;
  combinedCompletionRate: number;
  status: BuddyPerformanceStatus;
}

export interface BuddyPerformanceSummary {
  pairs: BuddyPerformancePair[];
  unpairedCount: number;
}

export interface RiskAlert {
  name: string;
  reason: string;
}

export interface PerfectWeekAchiever {
  name: string;
  streak: number;
  totalHabits: number;
}

export interface AdaptiveGoalRecommendation {
  name: string;
  habitName: string;
  currentRate: number;
  targetFrequency: number;
  recommendedTarget: number;
}

// Weekly Accountability Report
export interface WeeklyAccountabilityReport {
  weekStart: string; // Monday
  weekEnd: string; // Sunday
  summary: WeeklyAccountabilitySummary;
  leaderboard: LeaderboardEntry[];
  userCompliance: UserComplianceSummary[];
  socialInsights: string[];
  poolSummary: WeeklyPoolSummary;
  challengingHabits: ChallengingHabitSummary[];
  buddyPerformance: BuddyPerformanceSummary;
  riskAlerts: RiskAlert[];
  perfectWeekClub: PerfectWeekAchiever[];
  adaptiveGoals: AdaptiveGoalRecommendation[];
  generatedAt: string;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  discordId: string;
  name: string;
  overallCompletionRate: number;
  totalHabits: number;
  completedHabits: number;
  currentStreak: number;
  badge?: string; // e.g., "🏆", "🥇", "🔥"
}

// ============================================
// WEEKLY CHALLENGE SYSTEM
// ============================================

// Challenge Definition (from MD file)
export interface Challenge {
  id: number; // 1-20
  name: string;
  description: string;
  dailyRequirement: string;
  minimalDose: string;
  daysRequired: number; // 5-7
  category: 'CEO' | 'Biohacking' | 'Life Improvement' | 'Productivity' | 'Health';
  source: string; // Attribution (CEO name, researcher, etc.)
  link: string; // External resource link
}

// Challenge Proof (Notion Database Entry)
export interface ChallengeProof {
  id: string;
  challengeNumber: number; // 1-20
  challengeName: string;
  userId: string;
  date: string; // YYYY-MM-DD
  unit: string;
  note?: string;
  isMinimalDose: boolean;
  weekStart: string; // Sunday when challenge started (YYYY-MM-DD)
  weekEnd: string; // Following Sunday (YYYY-MM-DD)
}

// Challenge State (in-memory & persisted to JSON)
export interface ChallengeState {
  currentChallengeIndex: number; // 0-19 (maps to challenge 1-20)
  currentWeekStart: string; // Sunday date (YYYY-MM-DD)
  currentWeekEnd: string; // Following Sunday (YYYY-MM-DD)
  challengeMessageId?: string; // Discord message ID for the challenge post
  joinedUserIds: string[]; // User IDs who joined this week's challenge
  lastEvaluationDate?: string; // Last time evaluation ran
  lastUpdated: string; // Timestamp of last state update
  pollMessageId?: string; // Discord poll message ID (Saturday)
  pollChallengeGroup: number; // 0-3 (which group of 5 challenges was offered)
  votedChallengeIndex?: number; // Winning challenge index from poll
}

// Challenge Participant Progress (calculated from proofs)
export interface ChallengeParticipantProgress {
  userId: string;
  discordId: string;
  name: string;
  proofsSubmitted: number;
  daysRequired: number;
  completed: boolean;
  proofDates: string[]; // Array of dates when proofs were submitted
  minimalDoseCount: number; // How many were minimal dose
  fullProofCount: number; // How many were full proofs
}

// Challenge Evaluation Results
export interface ChallengeEvaluationResult {
  challengeNumber: number;
  challengeName: string;
  weekStart: string;
  weekEnd: string;
  totalParticipants: number;
  winners: ChallengeParticipantProgress[];
  participants: ChallengeParticipantProgress[];
  totalRewardsAwarded: number; // Total €1 rewards given
  evaluatedAt: string;
}

// ============================================
// BUDDY SYSTEM
// ============================================

// Buddy Progress Data
export interface BuddyProgressData {
  nickname: string;
  habits: Habit[];
  proofs: Proof[];
  completionRate: number;
  currentStreak: number;
  habitsWithIssues: Array<{
    habitName: string;
    targetFrequency: number;
    actualFrequency: number;
    goal: string;
  }>;
}
