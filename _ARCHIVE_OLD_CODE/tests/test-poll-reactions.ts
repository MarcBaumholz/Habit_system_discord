import dotenv from 'dotenv';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

// Load environment variables
dotenv.config();

async function testPollReactions() {
  const messageId = '1441790325159891164';
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

    console.log(`\n📨 Fetching message ${messageId} from channel ${weeklyChannelId}...`);
    
    const channel = await client.channels.fetch(weeklyChannelId) as TextChannel;
    if (!channel) {
      console.error('❌ Channel not found');
      await client.destroy();
      process.exit(1);
    }

    // Fetch the message
    const pollMessage = await channel.messages.fetch(messageId);
    console.log('✅ Message fetched');
    console.log(`📝 Message content preview: ${pollMessage.content.substring(0, 100)}...`);

    // IMPORTANT: Fetch all reactions explicitly
    // The cache might not be populated, so we need to fetch them
    console.log('\n🔄 Fetching reactions...');
    
    // Get all reactions from cache first
    const reactionsCache = pollMessage.reactions.cache;
    console.log(`📊 Reactions in cache: ${reactionsCache.size}`);
    
    // Fetch each reaction to ensure we have full data
    const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    const voteCounts: number[] = [];
    const reactionDetails: Array<{ emoji: string; count: number; users: string[] }> = [];

    for (let i = 0; i < emojiNumbers.length; i++) {
      const emoji = emojiNumbers[i];
      let reaction = reactionsCache.get(emoji);
      
      // If reaction not in cache, try to fetch it
      if (!reaction) {
        console.log(`⚠️  Reaction ${emoji} not in cache, attempting to fetch...`);
        try {
          // Fetch users for this reaction
          const fetchedReaction = await pollMessage.reactions.resolve(emoji);
          if (fetchedReaction) {
            reaction = fetchedReaction;
            // Fetch all users who reacted
            const users = await fetchedReaction.users.fetch();
            console.log(`✅ Fetched ${emoji}: ${users.size} users`);
          }
        } catch (error) {
          console.log(`❌ Could not fetch reaction ${emoji}:`, error);
        }
      } else {
        // Reaction exists in cache, but we should still fetch users to ensure accuracy
        try {
          const users = await reaction.users.fetch();
          console.log(`✅ Reaction ${emoji} has ${users.size} users (including bot)`);
        } catch (error) {
          console.log(`⚠️  Could not fetch users for ${emoji}:`, error);
        }
      }

      if (reaction) {
        // Get all users who reacted
        const users = await reaction.users.fetch();
        const userIds = Array.from(users.keys());
        
        // Filter out bot's own reaction
        const botId = client.user?.id;
        const userVotes = botId ? userIds.filter(id => id !== botId) : userIds;
        
        const count = userVotes.length;
        voteCounts.push(count);
        
        reactionDetails.push({
          emoji,
          count,
          users: userVotes
        });

        console.log(`\n${emoji} Option ${i + 1}:`);
        console.log(`   Total reactions: ${users.size}`);
        console.log(`   Bot reaction: ${botId && userIds.includes(botId) ? 'Yes' : 'No'}`);
        console.log(`   User votes: ${count}`);
        if (userVotes.length > 0) {
          console.log(`   Voters: ${userVotes.map(id => `<@${id}>`).join(', ')}`);
        }
      } else {
        voteCounts.push(0);
        reactionDetails.push({
          emoji,
          count: 0,
          users: []
        });
        console.log(`\n${emoji} Option ${i + 1}: No reactions`);
      }
    }

    // Find winner
    const maxVotes = Math.max(...voteCounts);
    const winnerIndices = voteCounts
      .map((count, index) => count === maxVotes ? index : -1)
      .filter(index => index !== -1);

    console.log('\n' + '='.repeat(60));
    console.log('📊 VOTE SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nVote counts: ${voteCounts.join(', ')}`);
    console.log(`Maximum votes: ${maxVotes}`);
    
    if (winnerIndices.length === 1) {
      console.log(`\n🏆 WINNER: Option ${winnerIndices[0] + 1} (${emojiNumbers[winnerIndices[0]]}) with ${maxVotes} votes`);
    } else if (winnerIndices.length > 1) {
      console.log(`\n⚠️  TIE: Multiple options have ${maxVotes} votes:`);
      winnerIndices.forEach(idx => {
        console.log(`   - Option ${idx + 1} (${emojiNumbers[idx]})`);
      });
      console.log(`\n📌 First option in tie will be selected: Option ${winnerIndices[0] + 1}`);
    } else {
      console.log(`\n❌ No votes found!`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 DETAILED REACTION DATA');
    console.log('='.repeat(60));
    reactionDetails.forEach((detail, index) => {
      console.log(`\nOption ${index + 1} (${detail.emoji}):`);
      console.log(`  Votes: ${detail.count}`);
      console.log(`  Voters: ${detail.users.length > 0 ? detail.users.map(id => `<@${id}>`).join(', ') : 'None'}`);
    });

    // Test the actual logic from challenge-scheduler
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING ACTUAL IMPLEMENTATION LOGIC');
    console.log('='.repeat(60));
    
    // Simulate what challenge-scheduler does
    const testVoteCounts: number[] = [];
    const testReactions = pollMessage.reactions.cache;
    
    for (let i = 0; i < emojiNumbers.length; i++) {
      const reaction = testReactions.get(emojiNumbers[i]);
      const count = reaction ? reaction.count - 1 : 0;
      testVoteCounts.push(count);
    }
    
    console.log(`\nUsing reactions.cache directly (current implementation):`);
    console.log(`Vote counts: ${testVoteCounts.join(', ')}`);
    
    const testMaxVotes = Math.max(...testVoteCounts);
    const testWinnerIndex = testVoteCounts.indexOf(testMaxVotes);
    
    console.log(`Winner: Option ${testWinnerIndex + 1} with ${testMaxVotes} votes`);
    
    if (JSON.stringify(voteCounts) !== JSON.stringify(testVoteCounts)) {
      console.log(`\n⚠️  MISMATCH DETECTED!`);
      console.log(`   Proper fetch: ${voteCounts.join(', ')}`);
      console.log(`   Cache only:   ${testVoteCounts.join(', ')}`);
      console.log(`\n❌ The current implementation is NOT fetching reactions properly!`);
    } else {
      console.log(`\n✅ Vote counts match - implementation should work correctly`);
    }

    // Test group calculation
    console.log('\n' + '='.repeat(60));
    console.log('🧮 TESTING GROUP CALCULATION');
    console.log('='.repeat(60));
    
    // The poll shows Group 3/4, which means pollChallengeGroup = 2 (0-indexed)
    // After poll is sent, it rotates to 3
    // When deploying, it calculates: (current - 1 + 4) % 4
    console.log('\nAssuming poll was sent with Group 3 (index 2):');
    console.log('After poll sent, group rotates to: 3 (index 2 -> 3)');
    console.log('When deploying, calculation: (3 - 1 + 4) % 4 = 6 % 4 = 2');
    
    const testGroups = [0, 1, 2, 3];
    testGroups.forEach(currentGroup => {
      const calculatedGroup = (currentGroup - 1 + 4) % 4;
      const startIndex = calculatedGroup * 5;
      const endIndex = startIndex + 5;
      console.log(`\nIf current group is ${currentGroup}:`);
      console.log(`  Calculated group: ${calculatedGroup}`);
      console.log(`  Challenge range: ${startIndex + 1}-${endIndex} (indices ${startIndex}-${endIndex - 1})`);
      
      if (winnerIndices.length > 0) {
        const winnerIdx = winnerIndices[0];
        const challengeIndex = calculatedGroup * 5 + winnerIdx;
        console.log(`  If Option ${winnerIdx + 1} wins: Challenge index ${challengeIndex} (Challenge #${challengeIndex + 1})`);
      }
    });

    await client.destroy();
    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('❌ Error:', error);
    await client.destroy();
    process.exit(1);
  }
}

testPollReactions().catch(console.error);

