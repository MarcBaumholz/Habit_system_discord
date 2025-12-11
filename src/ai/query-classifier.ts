export type QueryIntent =
  | 'habit_analysis'
  | 'progress_check'
  | 'personality_advice'
  | 'hurdle_help'
  | 'learning_insight'
  | 'general';

export interface QueryClassification {
  intent: QueryIntent;
  confidence: number;
  mentionedHabits?: string[];
}

export class QueryClassifier {
  /**
   * Classify user query to determine what context data is needed
   */
  classifyQuery(query: string): QueryClassification {
    const lowerQuery = query.toLowerCase().trim();

    // Extract mentioned habit names (simple pattern matching)
    const mentionedHabits = this.extractMentionedHabits(lowerQuery);

    // Check for habit analysis intent
    if (this.isHabitAnalysis(lowerQuery)) {
      return {
        intent: 'habit_analysis',
        confidence: 0.9,
        mentionedHabits,
      };
    }

    // Check for progress check intent
    if (this.isProgressCheck(lowerQuery)) {
      return {
        intent: 'progress_check',
        confidence: 0.85,
        mentionedHabits,
      };
    }

    // Check for personality advice intent
    if (this.isPersonalityAdvice(lowerQuery)) {
      return {
        intent: 'personality_advice',
        confidence: 0.9,
      };
    }

    // Check for hurdle help intent
    if (this.isHurdleHelp(lowerQuery)) {
      return {
        intent: 'hurdle_help',
        confidence: 0.85,
        mentionedHabits,
      };
    }

    // Check for learning insight intent
    if (this.isLearningInsight(lowerQuery)) {
      return {
        intent: 'learning_insight',
        confidence: 0.85,
        mentionedHabits,
      };
    }

    // Default to general
    return {
      intent: 'general',
      confidence: 0.7,
      mentionedHabits,
    };
  }

  /**
   * Check if query is about habit analysis
   */
  private isHabitAnalysis(query: string): boolean {
    const patterns = [
      /\b(how|wie)\s+(often|oft|many|viele)\s+(do|did|tue|tust|tun)\s+(you|ich|du|i)\s+(do|did|tue|tust|tun)/i,
      /\b(analyze|analyse|analysis|analysiere|analyse)\s+(my|meine|mein)\s+(habits|gewohnheiten)/i,
      /\b(what|was)\s+(are|sind)\s+(my|meine|mein)\s+(habits|gewohnheiten)/i,
      /\b(show|zeige|zeig)\s+(me|mir)\s+(my|meine|mein)\s+(habits|gewohnheiten)/i,
      /\b(habit|gewohnheit)\s+(performance|leistung|statistics|statistik)/i,
      /\b(which|welche)\s+(habits|gewohnheiten)\s+(do|did|tue|tust|tun)/i,
      /\b(habit|gewohnheit)\s+(frequency|haufigkeit|completion|erfullung)/i,
    ];

    return patterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is about progress check
   */
  private isProgressCheck(query: string): boolean {
    const patterns = [
      /\b(how|wie)\s+(am|bin|are|ist)\s+(i|ich|you|du)\s+(doing|geht|going)/i,
      /\b(progress|fortschritt|status|stand)\s+(on|bei|with|mit)/i,
      /\b(show|zeige|zeig)\s+(me|mir)\s+(progress|fortschritt|status)/i,
      /\b(what|was)\s+(is|ist)\s+(my|meine|mein)\s+(progress|fortschritt|status)/i,
      /\b(streak|serie|current|aktuelle)\s+(streak|serie)/i,
      /\b(completion|erfullung)\s+(rate|rate|percentage|prozent)/i,
      /\b(this|diese)\s+(week|woche)/i,
      /\b(how|wie)\s+(many|viele)\s+(days|tage)\s+(this|diese)\s+(week|woche)/i,
    ];

    return patterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is about personality advice
   */
  private isPersonalityAdvice(query: string): boolean {
    const patterns = [
      /\b(personality|personlichkeit)\s+(advice|rat|recommendation|empfehlung)/i,
      /\b(what|was)\s+(habits|gewohnheiten)\s+(fit|passen|suit|geeignet)\s+(my|meine|mein)\s+(personality|personlichkeit)/i,
      /\b(based|basierend)\s+(on|auf)\s+(my|meine|mein)\s+(personality|personlichkeit)/i,
      /\b(personality|personlichkeit)\s+(based|basierend|aligned|ausgerichtet)/i,
      /\b(identity|identitat)\s+(based|basierend|habits|gewohnheiten)/i,
      /\b(who|wer)\s+(am|bin)\s+(i|ich)/i,
      /\b(what|was)\s+(kind|art)\s+(of|von)\s+(habits|gewohnheiten)\s+(for|fur)/i,
    ];

    return patterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is about hurdle help
   */
  private isHurdleHelp(query: string): boolean {
    const patterns = [
      /\b(hurdle|hindernis|obstacle|hindernisse|problem|probleme|challenge|herausforderung)/i,
      /\b(stuck|stecken|blocked|blockiert|struggling|kampfen)/i,
      /\b(can't|cannot|kann\s+nicht|schaffe\s+nicht)\s+(do|tun|complete|erfullen)/i,
      /\b(help|hilfe)\s+(with|mit)\s+(habit|gewohnheit)/i,
      /\b(why|warum)\s+(can't|cannot|kann\s+nicht)\s+(i|ich)/i,
      /\b(difficulty|schwierigkeit|difficult|schwer)\s+(with|mit)/i,
    ];

    return patterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is about learning insight
   */
  private isLearningInsight(query: string): boolean {
    const patterns = [
      /\b(learning|lerne|insight|einsicht|insights|einsichten)/i,
      /\b(what|was)\s+(have|habe|did|tat)\s+(i|ich|you|du)\s+(learned|gelernt)/i,
      /\b(show|zeige|zeig)\s+(me|mir)\s+(learnings|lerne|insights|einsichten)/i,
      /\b(pattern|muster)\s+(in|bei|from|von)/i,
      /\b(what|was)\s+(works|funktioniert|doesn't|funktioniert\s+nicht)/i,
      /\b(discovery|entdeckung|realization|erkenntnis)/i,
    ];

    return patterns.some(pattern => pattern.test(query));
  }

  /**
   * Extract mentioned habit names from query (simple pattern matching)
   */
  private extractMentionedHabits(query: string): string[] {
    // This is a simple implementation - could be enhanced with NLP
    // Look for common patterns like "habit X", "X habit", etc.
    const habitPatterns = [
      /\b(habit|gewohnheit)\s+["']?([a-zäöüß]+(?:\s+[a-zäöüß]+)*)["']?/gi,
      /["']([a-zäöüß]+(?:\s+[a-zäöüß]+)*)["']?\s+(habit|gewohnheit)/gi,
    ];

    const mentioned: string[] = [];
    
    habitPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        const habitName = match[2] || match[1];
        if (habitName && habitName.length > 2) {
          mentioned.push(habitName.trim());
        }
      }
    });

    return [...new Set(mentioned)]; // Remove duplicates
  }
}

