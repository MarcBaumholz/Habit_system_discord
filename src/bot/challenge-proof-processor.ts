import { Message, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client.js';
import { ChallengeManager } from './challenge-manager.js';
import { ChallengeStateManager } from './challenge-state.js';

/**
 * ChallengeProofProcessor
 *
 * Processes proof submissions in the weekly challenges channel.
 * Validates submissions and saves to Notion Challenge Proofs database.
 */
export class ChallengeProofProcessor {
  private notion: NotionClient;
  private challengeManager: ChallengeManager;
  private stateManager: ChallengeStateManager;

  constructor(
    notion: NotionClient,
    challengeManager: ChallengeManager,
    stateManager: ChallengeStateManager
  ) {
    this.notion = notion;
    this.challengeManager = challengeManager;
    this.stateManager = stateManager;
  }

  /**
   * Process a message as a potential challenge proof
   */
  async processMessage(message: Message): Promise<void> {
    try {
      // Ignore bot messages
      if (message.author.bot) return;

      // Get current challenge state
      const { weekStart, weekEnd } = this.stateManager.getCurrentWeek();
      const currentIndex = this.stateManager.getCurrentChallengeIndex();

      if (!weekStart || !weekEnd) {
        // No active challenge
        await message.reply('⚠️ There is no active challenge right now. Wait for Sunday at 3 PM for the next challenge!');
        return;
      }

      const challenge = this.challengeManager.getChallengeByIndex(currentIndex);
      if (!challenge) {
        console.error('[ChallengeProofProcessor] Challenge not found for index:', currentIndex);
        return;
      }

      // Check if user has joined the challenge
      const hasJoined = this.stateManager.hasUserJoined(message.author.id);
      if (!hasJoined) {
        await message.reply('❌ You need to join the challenge first! Click the "Join Challenge" button in the challenge announcement.');
        return;
      }

      // Get user from Notion
      const user = await this.notion.getUserByDiscordId(message.author.id);
      if (!user) {
        await message.reply('❌ You need to join the habit system first! Use `/join` in the main channel.');
        return;
      }

      // Get today's date
      const today = this.formatDate(new Date());

      // Check if user already submitted proof today
      const alreadySubmitted = await this.notion.hasUserSubmittedChallengeProofToday(
        user.id,
        today,
        weekStart,
        challenge.id
      );

      if (alreadySubmitted) {
        await message.reply('⚠️ You already submitted a proof for today! Maximum 1 proof per day.');
        return;
      }

      // Check if date is within challenge period
      if (today < weekStart || today > weekEnd) {
        await message.reply('⚠️ This challenge period has ended. Wait for the next challenge!');
        return;
      }

      // Extract proof details from message
      const { unit, note, isMinimalDose } = this.extractProofDetails(
        message.content,
        challenge.dailyRequirement,
        challenge.minimalDose
      );

      // Create challenge proof
      await this.notion.createChallengeProof({
        challengeNumber: challenge.id,
        challengeName: challenge.name,
        userId: user.id,
        date: today,
        unit,
        note,
        isMinimalDose,
        weekStart,
        weekEnd
      });

      // React to message
      if (isMinimalDose) {
        await message.react('⭐'); // Star for minimal dose
      } else {
        await message.react('✅'); // Checkmark for full proof
      }

      // Send confirmation
      const emoji = isMinimalDose ? '⭐' : '✅';
      const type = isMinimalDose ? 'minimal dose' : 'full';

      // Get user's current proof count
      const userProofs = await this.notion.getUserChallengeProofs(user.id, weekStart, challenge.id);
      const proofCount = userProofs.length;

      await message.reply(
        `${emoji} **Proof recorded!** (${type})\n` +
        `📊 Progress: ${proofCount}/${challenge.daysRequired} days completed\n` +
        `${proofCount >= challenge.daysRequired ? '🎉 **You completed the challenge! Keep going for bonus points!**' : `💪 ${challenge.daysRequired - proofCount} more to go!`}`
      );

      console.log(`[ChallengeProofProcessor] Proof saved: ${user.name} - Challenge ${challenge.id} - ${today}`);
    } catch (error) {
      console.error('[ChallengeProofProcessor] Error processing message:', error);
      await message.reply('❌ Sorry, there was an error processing your proof. Please try again.');
    }
  }

  /**
   * Extract proof details from message content
   */
  private extractProofDetails(
    content: string,
    dailyRequirement: string,
    minimalDose: string
  ): { unit: string; note: string; isMinimalDose: boolean } {
    // Use the message content as the unit
    // User can write anything like "90 minutes deep work" or "3 pages journaling"
    const unit = content.substring(0, 200); // Limit to 200 chars

    // For now, we'll assume full proof unless user explicitly mentions "minimal"
    // In future, we could use AI to determine this
    const isMinimalDose = content.toLowerCase().includes('minimal');

    const note = content; // Full message as note

    return { unit, note, isMinimalDose };
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get user's current progress for active challenge
   */
  async getUserProgress(userId: string): Promise<{
    proofCount: number;
    daysRequired: number;
    completed: boolean;
    challengeName: string;
  } | null> {
    try {
      const { weekStart } = this.stateManager.getCurrentWeek();
      const currentIndex = this.stateManager.getCurrentChallengeIndex();
      const challenge = this.challengeManager.getChallengeByIndex(currentIndex);

      if (!challenge || !weekStart) {
        return null;
      }

      const user = await this.notion.getUserByDiscordId(userId);
      if (!user) {
        return null;
      }

      const proofs = await this.notion.getUserChallengeProofs(user.id, weekStart, challenge.id);

      return {
        proofCount: proofs.length,
        daysRequired: challenge.daysRequired,
        completed: proofs.length >= challenge.daysRequired,
        challengeName: challenge.name
      };
    } catch (error) {
      console.error('[ChallengeProofProcessor] Error getting user progress:', error);
      return null;
    }
  }
}
