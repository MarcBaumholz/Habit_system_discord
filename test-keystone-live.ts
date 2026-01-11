import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

async function testKeystoneHabit() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  await new Promise<void>((resolve) => {
    client.once('ready', () => {
      console.log(`✅ Connected as ${client.user?.tag}`);
      resolve();
    });

    client.login(process.env.DISCORD_BOT_TOKEN);
  });

  const channelId = process.env.DISCORD_PERSONAL_CHANNEL!;
  const channel = await client.channels.fetch(channelId) as TextChannel;

  if (!channel) {
    console.error('❌ Could not find channel');
    return;
  }

  console.log(`📤 Sending "keystone habit" to channel: ${channel.name}`);
  const message = await channel.send('keystone habit');

  console.log('✅ Message sent. Waiting for bot response...');

  // Wait 5 seconds to see the bot's response
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Fetch recent messages
  const messages = await channel.messages.fetch({ limit: 10 });
  const botResponse = messages.find(m =>
    m.author.id === process.env.DISCORD_CLIENT_ID &&
    m.createdTimestamp > message.createdTimestamp
  );

  if (botResponse) {
    console.log('\n✅ Bot responded:');
    console.log('Content:', botResponse.content);
    console.log('Components:', botResponse.components.length);

    if (botResponse.components.length > 0) {
      console.log('\n✅ Button found! Now testing button click...');

      // Find the button
      const button = botResponse.components[0]?.components[0];
      if (button) {
        console.log('Button custom ID:', (button as any).customId);
        console.log('Button label:', (button as any).label);

        console.log('\n⚠️  Please click the button in Discord to test the interaction.');
        console.log('Watching Docker logs for errors...');

        // Wait for user to click
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  } else {
    console.log('❌ Bot did not respond');
  }

  // Cleanup
  try {
    await message.delete();
  } catch (e) {
    console.log('Could not delete test message');
  }

  await client.destroy();
  console.log('\n✅ Test complete. Check Docker logs for any errors.');
}

testKeystoneHabit().catch(console.error);
