export interface User {
  id: string;
  discordId: string;
  name: string;
  timezone: string;
  bestTime: string;
  trustCount: number;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  domains: string[];
  frequency: string;
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
  habitId: string;
  text: string;
  createdAt: string;
}

export interface Week {
  id: string;
  userId: string;
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