/**
 * Improved Notion Data Retrieval - Accurate, validated, efficient
 * Based on chatbot's retrieval patterns with validation
 */

import { NotionClient } from '../../notion/client';
import { User, Habit, Proof, Learning, Hurdle, UserProfile } from '../../types';

// ============================================================================
// DATA VALIDATION & SANITIZATION
// ============================================================================

export class NotionDataValidator {
  /**
   * Validates user data completeness
   */
  static validateUser(user: User | null): user is User {
    if (!user) return false;
    if (!user.id || !user.discordId || !user.name) return false;
    return true;
  }

  /**
   * Validates habit data completeness
   */
  static validateHabit(habit: Habit | null): habit is Habit {
    if (!habit) return false;
    if (!habit.id || !habit.name || !habit.userId) return false;
    if (habit.frequency === undefined || habit.frequency === null) return false;
    return true;
  }

  /**
   * Validates proof data
   */
  static validateProof(proof: Proof | null): proof is Proof {
    if (!proof) return false;
    if (!proof.id || !proof.userId || !proof.habitId) return false;
    return true;
  }

  /**
   * Sanitizes user data - ensures all fields exist
   */
  static sanitizeUser(user: any): User | null {
    try {
      return {
        id: user.id || '',
        discordId: user.discordId || '',
        name: user.name || 'Unknown',
        timezone: user.timezone || 'Europe/Berlin',
        bestTime: user.bestTime || '09:00',
        trustCount: user.trustCount ?? 0,
        status: user.status || 'active',
        personalChannelId: user.personalChannelId,
        batch: user.batch || [],
      };
    } catch (error) {
      console.error('Failed to sanitize user:', error);
      return null;
    }
  }

  /**
   * Sanitizes habit data
   */
  static sanitizeHabit(habit: any): Habit | null {
    try {
      return {
        id: habit.id || '',
        userId: habit.userId || '',
        name: habit.name || 'Unnamed Habit',
        domains: habit.domains || [],
        frequency: habit.frequency ?? 1,
        selectedDays: habit.selectedDays || [],
        context: habit.context || '',
        difficulty: habit.difficulty || 'medium',
        smartGoal: habit.smartGoal || '',
        why: habit.why || '',
        minimalDose: habit.minimalDose || '',
        habitLoop: habit.habitLoop || '',
        hurdles: habit.hurdles || '',
        reminderType: habit.reminderType || '',
        implementationIntentions: habit.implementationIntentions,
        autonomy: habit.autonomy,
        curiosityPassionPurpose: habit.curiosityPassionPurpose,
        consequences: habit.consequences,
        commitmentSignature: habit.commitmentSignature,
        batch: habit.batch,
      };
    } catch (error) {
      console.error('Failed to sanitize habit:', error);
      return null;
    }
  }
}

// ============================================================================
// EFFICIENT DATA RETRIEVAL
// ============================================================================

export class ImprovedNotionRetrieval {
  private notion: NotionClient;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(notion: NotionClient) {
    this.notion = notion;
  }

  /**
   * Get user with validation and caching
   */
  async getUserByDiscordId(discordId: string): Promise<User | null> {
    const cacheKey = `user:${discordId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as User;

    try {
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) return null;

      const sanitized = NotionDataValidator.sanitizeUser(user);
      if (!sanitized || !NotionDataValidator.validateUser(sanitized)) {
        console.error('Invalid user data:', { discordId, user });
        return null;
      }

      this.setCache(cacheKey, sanitized);
      return sanitized;
    } catch (error) {
      console.error('Failed to get user:', { discordId, error });
      return null;
    }
  }

  /**
   * Get habits with validation - returns only active habits
   */
  async getActiveHabitsByUserId(userId: string): Promise<Habit[]> {
    const cacheKey = `habits:${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as Habit[];

    try {
      const habits = await this.notion.getHabitsByUserId(userId);

      // Sanitize and validate each habit
      const validHabits = habits
        .map(h => NotionDataValidator.sanitizeHabit(h))
        .filter((h): h is Habit => NotionDataValidator.validateHabit(h));

      this.setCache(cacheKey, validHabits);
      return validHabits;
    } catch (error) {
      console.error('Failed to get habits:', { userId, error });
      return [];
    }
  }

  /**
   * Get recent proofs with time filtering
   */
  async getRecentProofs(
    userId: string,
    daysBack: number = 7
  ): Promise<Proof[]> {
    const cacheKey = `proofs:${userId}:${daysBack}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as Proof[];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const proofs = await this.notion.getProofsByUserId(userId);

      // Filter to recent proofs only
      const recentProofs = proofs.filter(p => {
        const proofDate = new Date(p.date);
        return proofDate >= startDate;
      });

      // Validate each proof
      const validProofs = recentProofs.filter(p =>
        NotionDataValidator.validateProof(p)
      );

      this.setCache(cacheKey, validProofs);
      return validProofs;
    } catch (error) {
      console.error('Failed to get recent proofs:', { userId, daysBack, error });
      return [];
    }
  }

  /**
   * Get habit with proofs - efficient combined query
   */
  async getHabitWithProofs(
    userId: string,
    habitId: string,
    daysBack: number = 7
  ): Promise<{ habit: Habit | null; proofs: Proof[] }> {
    try {
      // Parallel queries for efficiency
      const [habits, proofs] = await Promise.all([
        this.getActiveHabitsByUserId(userId),
        this.getRecentProofs(userId, daysBack),
      ]);

      const habit = habits.find(h => h.id === habitId) || null;
      const habitProofs = proofs.filter(p => p.habitId === habitId);

      return { habit, proofs: habitProofs };
    } catch (error) {
      console.error('Failed to get habit with proofs:', { userId, habitId, error });
      return { habit: null, proofs: [] };
    }
  }

  /**
   * Get user profile with caching
   */
  async getUserProfileByDiscordId(discordId: string): Promise<UserProfile | null> {
    const cacheKey = `profile:${discordId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as UserProfile;

    try {
      const profile = await this.notion.getUserProfileByDiscordId(discordId);
      if (profile) {
        this.setCache(cacheKey, profile);
      }
      return profile;
    } catch (error) {
      console.error('Failed to get user profile:', { discordId, error });
      return null;
    }
  }

  /**
   * Get comprehensive user context - all data in one call
   */
  async getComprehensiveUserContext(discordId: string, daysBack: number = 7): Promise<{
    user: User | null;
    habits: Habit[];
    proofs: Proof[];
    learnings: Learning[];
    hurdles: Hurdle[];
    profile: UserProfile | null;
  }> {
    try {
      // Get user first
      const user = await this.getUserByDiscordId(discordId);
      if (!user) {
        return { user: null, habits: [], proofs: [], learnings: [], hurdles: [], profile: null };
      }

      // Parallel queries for all data including profile
      const [habits, proofs, learnings, hurdles, profile] = await Promise.all([
        this.getActiveHabitsByUserId(user.id),
        this.getRecentProofs(user.id, daysBack),
        this.notion.getLearningsByUserId(user.id),
        this.notion.getHurdlesByUserId(user.id),
        this.getUserProfileByDiscordId(discordId),
      ]);

      return { user, habits, proofs, learnings, hurdles, profile };
    } catch (error) {
      console.error('Failed to get comprehensive context:', { discordId, error });
      return { user: null, habits: [], proofs: [], learnings: [], hurdles: [], profile: null };
    }
  }

  /**
   * Get habit analysis data - weekly breakdown
   */
  async getHabitAnalysis(userId: string, daysBack: number = 7): Promise<Array<{
    habitId: string;
    habitName: string;
    targetFrequency: number;
    actualProofs: number;
    completionRate: number;
    streak: number;
    lastProof: Date | null;
  }>> {
    try {
      const { habits, proofs } = await Promise.all([
        this.getActiveHabitsByUserId(userId),
        this.getRecentProofs(userId, daysBack),
      ]).then(([habits, proofs]) => ({ habits, proofs }));

      return habits.map(habit => {
        const habitProofs = proofs.filter(p => p.habitId === habit.id);

        // Calculate streak
        let streak = 0;
        const sortedProofs = habitProofs.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        let lastDate = new Date();
        for (const proof of sortedProofs) {
          const proofDate = new Date(proof.date);
          const daysDiff = Math.floor(
            (lastDate.getTime() - proofDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff <= 1) {
            streak++;
            lastDate = proofDate;
          } else {
            break;
          }
        }

        const targetFrequency = habit.frequency || 1;
        const actualProofs = habitProofs.length;
        const expectedProofs = Math.ceil((daysBack / 7) * targetFrequency);
        const completionRate = expectedProofs > 0 ? (actualProofs / expectedProofs) * 100 : 0;

        return {
          habitId: habit.id,
          habitName: habit.name,
          targetFrequency,
          actualProofs,
          completionRate: Math.min(completionRate, 100),
          streak,
          lastProof: habitProofs.length > 0 ? new Date(habitProofs[0].date) : null,
        };
      });
    } catch (error) {
      console.error('Failed to get habit analysis:', { userId, error });
      return [];
    }
  }

  /**
   * Get buddy progress data
   * @param userIdOrDiscordId - Either Notion user ID or Discord ID
   */
  async getBuddyProgress(userIdOrDiscordId: string): Promise<{
    nickname: string;
    completionRate: number;
    currentStreak: number;
    habits: Habit[];
    proofs: Proof[];
  } | null> {
    try {
      // Try to get user - first check if it's a Discord ID (length check)
      let user = null;
      if (userIdOrDiscordId.length < 30) {
        // Likely a Discord ID (numeric string)
        user = await this.getUserByDiscordId(userIdOrDiscordId);
      } else {
        // Likely a Notion user ID (UUID format), get user by ID directly
        const allUsers = await this.notion.getAllUsers();
        user = allUsers.find(u => u.id === userIdOrDiscordId) || null;
      }

      if (!user || !user.buddy) return null;

      // Get buddy's user record
      const buddyUser = await this.notion.getUserByNickname(user.buddy);
      if (!buddyUser) return null;

      // Get buddy's data
      const { habits, proofs } = await Promise.all([
        this.getActiveHabitsByUserId(buddyUser.id),
        this.getRecentProofs(buddyUser.id, 7),
      ]).then(([habits, proofs]) => ({ habits, proofs }));

      // Calculate completion rate
      const totalExpected = habits.reduce((sum, h) => sum + (h.frequency || 1), 0);
      const actualProofs = proofs.length;
      const completionRate = totalExpected > 0 ? (actualProofs / totalExpected) * 100 : 0;

      // Calculate current streak
      let currentStreak = 0;
      const sortedProofs = proofs.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      let lastDate = new Date();
      for (const proof of sortedProofs) {
        const proofDate = new Date(proof.date);
        const daysDiff = Math.floor(
          (lastDate.getTime() - proofDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 1) {
          currentStreak++;
          lastDate = proofDate;
        } else {
          break;
        }
      }

      return {
        nickname: user.buddy,
        completionRate: Math.min(completionRate, 100),
        currentStreak,
        habits,
        proofs,
      };
    } catch (error) {
      console.error('Failed to get buddy progress:', { userIdOrDiscordId, error });
      return null;
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}
