export interface HabitTool {
  id: string;
  name: string;
  summary: string;
  description: string;
  categories: string[];
  keywords: string[];
  problemPatterns: string[];
  whenToUse: string[];
  steps: string[];
  examples: string[];
  tips: string[];
  sources: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeToImplement: string;
  effectiveness: number; // 1-5 stars
  language: 'en' | 'de' | 'both';
  icon: string;
  color: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  emoji?: string;
}

export interface SearchFilters {
  category?: string;
  difficulty?: string;
  language?: string;
  effectiveness?: number;
}
