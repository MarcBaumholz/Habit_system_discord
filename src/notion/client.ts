import { Client } from '@notionhq/client';
import { User, Habit, Proof, Learning, Week, Group } from '../types';

export class NotionClient {
  private client: Client;
  private databases: {
    users: string;
    habits: string;
    proofs: string;
    learnings: string;
    weeks: string;
    groups: string;
  };

  constructor(notionToken: string, databaseIds: Record<string, string>) {
    this.client = new Client({ auth: notionToken });
    this.databases = databaseIds as any;
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const response = await this.client.pages.create({
      parent: { database_id: this.databases.users },
      properties: {
        'Discord ID ': { title: [{ text: { content: user.discordId } }] },
        'Name': { rich_text: [{ text: { content: user.name } }] },
        'Timezone': { rich_text: [{ text: { content: user.timezone } }] },
        'Best Time': { rich_text: [{ text: { content: user.bestTime } }] },
        'Trust Count': { number: user.trustCount }
      }
    });

    return {
      id: response.id,
      ...user
    };
  }

  async createHabit(habit: Omit<Habit, 'id'>): Promise<Habit> {
    const response = await this.client.pages.create({
      parent: { database_id: this.databases.habits },
      properties: {
        'Name': { title: [{ text: { content: habit.name } }] },
        'User': { relation: [{ id: habit.userId }] },
        'Domains': { multi_select: habit.domains.map(domain => ({ name: domain })) },
        'Frequency': { rich_text: [{ text: { content: habit.frequency } }] },
        'Context': { rich_text: [{ text: { content: habit.context } }] },
        'Difficulty': { rich_text: [{ text: { content: habit.difficulty } }] },
        'SMART Goal ': { rich_text: [{ text: { content: habit.smartGoal } }] },
        'Why': { rich_text: [{ text: { content: habit.why } }] },
        'Minimal Dose': { rich_text: [{ text: { content: habit.minimalDose } }] },
        'Habit Loop': { rich_text: [{ text: { content: habit.habitLoop } }] },
        'Implementation Intentions': { rich_text: [{ text: { content: habit.implementationIntentions } }] },
        'Hurdles': { rich_text: [{ text: { content: habit.hurdles } }] },
        'Reminder Type': { rich_text: [{ text: { content: habit.reminderType } }] }
      }
    });

    return {
      id: response.id,
      ...habit
    };
  }

  async createProof(proof: Omit<Proof, 'id'>): Promise<Proof> {
    const response = await this.client.pages.create({
      parent: { database_id: this.databases.proofs },
      properties: {
        'User': { relation: [{ id: proof.userId }] },
        'Habit': { relation: [{ id: proof.habitId }] },
        'Date': { date: { start: proof.date } },
        'Unit': { rich_text: [{ text: { content: proof.unit } }] },
        'Note': { rich_text: proof.note ? [{ text: { content: proof.note } }] : [] },
        'Attachment URL': { url: proof.attachmentUrl || '' },
        'Is Minimal Dose ': { checkbox: proof.isMinimalDose },
        'Is Cheat Day': { checkbox: proof.isCheatDay }
      }
    });

    return {
      id: response.id,
      ...proof
    };
  }

  async createLearning(learning: Omit<Learning, 'id'>): Promise<Learning> {
    const response = await this.client.pages.create({
      parent: { database_id: this.databases.learnings },
      properties: {
        'User': { relation: [{ id: learning.userId }] },
        'Habit': { relation: [{ id: learning.habitId }] },
        'Text': { rich_text: [{ text: { content: learning.text } }] },
        'Created At': { date: { start: learning.createdAt } }
      }
    });

    return {
      id: response.id,
      ...learning
    };
  }

  async getUserByDiscordId(discordId: string): Promise<User | null> {
    const response = await this.client.databases.query({
      database_id: this.databases.users,
      filter: {
        property: 'Discord ID ',
        title: { equals: discordId }
      }
    });

    if (response.results.length === 0) return null;

    const page = response.results[0] as any;
    return {
      id: page.id,
      discordId: page.properties['Discord ID '].title[0].text.content,
      name: page.properties['Name'].rich_text[0].text.content,
      timezone: page.properties['Timezone'].rich_text[0].text.content,
      bestTime: page.properties['Best Time'].rich_text[0].text.content,
      trustCount: page.properties['Trust Count'].number
    };
  }
}