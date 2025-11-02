import { Client } from '@notionhq/client';
import { User, Habit, Proof, Learning, Hurdle, Week, Group, UserProfile, PricePoolEntry } from '../types';

export class NotionClient {
  private client: Client;
  private databases: {
    users: string;
    habits: string;
    proofs: string;
    learnings: string;
    hurdles: string;
    weeks: string;
    groups: string;
    personality: string; // Neue Personality DB
    pricePool: string; // Price Pool DB for financial accountability
  };

  constructor(notionToken: string, databaseIds: Record<string, string>) {
    this.client = new Client({ auth: notionToken });
    this.databases = databaseIds as any;
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      console.log('👤 Creating user in Notion:', {
        discordId: user.discordId,
        name: user.name,
        hasPersonalChannel: !!user.personalChannelId
      });

      const properties: any = {
        // Discord ID should be rich_text field (as per Notion database schema)
        'DiscordID': { rich_text: [{ text: { content: user.discordId } }] },
        // Name should be rich_text field (as per Notion database schema)
        'Name': { rich_text: [{ text: { content: user.name } }] },
        'Timezone': { rich_text: [{ text: { content: user.timezone } }] },
        'Best Time': { rich_text: [{ text: { content: user.bestTime } }] },
        'Trust Count': { number: user.trustCount },
        'Status': { select: { name: user.status || 'active' } }
      };

      // Add personal channel ID if provided
      if (user.personalChannelId) {
        properties['Personal Channel ID'] = { rich_text: [{ text: { content: user.personalChannelId } }] };
      }

      const response = await this.client.pages.create({
        parent: { database_id: this.databases.users },
        properties
      });

      console.log('✅ User created successfully in Notion:', {
        userId: response.id,
        discordId: user.discordId,
        name: user.name
      });

      return {
        id: response.id,
        ...user,
        status: user.status || 'active'
      };
    } catch (error) {
      console.error('❌ Error creating user in Notion:', {
        discordId: user.discordId,
        name: user.name,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        databaseId: this.databases.users
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create user in Notion: ${errorMessage}`);
    }
  }

  async createHabit(habit: Omit<Habit, 'id'>): Promise<Habit> {
    const response = await this.client.pages.create({
      parent: { database_id: this.databases.habits },
      properties: {
        'Name': { title: [{ text: { content: habit.name } }] },
        'User': { relation: [{ id: habit.userId }] },
        'Domains': { multi_select: habit.domains.map(domain => ({ name: domain })) },
        'Frequency': { number: habit.frequency },
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

  async getHabitsByUserId(userId: string): Promise<Habit[]> {
    const response = await this.client.databases.query({
      database_id: this.databases.habits,
      filter: {
        property: 'User',
        relation: { contains: userId }
      }
    });

    return response.results.map(page => {
      const properties = (page as any).properties;

      const getRichText = (key: string) => {
        const value = properties[key]?.rich_text || [];
        return value.length > 0 ? value[0].plain_text || value[0].text?.content || '' : '';
      };

      return {
        id: page.id,
        userId,
        name: properties['Name']?.title?.[0]?.plain_text || properties['Name']?.title?.[0]?.text?.content || 'Untitled Habit',
        domains: (properties['Domains']?.multi_select || []).map((domain: any) => domain.name).filter(Boolean),
        frequency: properties['Frequency']?.number || 1,
        context: getRichText('Context'),
        difficulty: getRichText('Difficulty'),
        smartGoal: getRichText('SMART Goal '),
        why: getRichText('Why'),
        minimalDose: getRichText('Minimal Dose'),
        habitLoop: getRichText('Habit Loop'),
        implementationIntentions: getRichText('Implementation Intentions'),
        hurdles: getRichText('Hurdles'),
        reminderType: getRichText('Reminder Type')
      } as Habit;
    });
  }

  async createProof(proof: Omit<Proof, 'id'>, attachmentUrl?: string): Promise<Proof> {
    try {
      console.log('🔍 Creating proof in Notion with data:', proof);
      
      // Build the properties object
      const properties: any = {
        'Title': { title: [{ text: { content: `Proof - ${proof.date}` } }] },
        'User': { relation: [{ id: proof.userId }] },
        'Habit': { relation: [{ id: proof.habitId }] },
        'Date': { date: { start: proof.date } },
        'Unit': { rich_text: [{ text: { content: proof.unit } }] },
        'Note': { rich_text: proof.note ? [{ text: { content: proof.note } }] : [] },
        'Is Minimal Dose ': { checkbox: proof.isMinimalDose },
        'Is Cheat Day': { checkbox: proof.isCheatDay }
      };

      // Add file attachment if provided
      if (attachmentUrl) {
        properties['Proof'] = {
          files: [
            {
              name: 'Proof Attachment',
              external: {
                url: attachmentUrl
              }
            }
          ]
        };
      }
      
      const response = await this.client.pages.create({
        parent: { database_id: this.databases.proofs },
        properties
      });

      console.log('✅ Proof created successfully in Notion:', response.id);
      return {
        id: response.id,
        ...proof
      };
    } catch (error) {
      console.error('❌ Error creating proof in Notion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create proof: ${message}`);
    }
  }

  async createLearning(learning: Omit<Learning, 'id'>): Promise<Learning> {
    try {
      console.log('🔍 Creating learning in Notion with data:', learning);
      
      const properties: any = {
        'User': { relation: [{ id: learning.userId }] },
        'Text': { rich_text: [{ text: { content: learning.text } }] },
        'Created At': { date: { start: learning.createdAt } }
      };

      // Add Discord ID field (it's the title property in this database)
      if (learning.discordId) {
        properties['DiscordID'] = { title: [{ text: { content: learning.discordId } }] };
      }

      // Add Habit relation if habitId is provided
      if (learning.habitId) {
        properties['Habit'] = { relation: [{ id: learning.habitId }] };
      }
      
      const response = await this.client.pages.create({
        parent: { database_id: this.databases.learnings },
        properties
      });

      console.log('✅ Learning created successfully in Notion:', response.id);
      return {
        id: response.id,
        ...learning
      };
    } catch (error) {
      console.error('❌ Error creating learning in Notion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create learning: ${message}`);
    }
  }

  async createHurdle(hurdle: Omit<Hurdle, 'id'>): Promise<Hurdle> {
    try {
      console.log('🔍 Creating hurdle in Notion with data:', hurdle);
      
      const properties: any = {
        'Name': { title: [{ text: { content: hurdle.name } }] },
        'User': { relation: [{ id: hurdle.userId }] },
        'Hurdle Type': { select: { name: hurdle.hurdleType } },
        'Description': { rich_text: [{ text: { content: hurdle.description } }] },
        'Date': { date: { start: hurdle.date } }
      };

      // Only add Habit relation if habitId is provided
      if (hurdle.habitId) {
        properties['Habit'] = { relation: [{ id: hurdle.habitId }] };
      }

      const response = await this.client.pages.create({
        parent: { database_id: this.databases.hurdles },
        properties
      });

      console.log('✅ Hurdle created successfully in Notion:', response.id);
      return {
        id: response.id,
        ...hurdle
      };
    } catch (error) {
      console.error('❌ Error creating hurdle in Notion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create hurdle: ${message}`);
    }
  }

  async createWeek(week: Omit<Week, 'id'>): Promise<Week> {
    try {
      console.log('🔍 Creating week in Notion with data:', week);
      
      const properties: any = {
        'User': { relation: [{ id: week.userId }] },
        'Week Num': { number: week.weekNum },
        'Start Date': { date: { start: week.startDate } },
        'Summary': { rich_text: week.summary ? [{ text: { content: week.summary } }] : [] },
        'Score': { number: week.score || 0 }
      };

      // Add Discord ID field (it's the title property in this database)
      if (week.discordId) {
        properties['DiscordID'] = { title: [{ text: { content: week.discordId } }] };
      }

      const response = await this.client.pages.create({
        parent: { database_id: this.databases.weeks },
        properties
      });

      console.log('✅ Week created successfully in Notion:', response.id);
      return {
        id: response.id,
        ...week
      };
    } catch (error) {
      console.error('❌ Error creating week in Notion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create week: ${message}`);
    }
  }

  async createGroup(group: Omit<Group, 'id'>): Promise<Group> {
    try {
      console.log('🔍 Creating group in Notion with data:', group);
      
      const properties: any = {
        'Name': { title: [{ text: { content: group.name } }] },
        'Channel ID': { rich_text: [{ text: { content: group.channelId } }] },
        'Donation Pool': { number: group.donationPool || 0 }
      };

      const response = await this.client.pages.create({
        parent: { database_id: this.databases.groups },
        properties
      });

      console.log('✅ Group created successfully in Notion:', response.id);
      return {
        id: response.id,
        ...group
      };
    } catch (error) {
      console.error('❌ Error creating group in Notion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create group: ${message}`);
    }
  }

  async getUserByDiscordId(discordId: string): Promise<User | null> {
    try {
      console.log('🔍 Looking up user by Discord ID:', discordId);
      
      const response = await this.client.databases.query({
        database_id: this.databases.users,
        filter: {
          property: 'DiscordID',
          rich_text: { equals: discordId }  // Fixed: DiscordID is rich_text, not title
        }
      });

      console.log('📊 Database query response:', {
        resultsCount: response.results.length,
        hasResults: response.results.length > 0
      });

      if (response.results.length === 0) {
        console.log('❌ No user found with Discord ID:', discordId);
        return null;
      }

      const page = response.results[0] as any;
      
      // Debug: Log the actual structure of the properties
      console.log('🔍 Page properties structure:', JSON.stringify(page.properties, null, 2));
      
      // Safely extract properties with fallbacks
      const getTitleContent = (prop: any) => {
        if (!prop?.title || !Array.isArray(prop.title) || prop.title.length === 0) return '';
        return prop.title[0]?.text?.content || prop.title[0]?.plain_text || '';
      };
      
      const getRichTextContent = (prop: any) => {
        if (!prop?.rich_text || !Array.isArray(prop.rich_text) || prop.rich_text.length === 0) return '';
        return prop.rich_text[0]?.text?.content || prop.rich_text[0]?.plain_text || '';
      };
      
      const getSelectContent = (prop: any): string | undefined => {
        if (!prop?.select) return undefined;
        return prop.select.name;
      };
      
      const user = {
        id: page.id,
        discordId: getRichTextContent(page.properties['DiscordID']),  // Fixed: DiscordID is rich_text, not title
        name: getTitleContent(page.properties['Name']),                // Fixed: Name is title, not rich_text
        timezone: getRichTextContent(page.properties['Timezone']),
        bestTime: getRichTextContent(page.properties['Best Time']),
        trustCount: page.properties['Trust Count']?.number || 0,
        personalChannelId: getRichTextContent(page.properties['Personal Channel ID']),
        status: (getSelectContent(page.properties['Status']) || 'active') as 'active' | 'pause',
        // Pause Reason and Duration are optional - only extract if property exists
        pauseReason: page.properties['Pause Reason'] ? getRichTextContent(page.properties['Pause Reason']) : undefined,
        pauseDuration: page.properties['Pause Duration'] ? getRichTextContent(page.properties['Pause Duration']) : undefined
      };

      console.log('✅ User found:', {
        id: user.id,
        name: user.name,
        discordId: user.discordId,
        hasPersonalChannel: !!user.personalChannelId
      });

      return user;
    } catch (error) {
      console.error('❌ Error fetching user by Discord ID:', discordId, error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      console.log('🔍 Updating user in Notion:', userId, updates);
      
      const properties: any = {};
      
      if (updates.personalChannelId !== undefined) {
        properties['Personal Channel ID'] = { rich_text: [{ text: { content: updates.personalChannelId } }] };
      }
      
      if (updates.name !== undefined) {
        properties['DiscordID'] = { title: [{ text: { content: updates.name } }] };
      }
      
      if (updates.timezone !== undefined) {
        properties['Timezone'] = { rich_text: [{ text: { content: updates.timezone } }] };
      }
      
      if (updates.bestTime !== undefined) {
        properties['Best Time'] = { rich_text: [{ text: { content: updates.bestTime } }] };
      }
      
      if (updates.trustCount !== undefined) {
        properties['Trust Count'] = { number: updates.trustCount };
      }

      if (updates.status !== undefined) {
        properties['Status'] = { select: { name: updates.status } };
      }

      // Note: Pause Reason and Pause Duration fields are optional
      // Only update if they exist in the database (to avoid errors)
      // For now, we'll skip these fields if they're not in the DB
      // The Status field is sufficient for pause/activate functionality

      const response = await this.client.pages.update({
        page_id: userId,
        properties
      });

      console.log('✅ User updated successfully in Notion');
      
      // Fetch the updated user page to get all properties
      const updatedPage = await this.client.pages.retrieve({ page_id: userId }) as any;
      const pageProps = updatedPage.properties;
      
      const getTitleContent = (prop: any) => {
        if (!prop?.title || !Array.isArray(prop.title) || prop.title.length === 0) return '';
        return prop.title[0]?.text?.content || prop.title[0]?.plain_text || '';
      };
      
      const getRichTextContent = (prop: any) => {
        if (!prop?.rich_text || !Array.isArray(prop.rich_text) || prop.rich_text.length === 0) return '';
        return prop.rich_text[0]?.text?.content || prop.rich_text[0]?.plain_text || '';
      };
      
      const getSelectContent = (prop: any): string | undefined => {
        if (!prop?.select) return undefined;
        return prop.select.name;
      };
      
      return {
        id: response.id,
        discordId: getRichTextContent(pageProps['DiscordID']),
        name: getTitleContent(pageProps['Name']),
        timezone: getRichTextContent(pageProps['Timezone']),
        bestTime: getRichTextContent(pageProps['Best Time']),
        trustCount: pageProps['Trust Count']?.number || 0,
        personalChannelId: getRichTextContent(pageProps['Personal Channel ID']),
        status: (getSelectContent(pageProps['Status']) || 'active') as 'active' | 'pause',
        // Pause Reason and Duration are optional - only extract if property exists
        pauseReason: pageProps['Pause Reason'] ? getRichTextContent(pageProps['Pause Reason']) : undefined,
        pauseDuration: pageProps['Pause Duration'] ? getRichTextContent(pageProps['Pause Duration']) : undefined
      };
    } catch (error) {
      console.error('❌ Error updating user in Notion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update user: ${message}`);
    }
  }

  async getProofsByUserId(userId: string, startDate?: string, endDate?: string): Promise<Proof[]> {
    try {
      const filter: any = {
        property: 'User',
        relation: {
          contains: userId
        }
      };

      // Add date range filter if provided
      if (startDate && endDate) {
        filter.and = [
          {
            property: 'Date',
            date: {
              on_or_after: startDate
            }
          },
          {
            property: 'Date',
            date: {
              on_or_before: endDate
            }
          }
        ];
      }

      const response = await this.client.databases.query({
        database_id: this.databases.proofs,
        filter,
        sorts: [
          {
            property: 'Date',
            direction: 'descending'
          }
        ]
      });

      return response.results.map((page: any) => {
        const properties = page.properties;
        return {
          id: page.id,
          userId: properties['User']?.relation?.[0]?.id || userId,
          habitId: properties['Habit']?.relation?.[0]?.id || '',
          date: properties['Date']?.date?.start || '',
          unit: properties['Unit']?.rich_text?.[0]?.text?.content || '',
          note: properties['Note']?.rich_text?.[0]?.text?.content || '',
          attachmentUrl: properties['Attachment URL']?.url || undefined,
          isMinimalDose: properties['Is Minimal Dose ']?.checkbox || false,
          isCheatDay: properties['Is Cheat Day']?.checkbox || false
        };
      });
    } catch (error) {
      console.error('Error fetching proofs by user ID:', error);
      return [];
    }
  }

  async getLearningsByUserId(userId: string, limit: number = 10): Promise<Learning[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.learnings,
        filter: {
          property: 'User',
          relation: {
            contains: userId
          }
        },
        sorts: [
          {
            property: 'Created At',
            direction: 'descending'
          }
        ],
        page_size: limit
      });

      return response.results.map((page: any) => {
        const properties = page.properties;
        return {
          id: page.id,
          userId: properties['User']?.relation?.[0]?.id || userId,
          habitId: properties['Habit']?.relation?.[0]?.id || '',
          discordId: properties['DiscordID']?.title?.[0]?.text?.content || '',
          text: properties['Text']?.rich_text?.[0]?.text?.content || '',
          createdAt: properties['Created At']?.created_time || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error fetching learnings by user ID:', error);
      return [];
    }
  }

  async getHurdlesByUserId(userId: string, limit: number = 5): Promise<Hurdle[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.hurdles,
        filter: {
          property: 'User',
          relation: {
            contains: userId
          }
        },
        // Note: Hurdles database doesn't have 'Created At' property, so we don't sort
        page_size: limit
      });

      return response.results.map((page: any) => {
        const properties = page.properties;
        return {
          id: page.id,
          userId: properties['User']?.relation?.[0]?.id || userId,
          habitId: properties['Habit']?.relation?.[0]?.id || '',
          name: properties['Name']?.title?.[0]?.text?.content || 'Hurdle',
          hurdleType: properties['Hurdle Type']?.select?.name || 'Other',
          description: properties['Description']?.rich_text?.[0]?.text?.content || '',
          date: properties['Date']?.date?.start || new Date().toISOString().split('T')[0]
        };
      });
    } catch (error) {
      console.error('Error fetching hurdles by user ID:', error);
      return [];
    }
  }

  async getUserSummary(userId: string, weekStart?: string): Promise<{
    totalProofs: number;
    minimalDoses: number;
    cheatDays: number;
    completionRate: number;
    currentStreak: number;
    bestStreak: number;
    totalHabits: number;
    weekProofs: number;
    weekDays: number;
    habitProgress: Array<{
      habitId: string;
      habitName: string;
      targetFrequency: number;
      actualFrequency: number;
      completionRate: number;
      lastProofDate?: string;
    }>;
    weekStartDate: string;
    weekEndDate: string;
  }> {
    try {
      // Get user's habits
      const habits = await this.getHabitsByUserId(userId);
      
      // Calculate date range for the week (Monday to Sunday)
      const now = new Date();
      let weekStartDate: Date;
      
      if (weekStart) {
        weekStartDate = new Date(weekStart);
      } else {
        // Get Monday of current week
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 6 days from Monday
        weekStartDate = new Date(now);
        weekStartDate.setDate(now.getDate() - daysFromMonday);
      }
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);
      
      const startDateStr = weekStartDate.toISOString().split('T')[0];
      const endDateStr = weekEndDate.toISOString().split('T')[0];
      
      console.log(`📊 Calculating summary for user ${userId} from ${startDateStr} to ${endDateStr}`);
      
      // Get all proofs for the user
      const allProofs = await this.getProofsByUserId(userId);
      const weekProofs = await this.getProofsByUserId(userId, startDateStr, endDateStr);
      
      // Calculate habit-specific progress
      const habitProgress = habits.map(habit => {
        const habitProofs = weekProofs.filter(proof => proof.habitId === habit.id);
        const lastProof = habitProofs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        return {
          habitId: habit.id,
          habitName: habit.name,
          targetFrequency: habit.frequency,
          actualFrequency: habitProofs.length,
          completionRate: Math.round((habitProofs.length / habit.frequency) * 100),
          lastProofDate: lastProof?.date
        };
      });
      
      // Calculate overall statistics
      const totalProofs = allProofs.length;
      const minimalDoses = weekProofs.filter(p => p.isMinimalDose).length;
      const cheatDays = weekProofs.filter(p => p.isCheatDay).length;
      const weekDays = 7;
      
      // Calculate overall completion rate based on habit targets
      const totalTargetFrequency = habits.reduce((sum, habit) => sum + habit.frequency, 0);
      const totalActualFrequency = weekProofs.length;
      const completionRate = totalTargetFrequency > 0 ? Math.round((totalActualFrequency / totalTargetFrequency) * 100) : 0;
      
      // Calculate streaks with improved logic
      const currentStreak = this.calculateCurrentStreak(allProofs);
      const bestStreak = this.calculateBestStreak(allProofs);
      
      return {
        totalProofs,
        minimalDoses,
        cheatDays,
        completionRate,
        currentStreak,
        bestStreak,
        totalHabits: habits.length,
        weekProofs: weekProofs.length,
        weekDays,
        habitProgress,
        weekStartDate: startDateStr,
        weekEndDate: endDateStr
      };
    } catch (error) {
      console.error('Error calculating user summary:', error);
      return {
        totalProofs: 0,
        minimalDoses: 0,
        cheatDays: 0,
        completionRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalHabits: 0,
        weekProofs: 0,
        weekDays: 7,
        habitProgress: [],
        weekStartDate: '',
        weekEndDate: ''
      };
    }
  }

  private calculateCurrentStreak(proofs: Proof[]): number {
    if (proofs.length === 0) return 0;
    
    // Sort proofs by date (newest first)
    const sortedProofs = proofs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Get unique dates (one proof per day counts as one day)
    const uniqueDates = [...new Set(sortedProofs.map(p => p.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (uniqueDates.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's a proof today or yesterday
    const latestProofDate = new Date(uniqueDates[0]);
    latestProofDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - latestProofDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If the latest proof is more than 2 days old, streak is broken
    if (daysDiff > 2) return 0;
    
    // Start counting from the latest proof date
    let currentDate = new Date(latestProofDate);
    streak = 1;
    
    // Count consecutive days backwards
    for (let i = 1; i < uniqueDates.length; i++) {
      const proofDate = new Date(uniqueDates[i]);
      proofDate.setHours(0, 0, 0, 0);
      
      const daysBetween = Math.floor((currentDate.getTime() - proofDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        streak++;
        currentDate = proofDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateBestStreak(proofs: Proof[]): number {
    if (proofs.length === 0) return 0;
    
    // Sort proofs by date (oldest first)
    const sortedProofs = proofs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Get unique dates (one proof per day counts as one day)
    const uniqueDates = [...new Set(sortedProofs.map(p => p.date))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    if (uniqueDates.length === 0) return 0;
    
    let bestStreak = 1;
    let currentStreak = 1;
    
    // Count consecutive days
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currentDate = new Date(uniqueDates[i]);
      
      const daysBetween = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return bestStreak;
  }

  async getWeeklyFrequencyCount(userId: string, habitId: string): Promise<{ current: number; target: number }> {
    try {
      // Get the habit to find its target frequency
      const habits = await this.getHabitsByUserId(userId);
      const habit = habits.find(h => h.id === habitId);
      if (!habit) {
        return { current: 0, target: 1 };
      }

      // Calculate current week's start and end dates (Monday to Sunday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 6 days from Monday
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const startDateStr = weekStart.toISOString().split('T')[0];
      const endDateStr = weekEnd.toISOString().split('T')[0];

      console.log(`📊 Getting weekly frequency for habit ${habitId} from ${startDateStr} to ${endDateStr}`);

      // Get proofs for this habit in the current week
      const weekProofs = await this.getProofsByUserId(userId, startDateStr, endDateStr);
      const habitProofs = weekProofs.filter(proof => proof.habitId === habitId);

      return {
        current: habitProofs.length,
        target: habit.frequency
      };
    } catch (error) {
      console.error('Error getting weekly frequency count:', error);
      return { current: 0, target: 1 };
    }
  }

  getCurrentWeekInfo(): { weekStart: Date; weekEnd: Date; weekNumber: number } {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 6 days from Monday
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Calculate week number (week of year) - ISO week
    const weekNumber = this.getISOWeekNumber(now);

    return { weekStart, weekEnd, weekNumber };
  }

  private getISOWeekNumber(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }

  async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔍 Fetching all users from Notion...');
      
      const response = await this.client.databases.query({
        database_id: this.databases.users
      });

      console.log(`📊 Found ${response.results.length} users in Notion`);

      const getTitleContent = (prop: any) => {
        if (!prop?.title || !Array.isArray(prop.title) || prop.title.length === 0) return '';
        return prop.title[0]?.text?.content || prop.title[0]?.plain_text || '';
      };

      const getRichTextContent = (prop: any) => {
        if (!prop?.rich_text || !Array.isArray(prop.rich_text) || prop.rich_text.length === 0) return '';
        return prop.rich_text[0]?.text?.content || prop.rich_text[0]?.plain_text || '';
      };

      const getSelectContent = (prop: any): string | undefined => {
        if (!prop?.select) return undefined;
        return prop.select.name;
      };

      return response.results.map((page: any) => {
        const properties = page.properties;
        return {
          id: page.id,
          discordId: getRichTextContent(properties['DiscordID']),
          name: getTitleContent(properties['Name']) || 'Unknown User',
          timezone: getRichTextContent(properties['Timezone']) || 'Europe/Berlin',
          bestTime: getRichTextContent(properties['Best Time']) || '09:00',
          trustCount: properties['Trust Count']?.number || 0,
          personalChannelId: getRichTextContent(properties['Personal Channel ID']),
          status: (getSelectContent(properties['Status']) || 'active') as 'active' | 'pause',
          // Pause Reason and Duration are optional - only extract if property exists
          pauseReason: properties['Pause Reason'] ? getRichTextContent(properties['Pause Reason']) : undefined,
          pauseDuration: properties['Pause Duration'] ? getRichTextContent(properties['Pause Duration']) : undefined
        };
      });
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      return [];
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      console.log('🔍 Fetching active users from Notion...');
      
      const response = await this.client.databases.query({
        database_id: this.databases.users,
        filter: {
          property: 'Status',
          select: {
            equals: 'active'
          }
        }
      });

      console.log(`📊 Found ${response.results.length} active users in Notion`);

      const getTitleContent = (prop: any) => {
        if (!prop?.title || !Array.isArray(prop.title) || prop.title.length === 0) return '';
        return prop.title[0]?.text?.content || prop.title[0]?.plain_text || '';
      };

      const getRichTextContent = (prop: any) => {
        if (!prop?.rich_text || !Array.isArray(prop.rich_text) || prop.rich_text.length === 0) return '';
        return prop.rich_text[0]?.text?.content || prop.rich_text[0]?.plain_text || '';
      };

      return response.results.map((page: any) => {
        const properties = page.properties;
        return {
          id: page.id,
          discordId: getRichTextContent(properties['DiscordID']),
          name: getTitleContent(properties['Name']) || 'Unknown User',
          timezone: getRichTextContent(properties['Timezone']) || 'Europe/Berlin',
          bestTime: getRichTextContent(properties['Best Time']) || '09:00',
          trustCount: properties['Trust Count']?.number || 0,
          personalChannelId: getRichTextContent(properties['Personal Channel ID']),
          status: 'active' as const,
          // Pause Reason and Duration are optional - only extract if property exists
          pauseReason: properties['Pause Reason'] ? getRichTextContent(properties['Pause Reason']) : undefined,
          pauseDuration: properties['Pause Duration'] ? getRichTextContent(properties['Pause Duration']) : undefined
        };
      });
    } catch (error) {
      console.error('❌ Error fetching active users:', error);
      return [];
    }
  }

  async getAllGroups(): Promise<Group[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.groups,
        page_size: 100
      });

      return response.results.map((page: any) => ({
        id: page.id,
        name: page.properties.Name?.title?.[0]?.text?.content || '',
        channelId: page.properties['Channel ID']?.rich_text?.[0]?.text?.content || '',
        donationPool: page.properties['Donation Pool']?.number || 0
      }));

    } catch (error) {
      console.error('Error getting all groups:', error);
      return [];
    }
  }

  async getLearningsByDiscordId(discordId: string): Promise<Learning[]> {
    try {
      // First, get the user by Discord ID to get their user ID
      const user = await this.getUserByDiscordId(discordId);
      if (!user) {
        console.log('No user found for Discord ID:', discordId);
        return [];
      }

      // Query learnings by User relation (more reliable than title field)
      const response = await this.client.databases.query({
        database_id: this.databases.learnings,
        filter: {
          property: 'User',
          relation: {
            contains: user.id
          }
        },
        page_size: 100
      });

      return response.results.map((page: any) => ({
        id: page.id,
        userId: page.properties.User?.relation?.[0]?.id || '',
        habitId: page.properties.Habit?.relation?.[0]?.id || '',
        discordId: page.properties['Discord ID ']?.title?.[0]?.text?.content || '',  // Fixed: title field with trailing space
        text: page.properties.Text?.rich_text?.[0]?.text?.content || '',
        createdAt: page.properties['Created At']?.date?.start || new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error getting learnings by Discord ID:', error);
      return [];
    }
  }

  async getHurdlesByDiscordId(discordId: string): Promise<Hurdle[]> {
    try {
      // First, get the user by Discord ID to get their user ID
      const user = await this.getUserByDiscordId(discordId);
      if (!user) {
        console.log('No user found for Discord ID:', discordId);
        return [];
      }

      // Then query hurdles by User relation (Hurdles DB has no Discord ID field)
      const response = await this.client.databases.query({
        database_id: this.databases.hurdles,
        filter: {
          property: 'User',
          relation: {
            contains: user.id
          }
        },
        page_size: 100
      });

      return response.results.map((page: any) => ({
        id: page.id,
        userId: page.properties.User?.relation?.[0]?.id || '',
        habitId: page.properties.Habit?.relation?.[0]?.id || '',
        name: page.properties.Name?.title?.[0]?.text?.content || '',
        hurdleType: page.properties['Hurdle Type']?.select?.name || 'Other',  // Fixed: property name is "Hurdle Type"
        description: page.properties.Description?.rich_text?.[0]?.text?.content || '',
        date: page.properties.Date?.date?.start || new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error getting hurdles by Discord ID:', error);
      return [];
    }
  }

  // Personality DB Methods
  async createUserProfile(profile: Omit<UserProfile, 'id'>): Promise<UserProfile> {
    const properties: any = {
      'Discord ID': { title: [{ text: { content: profile.discordId } }] },
    };

    // Add optional fields if they exist
    if (profile.user?.id) {
      properties['User'] = { relation: [{ id: profile.user.id }] };
    }
    if (profile.joinDate) {
      properties['Join Date'] = { date: { start: profile.joinDate } };
    }
    if (profile.personalityType) {
      properties['Personality Type'] = { select: { name: profile.personalityType } };
    }
    if (profile.coreValues && profile.coreValues.length > 0) {
      properties['Core Values'] = { multi_select: profile.coreValues.map(value => ({ name: value })) };
    }
    if (profile.lifeVision) {
      properties['Life Vision'] = { rich_text: [{ text: { content: profile.lifeVision } }] };
    }
    if (profile.mainGoals && profile.mainGoals.length > 0) {
      properties['Main Goals'] = { rich_text: [{ text: { content: profile.mainGoals.join('\n') } }] };
    }
    if (profile.bigFiveTraits) {
      properties['Big five traits'] = { rich_text: [{ text: { content: profile.bigFiveTraits } }] };
    }
    if (profile.lifeDomains && profile.lifeDomains.length > 0) {
      properties['Life domains'] = { multi_select: profile.lifeDomains.map(domain => ({ name: domain })) };
    }
    if (profile.lifePhase) {
      properties['Life Phase'] = { rich_text: [{ text: { content: profile.lifePhase } }] };
    }
    if (profile.desiredIdentity) {
      properties['Desired Identity'] = { rich_text: [{ text: { content: profile.desiredIdentity } }] };
    }
    if (profile.openSpace) {
      properties['Open Space'] = { rich_text: [{ text: { content: profile.openSpace } }] };
    }

    // Validate configuration before creating the page to produce clearer errors
    if (!this.databases || !this.databases.personality) {
      throw new Error('NOTION_DATABASE_PERSONALITY is not configured. Please set it in your .env');
    }

    try {
      const response = await this.client.pages.create({
        parent: { database_id: this.databases.personality },
        properties
      });

      return {
        id: response.id,
        ...profile
      };
    } catch (error: any) {
      const rawMessage = (error?.body && error.body.message) || error?.message || 'Unknown error';
      // Provide a clear hint when a Page ID was configured instead of a Database ID
      if (typeof rawMessage === 'string' && rawMessage.toLowerCase().includes('is a page, not a database')) {
        throw new Error('NOTION_DATABASE_PERSONALITY points to a PAGE, not a DATABASE. Please provide the Database ID and share it with the integration.');
      }
      if (typeof rawMessage === 'string' && rawMessage.toLowerCase().includes('parent') && rawMessage.toLowerCase().includes('database')) {
        throw new Error(`Invalid Notion parent for personality profile. Ensure NOTION_DATABASE_PERSONALITY is a valid Database ID. Original error: ${rawMessage}`);
      }
      throw error;
    }
  }

  async getUserProfileByDiscordId(discordId: string): Promise<UserProfile | null> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.personality,
        filter: {
          property: 'Discord ID',
          title: {
            equals: discordId
          }
        }
      });

      if (response.results.length === 0) {
        return null;
      }

      const page = response.results[0] as any;
      const properties = page.properties;

      return {
        id: page.id,
        discordId: this.extractTextFromProperty(properties['Discord ID']),
        joinDate: properties['Join Date']?.date?.start,
        personalityType: properties['Personality Type']?.select?.name,
        coreValues: properties['Core Values']?.multi_select?.map((item: any) => item.name) || [],
        lifeVision: this.extractTextFromProperty(properties['Life Vision']),
        mainGoals: this.extractTextFromProperty(properties['Main Goals'])?.split('\n').filter(g => g.trim()) || [],
        bigFiveTraits: this.extractTextFromProperty(properties['Big five traits']),
        lifeDomains: properties['Life domains']?.multi_select?.map((item: any) => item.name) || [],
        lifePhase: this.extractTextFromProperty(properties['Life Phase']),
        desiredIdentity: this.extractTextFromProperty(properties['Desired Identity']),
        openSpace: this.extractTextFromProperty(properties['Open Space'])
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserProfile(discordId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // First get the existing profile
      const existingProfile = await this.getUserProfileByDiscordId(discordId);
      if (!existingProfile) {
        return null;
      }

      const properties: any = {};

      // Only update provided fields
      if (updates.personalityType) {
        properties['Personality Type'] = { select: { name: updates.personalityType } };
      }
      if (updates.coreValues) {
        properties['Core Values'] = { multi_select: updates.coreValues.map(value => ({ name: value })) };
      }
      if (updates.lifeVision) {
        properties['Life Vision'] = { rich_text: [{ text: { content: updates.lifeVision } }] };
      }
      if (updates.mainGoals) {
        properties['Main Goals'] = { rich_text: [{ text: { content: updates.mainGoals.join('\n') } }] };
      }
      if (updates.bigFiveTraits) {
        properties['Big five traits'] = { rich_text: [{ text: { content: updates.bigFiveTraits } }] };
      }
      if (updates.lifeDomains) {
        properties['Life domains'] = { multi_select: updates.lifeDomains.map(domain => ({ name: domain })) };
      }
      if (updates.lifePhase) {
        properties['Life Phase'] = { rich_text: [{ text: { content: updates.lifePhase } }] };
      }
      if (updates.desiredIdentity) {
        properties['Desired Identity'] = { rich_text: [{ text: { content: updates.desiredIdentity } }] };
      }
      if (updates.openSpace) {
        properties['Open Space'] = { rich_text: [{ text: { content: updates.openSpace } }] };
      }

      await this.client.pages.update({
        page_id: existingProfile.id,
        properties
      });

      // Return updated profile
      return await this.getUserProfileByDiscordId(discordId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  // ============================================
  // Price Pool Database Operations
  // ============================================

  /**
   * Create a new Price Pool entry for a charge
   */
  async createPricePoolEntry(entry: Omit<PricePoolEntry, 'id'>): Promise<PricePoolEntry> {
    try {
      const properties: any = {
        // Discord ID is the title field in Price Pool DB
        'Discord ID': { title: [{ text: { content: entry.discordId } }] },
        'Week date': { date: { start: entry.weekDate } },
        'Message': { rich_text: [{ text: { content: entry.message } }] },
        'Price': { number: entry.price }
      };

      // Add user relation if provided
      if (entry.userId) {
        properties['User'] = { relation: [{ id: entry.userId }] };
      }

      const response = await this.client.pages.create({
        parent: { database_id: this.databases.pricePool },
        properties
      });

      return {
        id: response.id,
        discordId: entry.discordId,
        userId: entry.userId,
        weekDate: entry.weekDate,
        message: entry.message,
        price: entry.price
      };
    } catch (error) {
      console.error('Error creating Price Pool entry:', error);
      throw error;
    }
  }

  /**
   * Get total price pool balance (sum of all charges)
   */
  async getTotalPricePool(): Promise<number> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.pricePool
      });

      let total = 0;
      for (const page of response.results) {
        const properties = (page as any).properties;
        const price = properties['Price']?.number || 0;
        total += price;
      }

      return total;
    } catch (error) {
      console.error('Error getting total price pool:', error);
      return 0;
    }
  }

  /**
   * Get Price Pool entries for a specific week
   */
  async getPricePoolEntriesByWeek(weekDate: string): Promise<PricePoolEntry[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.pricePool,
        filter: {
          property: 'Week date',
          date: {
            equals: weekDate
          }
        }
      });

      return response.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          discordId: props['Discord ID']?.title?.[0]?.text?.content || '',
          userId: props['User']?.relation?.[0]?.id,
          weekDate: props['Week date']?.date?.start || '',
          message: props['Message']?.rich_text?.[0]?.text?.content || '',
          price: props['Price']?.number || 0
        };
      });
    } catch (error) {
      console.error('Error getting Price Pool entries by week:', error);
      return [];
    }
  }

  // ============================================
  // Helper Methods for Accountability Agent
  // ============================================

  /**
   * Get proofs for a specific habit within a date range
   */
  async getProofsByHabitAndDateRange(
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<Proof[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.proofs,
        filter: {
          and: [
            {
              property: 'Habit',
              relation: {
                contains: habitId
              }
            },
            {
              property: 'Date',
              date: {
                on_or_after: startDate
              }
            },
            {
              property: 'Date',
              date: {
                on_or_before: endDate
              }
            }
          ]
        }
      });

      return response.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          userId: props['User']?.relation?.[0]?.id || '',
          habitId: props['Habit']?.relation?.[0]?.id || '',
          date: props['Date']?.date?.start || '',
          unit: props['Unit']?.rich_text?.[0]?.text?.content || '',
          note: props['Note']?.rich_text?.[0]?.text?.content,
          attachmentUrl: props['Attachment URL']?.url,
          isMinimalDose: props['Is Minimal Dose']?.checkbox || false,
          isCheatDay: props['Is Cheat Day']?.checkbox || false
        };
      });
    } catch (error) {
      console.error('Error getting proofs by habit and date range:', error);
      return [];
    }
  }

  /**
   * Get all weeks for a user (for streak calculation)
   */
  async getWeeksByUserId(userId: string): Promise<Week[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.weeks,
        filter: {
          property: 'User',
          relation: {
            contains: userId
          }
        },
        sorts: [
          {
            property: 'Week Num',
            direction: 'descending'
          }
        ]
      });

      return response.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          userId: props['User']?.relation?.[0]?.id || '',
          discordId: props['DiscordID']?.rich_text?.[0]?.text?.content,
          weekNum: props['Week Num']?.number || 0,
          startDate: props['Start Date']?.date?.start || '',
          summary: props['Summary']?.rich_text?.[0]?.text?.content,
          score: props['Score']?.number || 0
        };
      });
    } catch (error) {
      console.error('Error getting weeks by user ID:', error);
      return [];
    }
  }

  private extractTextFromProperty(property: any): string {
    if (!property) return '';
    if (property.rich_text && property.rich_text.length > 0) {
      return property.rich_text[0].text.content;
    }
    return '';
  }
}
