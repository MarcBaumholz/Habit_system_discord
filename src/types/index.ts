export interface User {
  id: string;
  discordId: string;
  name: string;
  timezone: string;
  bestTime: string;
  trustCount: number;
  personalChannelId?: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  domains: string[];
  frequency: number; // Days per week (1-7)
  context: string;
  difficulty: string;
  smartGoal: string;
  why: string;
  minimalDose: string;
  habitLoop: string;
  implementationIntentions: string;
  hurdles: string;
  reminderType: string;
}

export interface Proof {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  unit: string;
  note?: string;
  attachmentUrl?: string;
  isMinimalDose: boolean;
  isCheatDay: boolean;
}

export interface Learning {
  id: string;
  userId: string;
  habitId?: string;
  discordId?: string;
  text: string;
  createdAt: string;
}

export interface Hurdle {
  id: string;
  userId: string;
  habitId?: string;
  name: string;
  hurdleType: 'Time Management' | 'Motivation' | 'Environment' | 'Social' | 'Health' | 'Resources' | 'Knowledge' | 'Habit Stacking' | 'Perfectionism' | 'Other';
  description: string;
  date: string;
}

export interface Week {
  id: string;
  userId: string;
  discordId?: string;
  weekNum: number;
  startDate: string;
  summary?: string;
  score: number;
}

export interface Group {
  id: string;
  name: string;
  channelId: string;
  donationPool: number;
}