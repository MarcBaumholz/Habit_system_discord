import { Habit, Proof } from '../types';

export class ContextCompressor {
  /**
   * Compress habit information intelligently
   */
  compressHabits(habits: Habit[], maxLength: number = 100): string {
    if (habits.length === 0) {
      return 'No habits defined.';
    }

    const compressed: string[] = [];
    
    habits.forEach(habit => {
      let habitStr = `${habit.name} (${habit.frequency}/wk)`;
      
      // Add why if short, otherwise truncate
      if (habit.why) {
        const why = habit.why.length > maxLength 
          ? habit.why.substring(0, maxLength - 3) + '...'
          : habit.why;
        habitStr += ` - Why: ${why}`;
      }
      
      compressed.push(habitStr);
    });

    return compressed.join('\n');
  }

  /**
   * Compress proofs into patterns
   */
  compressProofs(proofs: Proof[], habits: Habit[]): string {
    if (proofs.length === 0) {
      return 'No proofs this week.';
    }

    // Group by habit
    const proofsByHabit = new Map<string, Proof[]>();
    const habitMap = new Map<string, Habit>();
    
    habits.forEach(h => habitMap.set(h.id, h));
    
    proofs.forEach(proof => {
      const habitId = proof.habitId;
      if (!proofsByHabit.has(habitId)) {
        proofsByHabit.set(habitId, []);
      }
      proofsByHabit.get(habitId)!.push(proof);
    });

    const summary: string[] = [];
    
    proofsByHabit.forEach((habitProofs, habitId) => {
      const habit = habitMap.get(habitId);
      const habitName = habit?.name || 'Unknown Habit';
      const count = habitProofs.length;
      const minimalDoseCount = habitProofs.filter(p => p.isMinimalDose).length;
      const cheatDayCount = habitProofs.filter(p => p.isCheatDay).length;
      
      let line = `${habitName}: ${count} proof${count !== 1 ? 's' : ''}`;
      if (minimalDoseCount > 0) {
        line += ` (${minimalDoseCount} minimal dose)`;
      }
      if (cheatDayCount > 0) {
        line += ` (${cheatDayCount} cheat day)`;
      }
      
      summary.push(line);
    });

    return summary.join('\n');
  }

  /**
   * Compress learnings
   */
  compressLearnings(learnings: Array<{ text: string }>, maxCount: number = 3, maxLength: number = 100): string {
    if (learnings.length === 0) {
      return 'No recent learnings.';
    }

    const recent = learnings.slice(0, maxCount);
    return recent.map((learning, index) => {
      const text = learning.text.length > maxLength
        ? learning.text.substring(0, maxLength - 3) + '...'
        : learning.text;
      return `${index + 1}. ${text}`;
    }).join('\n');
  }

  /**
   * Compress hurdles
   */
  compressHurdles(hurdles: Array<{ name: string; description: string }>, maxCount: number = 3): string {
    if (hurdles.length === 0) {
      return 'No recent hurdles.';
    }

    const recent = hurdles.slice(0, maxCount);
    return recent.map((hurdle, index) => {
      return `${index + 1}. ${hurdle.name}: ${hurdle.description.substring(0, 80)}${hurdle.description.length > 80 ? '...' : ''}`;
    }).join('\n');
  }

  /**
   * Compress summary statistics
   */
  compressSummary(summary: {
    completionRate: number;
    currentStreak: number;
    bestStreak: number;
    weekProofs: number;
    weekDays: number;
    totalHabits: number;
  }): string {
    return `Habits: ${summary.totalHabits} | Completion: ${summary.completionRate.toFixed(1)}% | Streak: ${summary.currentStreak}d (best: ${summary.bestStreak}d) | Week: ${summary.weekProofs}/${summary.weekDays}`;
  }

  /**
   * Truncate text intelligently at word boundaries
   */
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to truncate at word boundary
    const truncated = text.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Compress context to fit within token budget
   */
  compressToTokenBudget(context: string, maxTokens: number = 2000): string {
    const currentTokens = this.estimateTokens(context);
    
    if (currentTokens <= maxTokens) {
      return context;
    }

    // Need to compress - truncate proportionally
    const ratio = maxTokens / currentTokens;
    const targetLength = Math.floor(context.length * ratio);
    
    return this.truncateText(context, targetLength);
  }
}

