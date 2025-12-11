# Discord.js Standards

## Bot Initialization

- Use GatewayIntentBits explicitly
- Enable only necessary intents
- Handle ready event properly
- Set up error handlers

```typescript
// ✅ Good
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// ❌ Bad
const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] });
```

## Slash Commands

- Use descriptive command names
- Provide clear descriptions
- Validate input parameters
- Handle errors gracefully
- Use deferReply for long-running operations

```typescript
// ✅ Good
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const joinCommand = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join the habit tracking system'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const userId = interaction.user.id;
      const result = await handleJoin(userId);
      
      await interaction.editReply({
        content: `✅ Welcome ${result.userName}! You're now registered.`,
      });
    } catch (error) {
      console.error('Join command error:', error);
      await interaction.editReply({
        content: '❌ Failed to join. Please try again later.',
      });
    }
  },
};

// ❌ Bad
export const joinCommand = {
  data: new SlashCommandBuilder().setName('join'),
  async execute(interaction: ChatInputCommandInteraction) {
    const result = await handleJoin(interaction.user.id);
    await interaction.reply(`Welcome ${result.userName}`);
  },
};
```

## Message Handling

- Check message author to avoid bot loops
- Validate message content
- Handle errors appropriately
- Use appropriate response methods

```typescript
// ✅ Good
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Ignore messages not in accountability channel
  if (message.channel.id !== process.env.DISCORD_ACCOUNTABILITY_GROUP) {
    return;
  }
  
  try {
    await processAccountabilityMessage(message);
  } catch (error) {
    console.error('Failed to process message:', error);
    // Don't reply to user on error - log it
  }
});

// ❌ Bad
client.on('messageCreate', async (message) => {
  await processAccountabilityMessage(message);
});
```

## Channel Management

- Validate channel existence before operations
- Handle permission errors
- Use appropriate channel types
- Cache channel references when possible

```typescript
// ✅ Good
async function createPersonalChannel(guild: Guild, userId: string): Promise<TextChannel> {
  try {
    const channel = await guild.channels.create({
      name: `personal-${userId}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: userId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
      ],
    });
    
    return channel;
  } catch (error) {
    console.error('Failed to create personal channel:', error);
    throw new Error(`Failed to create personal channel: ${error.message}`);
  }
}

// ❌ Bad
async function createPersonalChannel(guild: Guild, userId: string) {
  return await guild.channels.create(`personal-${userId}`);
}
```

## Interactions

- Handle button clicks, select menus, and modals
- Validate interaction data
- Use ephemeral responses when appropriate
- Handle interaction timeouts

```typescript
// ✅ Good
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === 'confirm-habit') {
      await interaction.deferReply({ ephemeral: true });
      try {
        await handleHabitConfirmation(interaction);
        await interaction.editReply({ content: '✅ Habit confirmed!' });
      } catch (error) {
        await interaction.editReply({ content: '❌ Failed to confirm habit.' });
      }
    }
  }
});

// ❌ Bad
client.on('interactionCreate', async (interaction) => {
  await handleHabitConfirmation(interaction);
  await interaction.reply('Done');
});
```

## Error Handling

- Always handle Discord API errors
- Provide user-friendly error messages
- Log errors with context
- Handle rate limits appropriately

```typescript
// ✅ Good
try {
  await message.reply(response);
} catch (error) {
  if (error.code === 50013) {
    console.error('Missing permissions to send message:', error);
    // Try alternative method or log
  } else if (error.code === 50035) {
    console.error('Message too long:', error);
    await message.reply('Response too long. Please check logs.');
  } else {
    console.error('Discord API error:', error);
    throw error;
  }
}

// ❌ Bad
await message.reply(response);
```

## Modals

- Show modals immediately to avoid Discord's 3-second timeout
- **CRITICAL: TextInput labels must be ≤ 45 characters** (Discord API limit)
- Validate user data in modal submit handler, not before showing modal
- Handle "already acknowledged" errors gracefully when showModal() partially succeeds
- Use Promise.race with timeout for optional pre-filling to prevent blocking

```typescript
// ✅ Good - Show modal immediately, validate in submit handler
async handleProfileEdit(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  
  try {
    // Try to load profile data quickly with timeout (optional pre-fill)
    let profile: UserProfile | null = null;
    try {
      const loadProfile = async (): Promise<UserProfile | null> => {
        try {
          return await this.notion.getUserProfileByDiscordId(discordId);
        } catch (error) {
          return null;
        }
      };
      
      const timeout = new Promise<UserProfile | null>((resolve) => {
        setTimeout(() => resolve(null), 2000); // 2 second timeout
      });
      
      profile = await Promise.race([loadProfile(), timeout]);
    } catch (error) {
      profile = null; // Continue with empty modal
    }
    
    // Create modal - labels MUST be ≤ 45 characters
    const modal = new ModalBuilder()
      .setCustomId('profile_edit_modal')
      .setTitle('✏️ Profil bearbeiten / Edit Profile');
    
    const coreValuesInput = new TextInputBuilder()
      .setCustomId('core_values')
      .setLabel('Kernwerte / Core Values') // ✅ 28 chars - OK
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Freiheit, Gesundheit, Familie / Freedom, Health, Family')
      .setRequired(true);
    
    await interaction.showModal(modal);
  } catch (error) {
    // Handle errors gracefully - ignore "already acknowledged" errors
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Error opening edit form. Please try again.',
          ephemeral: true
        });
      }
    } catch (replyError: any) {
      // Ignore "already acknowledged" errors (code 40060)
      if (replyError.code !== 40060) {
        console.error('Error sending error reply:', replyError);
      }
    }
  }
}

// ❌ Bad - Labels too long, validation before modal, no timeout handling
async handleProfileEdit(interaction: ChatInputCommandInteraction) {
  // Validation before modal - causes timeout!
  const user = await this.notion.getUserByDiscordId(interaction.user.id);
  if (!user) {
    await interaction.reply({ content: 'Not registered' });
    return;
  }
  
  const profile = await this.notion.getUserProfileByDiscordId(interaction.user.id);
  
  const modal = new ModalBuilder()
    .setCustomId('profile_edit_modal')
    .setTitle('Edit Profile');
  
  const coreValuesInput = new TextInputBuilder()
    .setCustomId('core_values')
    .setLabel('Kernwerte / Core Values (kommagetrennt / comma-separated)') // ❌ 62 chars - TOO LONG!
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  
  await interaction.showModal(modal);
}
```

### Modal Label Length Limits

**Discord API Limit: 45 characters maximum for TextInput labels**

Common mistakes:
- Including formatting instructions in labels (e.g., "(kommagetrennt / comma-separated)")
- Including both languages with full descriptions
- Adding explanatory text that belongs in placeholder instead

**Solution:** Keep labels short and descriptive. Put detailed instructions in placeholders or descriptions.

