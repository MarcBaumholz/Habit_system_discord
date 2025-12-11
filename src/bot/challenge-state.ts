import fs from 'fs';
import path from 'path';
import { ChallengeState } from '../types/index.js';

/**
 * ChallengeStateManager
 *
 * Manages in-memory state for the weekly challenge system
 * with persistence to JSON file for bot restarts.
 */
export class ChallengeStateManager {
  private state: ChallengeState;
  private stateFilePath: string;

  constructor(stateFilePath?: string) {
    // Default to project root - use process.cwd() instead of __dirname
    this.stateFilePath = stateFilePath || path.join(process.cwd(), 'challenge-state.json');
    this.state = this.loadState();
  }

  /**
   * Load state from JSON file or create default state
   */
  private loadState(): ChallengeState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf-8');
        const loadedState = JSON.parse(data) as ChallengeState;
        console.log('[ChallengeState] Loaded existing state:', loadedState);
        return loadedState;
      }
    } catch (error) {
      console.error('[ChallengeState] Error loading state file:', error);
    }

    // Create default state
    const defaultState: ChallengeState = {
      currentChallengeIndex: 0,
      currentWeekStart: '',
      currentWeekEnd: '',
      joinedUserIds: [],
      lastUpdated: new Date().toISOString(),
      pollChallengeGroup: 0
    };

    console.log('[ChallengeState] Created default state');
    this.saveState(defaultState);
    return defaultState;
  }

  /**
   * Save state to JSON file
   */
  private saveState(state?: ChallengeState): void {
    try {
      const stateToSave = state || this.state;
      stateToSave.lastUpdated = new Date().toISOString();

      fs.writeFileSync(
        this.stateFilePath,
        JSON.stringify(stateToSave, null, 2),
        'utf-8'
      );

      console.log('[ChallengeState] State saved successfully');
    } catch (error) {
      console.error('[ChallengeState] Error saving state:', error);
    }
  }

  /**
   * Get current state
   */
  getState(): ChallengeState {
    return { ...this.state };
  }

  /**
   * Get current challenge index (0-19)
   */
  getCurrentChallengeIndex(): number {
    return this.state.currentChallengeIndex;
  }

  /**
   * Set current challenge index
   */
  setCurrentChallengeIndex(index: number): void {
    this.state.currentChallengeIndex = index;
    this.saveState();
  }

  /**
   * Get current week dates
   */
  getCurrentWeek(): { weekStart: string; weekEnd: string } {
    return {
      weekStart: this.state.currentWeekStart,
      weekEnd: this.state.currentWeekEnd
    };
  }

  /**
   * Set current week dates
   */
  setCurrentWeek(weekStart: string, weekEnd: string): void {
    this.state.currentWeekStart = weekStart;
    this.state.currentWeekEnd = weekEnd;
    this.saveState();
  }

  /**
   * Get challenge message ID
   */
  getChallengeMessageId(): string | undefined {
    return this.state.challengeMessageId;
  }

  /**
   * Set challenge message ID
   */
  setChallengeMessageId(messageId: string): void {
    this.state.challengeMessageId = messageId;
    this.saveState();
  }

  /**
   * Get joined user IDs for current week
   */
  getJoinedUserIds(): string[] {
    return [...this.state.joinedUserIds];
  }

  /**
   * Add user to joined list
   */
  addJoinedUser(userId: string): void {
    if (!this.state.joinedUserIds.includes(userId)) {
      this.state.joinedUserIds.push(userId);
      this.saveState();
    }
  }

  /**
   * Check if user has joined current challenge
   */
  hasUserJoined(userId: string): boolean {
    return this.state.joinedUserIds.includes(userId);
  }

  /**
   * Clear joined users (for new week)
   */
  clearJoinedUsers(): void {
    this.state.joinedUserIds = [];
    this.saveState();
  }

  /**
   * Get last evaluation date
   */
  getLastEvaluationDate(): string | undefined {
    return this.state.lastEvaluationDate;
  }

  /**
   * Set last evaluation date
   */
  setLastEvaluationDate(date: string): void {
    this.state.lastEvaluationDate = date;
    this.saveState();
  }

  /**
   * Start new week (rotate challenge and clear participants)
   */
  startNewWeek(weekStart: string, weekEnd: string, nextChallengeIndex: number): void {
    this.state.currentChallengeIndex = nextChallengeIndex;
    this.state.currentWeekStart = weekStart;
    this.state.currentWeekEnd = weekEnd;
    this.state.joinedUserIds = [];
    this.state.challengeMessageId = undefined;
    this.saveState();

    console.log(`[ChallengeState] Started new week: Challenge ${nextChallengeIndex + 1}, ${weekStart} - ${weekEnd}`);
  }

  /**
   * Reset state to default (for testing)
   */
  reset(): void {
    this.state = {
      currentChallengeIndex: 0,
      currentWeekStart: '',
      currentWeekEnd: '',
      joinedUserIds: [],
      lastUpdated: new Date().toISOString(),
      pollChallengeGroup: 0
    };
    this.saveState();
    console.log('[ChallengeState] State reset to default');
  }

  /**
   * Get participant count
   */
  getParticipantCount(): number {
    return this.state.joinedUserIds.length;
  }

  /**
   * Get poll message ID
   */
  getPollMessageId(): string | undefined {
    return this.state.pollMessageId;
  }

  /**
   * Set poll message ID
   */
  setPollMessageId(messageId: string): void {
    this.state.pollMessageId = messageId;
    this.saveState();
  }

  /**
   * Get poll challenge group (0-3)
   */
  getPollChallengeGroup(): number {
    return this.state.pollChallengeGroup;
  }

  /**
   * Set poll challenge group and rotate to next
   */
  rotatePollChallengeGroup(): void {
    this.state.pollChallengeGroup = (this.state.pollChallengeGroup + 1) % 4;
    this.saveState();
    console.log(`[ChallengeState] Rotated to challenge group ${this.state.pollChallengeGroup + 1} (challenges ${this.state.pollChallengeGroup * 5 + 1}-${(this.state.pollChallengeGroup + 1) * 5})`);
  }

  /**
   * Get voted challenge index
   */
  getVotedChallengeIndex(): number | undefined {
    return this.state.votedChallengeIndex;
  }

  /**
   * Set voted challenge index (from poll results)
   */
  setVotedChallengeIndex(index: number): void {
    this.state.votedChallengeIndex = index;
    this.saveState();
    console.log(`[ChallengeState] Set voted challenge index to ${index}`);
  }

  /**
   * Clear voted challenge index (after deployment)
   */
  clearVotedChallengeIndex(): void {
    this.state.votedChallengeIndex = undefined;
    this.saveState();
  }

  /**
   * Export state as JSON string (for debugging)
   */
  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import state from JSON string (for debugging/migration)
   */
  importState(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString) as ChallengeState;
      this.state = imported;
      this.saveState();
      console.log('[ChallengeState] State imported successfully');
    } catch (error) {
      console.error('[ChallengeState] Error importing state:', error);
      throw new Error('Failed to import state: Invalid JSON');
    }
  }
}
