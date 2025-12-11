import cron from 'node-cron';
import { TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { NotionClient } from '../notion/client.js';
import { ChallengeManager } from './challenge-manager.js';
import { ChallengeStateManager } from './challenge-state.js';
import { ChallengeParticipantProgress, ChallengeEvaluationResult } from '../types/index.js';

/**
 * ChallengeScheduler
 *
 * Manages the weekly challenge cycle with 3 cron jobs:
 * 1. Sunday 9 AM - Evaluation of last week's challenge
 * 2. Sunday 3 PM - Deploy new challenge for the week
 * 3. Wednesday 12 PM - Mid-week reminder
 */
export class ChallengeScheduler {
  private notion: NotionClient;
  private challengeManager: ChallengeManager;
  private stateManager: ChallengeStateManager;
  private weeklyChannelId: string;
  private client: any; // Discord client

  constructor(
    notion: NotionClient,
    challengeManager: ChallengeManager,
    stateManager: ChallengeStateManager,
    weeklyChannelId: string,
    discordClient: any
  ) {
    this.notion = notion;
    this.challengeManager = challengeManager;
    this.stateManager = stateManager;
    this.weeklyChannelId = weeklyChannelId;
    this.client = discordClient;
  }

  /**
   * Initialize all cron jobs
   */
  start(): void {
    const timezone = process.env.TIMEZONE || 'Europe/Berlin';

    // Saturday 3 PM - Send Poll for Next Week's Challenge
    cron.schedule('0 15 * * 6', async () => {
      await this.sendChallengePoll();
    }, {
      scheduled: true,
      timezone: timezone
    });

    console.log('✅ Challenge poll scheduled: Saturday 3 PM');

    // Sunday 9 AM - Evaluation
    cron.schedule('0 9 * * 0', async () => {
      await this.runWeeklyEvaluation();
    }, {
      scheduled: true,
      timezone: timezone
    });

    console.log('✅ Challenge evaluation scheduled: Sunday 9 AM');

    // Sunday 3 PM - New Challenge Deployment (uses poll results)
    cron.schedule('0 15 * * 0', async () => {
      await this.deployNewChallenge();
    }, {
      scheduled: true,
      timezone: timezone
    });

    console.log('✅ Challenge deployment scheduled: Sunday 3 PM');

    // Wednesday 12 PM - Mid-week Reminder
    cron.schedule('0 12 * * 3', async () => {
      await this.sendMidWeekReminder();
    }, {
      scheduled: true,
      timezone: timezone
    });

    console.log('✅ Mid-week reminder scheduled: Wednesday 12 PM');
  }

  /**
   * Sunday 9 AM - Evaluate last week's challenge and award winners
   */
  private async runWeeklyEvaluation(): Promise<void> {
    try {
      console.log('[ChallengeScheduler] Running weekly evaluation...');

      const state = this.stateManager.getState();
      const { weekStart, weekEnd } = this.stateManager.getCurrentWeek();
      const currentChallengeIndex = this.stateManager.getCurrentChallengeIndex();

      // Check if we have a challenge to evaluate
      if (!weekStart || !weekEnd) {
        console.log('[ChallengeScheduler] No active challenge to evaluate');
        return;
      }

      const challenge = this.challengeManager.getChallengeByIndex(currentChallengeIndex);
      if (!challenge) {
        console.error('[ChallengeScheduler] Challenge not found for index:', currentChallengeIndex);
        return;
      }

      // Get all proofs for this challenge
      const allProofs = await this.notion.getChallengeProofsByWeek(weekStart, challenge.id);

      // Group proofs by user
      const userProofsMap = new Map<string, typeof allProofs>();
      allProofs.forEach(proof => {
        if (!userProofsMap.has(proof.userId)) {
          userProofsMap.set(proof.userId, []);
        }
        userProofsMap.get(proof.userId)!.push(proof);
      });

      // Calculate participant progress
      const participants: ChallengeParticipantProgress[] = [];
      const winners: ChallengeParticipantProgress[] = [];

      for (const [userId, proofs] of userProofsMap.entries()) {
        const user = await this.notion.getUserById(userId);
        if (!user) continue;

        const minimalDoseCount = proofs.filter(p => p.isMinimalDose).length;
        const fullProofCount = proofs.filter(p => !p.isMinimalDose).length;
        const proofsSubmitted = proofs.length;
        const completed = proofsSubmitted >= challenge.daysRequired;

        const progress: ChallengeParticipantProgress = {
          userId,
          discordId: user.discordId,
          name: user.name,
          proofsSubmitted,
          daysRequired: challenge.daysRequired,
          completed,
          proofDates: proofs.map(p => p.date),
          minimalDoseCount,
          fullProofCount
        };

        participants.push(progress);

        if (completed) {
          winners.push(progress);
          // Award €1 reward
          await this.notion.createChallengeReward(userId, weekStart, 1);
        }
      }

      // Sort participants by proofs submitted (descending)
      participants.sort((a, b) => b.proofsSubmitted - a.proofsSubmitted);
      winners.sort((a, b) => b.proofsSubmitted - a.proofsSubmitted);

      const evaluationResult: ChallengeEvaluationResult = {
        challengeNumber: challenge.id,
        challengeName: challenge.name,
        weekStart,
        weekEnd,
        totalParticipants: participants.length,
        winners,
        participants,
        totalRewardsAwarded: winners.length,
        evaluatedAt: new Date().toISOString()
      };

      // Send results to channel
      await this.sendEvaluationResults(evaluationResult);

      // Update state
      this.stateManager.setLastEvaluationDate(new Date().toISOString());

      console.log(`[ChallengeScheduler] Evaluation complete: ${winners.length} winners out of ${participants.length} participants`);
    } catch (error) {
      console.error('[ChallengeScheduler] Error in weekly evaluation:', error);
    }
  }

  /**
   * Sunday 3 PM - Deploy new challenge for the week (uses poll results from Saturday)
   */
  private async deployNewChallenge(): Promise<void> {
    try {
      console.log('[ChallengeScheduler] Deploying new challenge...');

      // Calculate week dates (today = Sunday to next Sunday)
      const today = new Date();
      const weekStart = this.formatDate(today);
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + 7);
      const weekEnd = this.formatDate(nextSunday);

      // Get challenge from poll results or fallback to sequential
      let nextIndex: number;

      // Check if there's a poll from Saturday to read results from
      const pollMessageId = this.stateManager.getPollMessageId();
      if (pollMessageId) {
        const channel = await this.client.channels.fetch(this.weeklyChannelId) as TextChannel;
        if (channel) {
          try {
            const pollMessage = await channel.messages.fetch(pollMessageId);
            
            // IMPORTANT: Explicitly fetch reactions to ensure they're loaded
            // Discord.js doesn't always populate reactions.cache when fetching messages
            const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
            const voteCounts: number[] = [];
            const botId = this.client.user?.id;

            console.log('[ChallengeScheduler] Fetching poll reactions...');
            
            for (let i = 0; i < emojiNumbers.length; i++) {
              const emoji = emojiNumbers[i];
              let reaction = pollMessage.reactions.cache.get(emoji);
              
              // If reaction not in cache, try to resolve it
              if (!reaction) {
                reaction = pollMessage.reactions.resolve(emoji) || undefined;
              }
              
              if (reaction) {
                // Fetch users to ensure accurate count
                // This ensures we have the most up-to-date reaction data
                try {
                  const users = await reaction.users.fetch();
                  const userIds = Array.from(users.keys());
                  
                  // Filter out bot's own reaction
                  const userVotes = botId ? userIds.filter(id => id !== botId) : userIds;
                  const count = userVotes.length;
                  voteCounts.push(count);
                  
                  console.log(`[ChallengeScheduler] ${emoji} Option ${i + 1}: ${count} votes (${users.size} total reactions, bot excluded)`);
                } catch (fetchError) {
                  // Fallback to count if fetch fails
                  console.warn(`[ChallengeScheduler] Could not fetch users for ${emoji}, using count:`, fetchError);
                  const count = reaction.count - (reaction.me ? 1 : 0);
                  voteCounts.push(Math.max(0, count));
                }
              } else {
                voteCounts.push(0);
                console.log(`[ChallengeScheduler] ${emoji} Option ${i + 1}: No reactions`);
              }
            }

            // Find winner (most votes)
            const maxVotes = Math.max(...voteCounts);
            const winnerIndex = voteCounts.indexOf(maxVotes);

            // Calculate actual challenge index based on poll group
            // Poll was sent on Saturday using group N, then rotated to N+1
            // So we need to get the previous group: (current - 1 + 4) % 4
            const pollGroup = (this.stateManager.getPollChallengeGroup() - 1 + 4) % 4;
            nextIndex = pollGroup * 5 + winnerIndex;

            console.log(`[ChallengeScheduler] Poll results: ${voteCounts.join(', ')} votes`);
            console.log(`[ChallengeScheduler] Winner: Option ${winnerIndex + 1} with ${maxVotes} votes (Challenge index ${nextIndex}, Group ${pollGroup})`);
          } catch (error) {
            console.error('[ChallengeScheduler] Error reading poll results:', error);
            // Fallback to sequential
            const currentIndex = this.stateManager.getCurrentChallengeIndex();
            nextIndex = this.challengeManager.getNextChallengeIndex(currentIndex);
          }
        } else {
          // Fallback to sequential
          const currentIndex = this.stateManager.getCurrentChallengeIndex();
          nextIndex = this.challengeManager.getNextChallengeIndex(currentIndex);
        }
      } else {
        // No poll, fallback to sequential rotation
        const currentIndex = this.stateManager.getCurrentChallengeIndex();
        nextIndex = this.challengeManager.getNextChallengeIndex(currentIndex);
        console.log(`[ChallengeScheduler] No poll result, using sequential index: ${nextIndex}`);
      }

      const challenge = this.challengeManager.getChallengeByIndex(nextIndex);

      if (!challenge) {
        console.error('[ChallengeScheduler] Challenge not found for index:', nextIndex);
        return;
      }

      // Update state for new week
      this.stateManager.startNewWeek(weekStart, weekEnd, nextIndex);

      // Create Discord embed
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🏆 Weekly Challenge #${challenge.id}: ${challenge.name}`)
        .setDescription(challenge.description)
        .addFields(
          { name: '📋 Daily Requirement', value: challenge.dailyRequirement, inline: false },
          { name: '⚡ Minimal Dose', value: challenge.minimalDose, inline: false },
          { name: '🎯 Days Required', value: `${challenge.daysRequired} days`, inline: true },
          { name: '🏅 Category', value: challenge.category, inline: true },
          { name: '💡 Source', value: challenge.source, inline: false },
          { name: '🔗 Learn More', value: `[Click here](${challenge.link})`, inline: false },
          { name: '📅 Challenge Period', value: `${weekStart} → ${weekEnd}`, inline: false },
          { name: '💰 Reward', value: '€1 credit for completing the challenge!', inline: false }
        )
        .setFooter({ text: 'Click "Join Challenge" to participate! Submit proofs in this channel.' })
        .setTimestamp();

      // Create Join button
      const button = new ButtonBuilder()
        .setCustomId('join_challenge')
        .setLabel('Join Challenge')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      // Send to channel
      const channel = await this.client.channels.fetch(this.weeklyChannelId) as TextChannel;
      const message = await channel.send({
        embeds: [embed],
        components: [row]
      });

      // Store message ID in state
      this.stateManager.setChallengeMessageId(message.id);

      console.log(`[ChallengeScheduler] Challenge deployed: #${challenge.id} - ${challenge.name}`);
    } catch (error) {
      console.error('[ChallengeScheduler] Error deploying new challenge:', error);
    }
  }

  /**
   * Saturday 3 PM - Send poll for next week's challenge selection
   */
  private async sendChallengePoll(): Promise<void> {
    try {
      console.log('[ChallengeScheduler] Sending challenge poll...');

      const channel = await this.client.channels.fetch(this.weeklyChannelId) as TextChannel;
      if (!channel) {
        console.error('[ChallengeScheduler] Weekly challenges channel not found');
        return;
      }

      // Get current group (0-3) and rotate to next
      const currentGroup = this.stateManager.getPollChallengeGroup();
      const startIndex = currentGroup * 5;
      const endIndex = startIndex + 5;

      // Get 5 challenges for this group
      const challenges = [];
      for (let i = startIndex; i < endIndex && i < 20; i++) {
        const challenge = this.challengeManager.getChallengeByIndex(i);
        if (challenge) {
          challenges.push(challenge);
        }
      }

      if (challenges.length === 0) {
        console.error('[ChallengeScheduler] No challenges found for poll');
        return;
      }

      // Create poll embed
      const pollEmbed = new EmbedBuilder()
        .setColor('#00D4FF')
        .setTitle('🗳️ Vote for Next Week\'s Challenge!')
        .setDescription(
          `**Choose which challenge you want to tackle next week!**\n\n` +
          `The challenge with the most votes will start on **Sunday at 3 PM**.\n\n` +
          `📊 **Options (Group ${currentGroup + 1}/4):**\n\n` +
          challenges.map((ch, idx) =>
            `**${idx + 1}. ${ch.name}** (${ch.category})\n` +
            `   └ ${ch.dailyRequirement}\n` +
            `   └ Minimal: ${ch.minimalDose}`
          ).join('\n\n')
        )
        .setFooter({ text: 'Poll closes Sunday at 3 PM when the challenge deploys' })
        .setTimestamp();

      // Send message (Discord will allow users to react, we'll fetch results on Sunday)
      const pollMessage = await channel.send({
        embeds: [pollEmbed],
        content: '**@everyone** Time to vote for next week\'s challenge! 🗳️'
      });

      // Add reaction emojis 1️⃣ through 5️⃣
      const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
      for (let i = 0; i < challenges.length; i++) {
        await pollMessage.react(emojiNumbers[i]);
      }

      // Store poll message ID and rotate group for next time
      this.stateManager.setPollMessageId(pollMessage.id);
      this.stateManager.rotatePollChallengeGroup();

      console.log(`[ChallengeScheduler] Poll sent with ${challenges.length} options (Group ${currentGroup + 1})`);
    } catch (error) {
      console.error('[ChallengeScheduler] Error sending challenge poll:', error);
    }
  }

  /**
   * Wednesday 12 PM - Send mid-week reminder with progress
   */
  private async sendMidWeekReminder(): Promise<void> {
    try {
      console.log('[ChallengeScheduler] Sending mid-week reminder...');

      const { weekStart } = this.stateManager.getCurrentWeek();
      const currentIndex = this.stateManager.getCurrentChallengeIndex();
      const challenge = this.challengeManager.getChallengeByIndex(currentIndex);

      if (!challenge || !weekStart) {
        console.log('[ChallengeScheduler] No active challenge for reminder');
        return;
      }

      // Get current proofs
      const allProofs = await this.notion.getChallengeProofsByWeek(weekStart, challenge.id);

      // Group by user
      const userProofsMap = new Map<string, typeof allProofs>();
      allProofs.forEach(proof => {
        if (!userProofsMap.has(proof.userId)) {
          userProofsMap.set(proof.userId, []);
        }
        userProofsMap.get(proof.userId)!.push(proof);
      });

      // Calculate progress stats
      const participantCount = userProofsMap.size;
      let totalProofs = 0;
      let onTrackCount = 0;

      // Wednesday is day 3-4 of the challenge
      const today = new Date();
      const start = new Date(weekStart);
      const daysElapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      for (const [userId, proofs] of userProofsMap.entries()) {
        totalProofs += proofs.length;
        // On track = has at least as many proofs as days elapsed
        if (proofs.length >= daysElapsed) {
          onTrackCount++;
        }
      }

      const avgProofs = participantCount > 0 ? (totalProofs / participantCount).toFixed(1) : 0;

      // Create reminder embed
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`⏰ Mid-Week Reminder: ${challenge.name}`)
        .setDescription(`You're halfway through this week's challenge! Keep up the momentum!`)
        .addFields(
          { name: '👥 Participants', value: `${participantCount} people joined`, inline: true },
          { name: '📊 Total Proofs', value: `${totalProofs} submitted`, inline: true },
          { name: '📈 Average', value: `${avgProofs} proofs per person`, inline: true },
          { name: '🎯 On Track', value: `${onTrackCount}/${participantCount} participants`, inline: true },
          { name: '📅 Days Remaining', value: `${7 - daysElapsed} days left`, inline: true },
          { name: '🏁 Goal', value: `${challenge.daysRequired} days needed`, inline: true }
        )
        .setFooter({ text: 'Submit your proof today to stay on track!' })
        .setTimestamp();

      const channel = await this.client.channels.fetch(this.weeklyChannelId) as TextChannel;
      await channel.send({ embeds: [embed] });

      console.log('[ChallengeScheduler] Mid-week reminder sent');
    } catch (error) {
      console.error('[ChallengeScheduler] Error sending mid-week reminder:', error);
    }
  }

  /**
   * Send evaluation results to channel
   */
  private async sendEvaluationResults(result: ChallengeEvaluationResult): Promise<void> {
    try {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`📊 Challenge Results: ${result.challengeName}`)
        .setDescription(`Week ${result.weekStart} → ${result.weekEnd}`)
        .addFields(
          { name: '👥 Total Participants', value: `${result.totalParticipants}`, inline: true },
          { name: '🏆 Winners', value: `${result.winners.length}`, inline: true },
          { name: '💰 Total Rewards', value: `€${result.totalRewardsAwarded}`, inline: true }
        );

      // Add winners section
      if (result.winners.length > 0) {
        const winnersList = result.winners
          .map((w, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            return `${medal} <@${w.discordId}> - ${w.proofsSubmitted}/${w.daysRequired} days (${w.fullProofCount} full, ${w.minimalDoseCount} minimal)`;
          })
          .join('\n');

        embed.addFields({ name: '🎉 Challenge Completers', value: winnersList, inline: false });
      }

      // Add participation stats
      if (result.participants.length > 0) {
        const participantsList = result.participants
          .slice(0, 10) // Top 10
          .map((p, index) => {
            const status = p.completed ? '✅' : '❌';
            return `${status} <@${p.discordId}> - ${p.proofsSubmitted}/${p.daysRequired} days`;
          })
          .join('\n');

        embed.addFields({
          name: '📈 All Participants',
          value: participantsList + (result.participants.length > 10 ? `\n...and ${result.participants.length - 10} more` : ''),
          inline: false
        });
      }

      embed.setFooter({ text: 'New challenge coming at 3 PM today!' })
        .setTimestamp();

      const channel = await this.client.channels.fetch(this.weeklyChannelId) as TextChannel;
      await channel.send({ embeds: [embed] });

      console.log('[ChallengeScheduler] Evaluation results sent to channel');
    } catch (error) {
      console.error('[ChallengeScheduler] Error sending evaluation results:', error);
    }
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
   * Manual trigger for testing (deploy challenge immediately)
   */
  async manualDeployChallenge(): Promise<void> {
    console.log('[ChallengeScheduler] Manual challenge deployment triggered');
    await this.deployNewChallenge();
  }

  /**
   * Manual trigger for testing (run evaluation immediately)
   */
  async manualRunEvaluation(): Promise<void> {
    console.log('[ChallengeScheduler] Manual evaluation triggered');
    await this.runWeeklyEvaluation();
  }
}
