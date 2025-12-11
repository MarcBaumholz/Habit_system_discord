import dotenv from 'dotenv';
import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ChallengeManager } from './src/bot/challenge-manager.js';

// Load environment variables
dotenv.config();

async function testChallengeFlow() {
  const weeklyChannelId = process.env.DISCORD_WEEKLY_CHALLENGES;

  if (!weeklyChannelId) {
    console.error('❌ DISCORD_WEEKLY_CHALLENGES not set in .env');
    process.exit(1);
  }

  if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('❌ DISCORD_BOT_TOKEN not set in .env');
    process.exit(1);
  }

  // Create Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  try {
    console.log('🔌 Connecting to Discord...');
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('✅ Connected to Discord');

    // Wait for client to be ready
    await new Promise(resolve => client.once('ready', resolve));

    const channel = await client.channels.fetch(weeklyChannelId) as TextChannel;
    if (!channel) {
      console.error('❌ Channel not found');
      await client.destroy();
      process.exit(1);
    }

    const challengeManager = new ChallengeManager();

    // Use Group 3 (challenges 11-15, indices 10-14)
    const pollGroup = 2; // Group 3 is index 2 (0-indexed)
    const startIndex = pollGroup * 5; // 10
    const endIndex = startIndex + 5; // 15

    console.log(`\n📊 Creating poll for Group ${pollGroup + 1}/4 (challenges ${startIndex + 1}-${endIndex})...`);

    // Get 5 challenges for this group
    const challenges = [];
    for (let i = startIndex; i < endIndex && i < 20; i++) {
      const challenge = challengeManager.getChallengeByIndex(i);
      if (challenge) {
        challenges.push(challenge);
      }
    }

    if (challenges.length === 0) {
      console.error('❌ No challenges found for poll');
      await client.destroy();
      process.exit(1);
    }

    // Create poll embed
    const pollEmbed = new EmbedBuilder()
      .setColor('#00D4FF')
      .setTitle('🗳️ Vote for Next Week\'s Challenge!')
      .setDescription(
        `**Choose which challenge you want to tackle next week!**\n\n` +
        `The challenge with the most votes will start on **Sunday at 3 PM**.\n\n` +
        `📊 **Options (Group ${pollGroup + 1}/4):**\n\n` +
        challenges.map((ch, idx) =>
          `**${idx + 1}. ${ch.name}** (${ch.category})\n` +
          `   └ ${ch.dailyRequirement}\n` +
          `   └ Minimal: ${ch.minimalDose}`
        ).join('\n\n')
      )
      .setFooter({ text: 'Poll closes in 30 seconds - TEST MODE' })
      .setTimestamp();

    // Send poll message
    console.log('📨 Sending poll message...');
    const pollMessage = await channel.send({
      embeds: [pollEmbed],
      content: '**@everyone** Time to vote for next week\'s challenge! 🗳️ **TEST MODE - Vote now!**'
    });

    // Add reaction emojis 1️⃣ through 5️⃣
    const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    console.log('➕ Adding reaction emojis...');
    for (let i = 0; i < challenges.length; i++) {
      await pollMessage.react(emojiNumbers[i]);
      console.log(`   ✅ Added ${emojiNumbers[i]}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('⏳ WAITING 30 SECONDS FOR VOTES...');
    console.log('='.repeat(60));
    console.log(`📝 Poll message ID: ${pollMessage.id}`);
    console.log(`🔗 Message URL: https://discord.com/channels/${channel.guildId}/${channel.id}/${pollMessage.id}`);
    console.log('\n👆 YOU CAN NOW VOTE! React with 1️⃣, 2️⃣, 3️⃣, 4️⃣, or 5️⃣');
    console.log('⏰ Waiting 30 seconds...\n');

    // Wait 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('✅ 30 seconds elapsed, fetching poll results...\n');

    // Fetch the message again to get updated reactions
    const updatedPollMessage = await channel.messages.fetch(pollMessage.id);
    
    // Count votes using the improved logic
    const voteCounts: number[] = [];
    const botId = client.user?.id;
    const reactionDetails: Array<{ emoji: string; count: number; option: number }> = [];

    console.log('🔍 Fetching reactions...');
    for (let i = 0; i < emojiNumbers.length; i++) {
      const emoji = emojiNumbers[i];
      let reaction = updatedPollMessage.reactions.cache.get(emoji);
      
      if (!reaction) {
        reaction = updatedPollMessage.reactions.resolve(emoji) || undefined;
      }
      
      if (reaction) {
        try {
          const users = await reaction.users.fetch();
          const userIds = Array.from(users.keys());
          
          // Filter out bot's own reaction
          const userVotes = botId ? userIds.filter(id => id !== botId) : userIds;
          const count = userVotes.length;
          voteCounts.push(count);
          
          reactionDetails.push({
            emoji,
            count,
            option: i + 1
          });
          
          console.log(`   ${emoji} Option ${i + 1}: ${count} vote(s)`);
        } catch (fetchError) {
          console.warn(`   ⚠️  Could not fetch users for ${emoji}, using count`);
          const count = reaction.count - (reaction.me ? 1 : 0);
          voteCounts.push(Math.max(0, count));
          reactionDetails.push({
            emoji,
            count: Math.max(0, count),
            option: i + 1
          });
        }
      } else {
        voteCounts.push(0);
        reactionDetails.push({
          emoji,
          count: 0,
          option: i + 1
        });
        console.log(`   ${emoji} Option ${i + 1}: No votes`);
      }
    }

    // Find winner
    const maxVotes = Math.max(...voteCounts);
    const winnerIndex = voteCounts.indexOf(maxVotes);

    console.log('\n' + '='.repeat(60));
    console.log('📊 VOTE RESULTS');
    console.log('='.repeat(60));
    console.log(`Vote counts: ${voteCounts.join(', ')}`);
    console.log(`Maximum votes: ${maxVotes}`);
    
    if (maxVotes === 0) {
      console.log('\n⚠️  No votes received! Using first option as default.');
    } else {
      console.log(`\n🏆 WINNER: Option ${winnerIndex + 1} (${emojiNumbers[winnerIndex]}) with ${maxVotes} vote(s)`);
    }

    // Calculate challenge index
    // Since we used group 2 (pollGroup = 2), the challenge index is:
    const challengeIndex = pollGroup * 5 + winnerIndex;
    const challenge = challengeManager.getChallengeByIndex(challengeIndex);

    if (!challenge) {
      console.error(`❌ Challenge not found for index ${challengeIndex}`);
      await client.destroy();
      process.exit(1);
    }

    console.log(`\n📌 Selected Challenge: #${challenge.id} - ${challenge.name}`);
    console.log(`   Index: ${challengeIndex} (Group ${pollGroup + 1}, Option ${winnerIndex + 1})`);

    // Calculate week dates (today to next week)
    const today = new Date();
    const weekStart = formatDate(today);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const weekEnd = formatDate(nextWeek);

    // Create challenge deployment embed
    console.log('\n📨 Deploying challenge message...');
    const challengeEmbed = new EmbedBuilder()
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
      .setFooter({ text: 'Click "Join Challenge" to participate! Submit proofs in this channel. • TEST MODE' })
      .setTimestamp();

    // Create Join button
    const button = new ButtonBuilder()
      .setCustomId('join_challenge')
      .setLabel('Join Challenge')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Send challenge message
    const challengeMessage = await channel.send({
      embeds: [challengeEmbed],
      components: [row]
    });

    console.log('✅ Challenge deployed successfully!');
    console.log(`📝 Challenge message ID: ${challengeMessage.id}`);
    console.log(`🔗 Message URL: https://discord.com/channels/${channel.guildId}/${channel.id}/${challengeMessage.id}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Poll Group: ${pollGroup + 1}/4`);
    console.log(`   Votes: ${voteCounts.join(', ')}`);
    console.log(`   Winner: Option ${winnerIndex + 1} (${challenge.name})`);
    console.log(`   Challenge Index: ${challengeIndex}`);
    console.log(`   Challenge ID: #${challenge.id}`);

    await client.destroy();
    console.log('\n✅ Test complete, client disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
    await client.destroy();
    process.exit(1);
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

testChallengeFlow().catch(console.error);

