import { HabitFlowManager } from '../src/bot/habit-flow';
import { NotionClient } from '../src/notion/client';
import { Habit } from '../src/types';
import { Message } from 'discord.js';

describe('HabitFlowManager', () => {
  const buildMessage = (content: string, channelSend: jest.Mock): Message => {
    const channel = {
      isTextBased: () => true,
      send: channelSend,
      name: 'personal-testuser' // Personal channel name
    };

    return {
      author: { id: 'discord-user-1', bot: false },
      channelId: 'personal-channel',
      content,
      channel
    } as unknown as Message;
  };

  const createNotionMock = () => {
    return {
      getUserByDiscordId: jest.fn().mockResolvedValue({
        id: 'notion-user-1',
        discordId: 'discord-user-1',
        name: 'Test User',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0
      }),
      createHabit: jest.fn().mockResolvedValue({} as Habit)
    } as unknown as NotionClient;
  };

  it('starts the flow and asks the first question', async () => {
    const channelSend = jest.fn().mockResolvedValue(undefined);
    const notionMock = createNotionMock();
    const manager = new HabitFlowManager(notionMock);

    const handled = await manager.handleMessage(buildMessage('KeystoneHabit', channelSend));

    expect(handled).toBe(true);
    expect(channelSend).toHaveBeenCalledTimes(2);
    expect(channelSend.mock.calls[0][0]).toContain('Keystone Habit Builder');
    expect(channelSend.mock.calls[1][0]).toContain('What do you want to call this habit');
  });

  it('collects answers, saves the habit, and thanks the user', async () => {
    const channelSend = jest.fn().mockResolvedValue(undefined);
    const notionMock = createNotionMock();
    const manager = new HabitFlowManager(notionMock);

    await manager.handleMessage(buildMessage('KeystoneHabit', channelSend));
    channelSend.mockClear();

    const answers = [
      'Morning Meditation',
      'Mindset, Health',
      'Daily',
      'Right after waking up in the living room',
      'Medium',
      'Meditate for 10 minutes every morning for the next 66 days',
      'I want to start my day grounded and focused',
      'Sit for 2 minutes and breathe deeply',
      'Alarm → sit on cushion → feel calmer and focused',
      'If I snooze the alarm, I will play the morning playlist and sit up',
      'Feeling tired when I wake up',
      'Calendar reminder at 7:00 and accountability ping'
    ];

    for (const answer of answers) {
      await manager.handleMessage(buildMessage(answer, channelSend));
    }

    expect(notionMock.createHabit).toHaveBeenCalledTimes(1);
    expect(channelSend).toHaveBeenCalledWith(expect.stringContaining('Thanks for integrating your keystone habit'));

    const expectedPayload = {
      userId: 'notion-user-1',
      name: 'Morning Meditation',
      domains: ['Mindset', 'Health'],
      frequency: 1,
      context: 'Right after waking up in the living room',
      difficulty: 'Medium',
      smartGoal: 'Meditate for 10 minutes every morning for the next 66 days',
      why: 'I want to start my day grounded and focused',
      minimalDose: 'Sit for 2 minutes and breathe deeply',
      habitLoop: 'Alarm → sit on cushion → feel calmer and focused',
      implementationIntentions: 'If I snooze the alarm, I will play the morning playlist and sit up',
      hurdles: 'Feeling tired when I wake up',
      reminderType: 'Calendar reminder at 7:00 and accountability ping'
    };

    expect(notionMock.createHabit).toHaveBeenCalledWith(expectedPayload);
  });
});
