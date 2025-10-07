import type { Message } from 'discord.js';

export interface HabitTool {
  id: string;
  name: string;
  summary: string;
  categories: string[];
  keywords: string[];
  problemPatterns: string[]; // phrases that indicate a good match
  whenToUse: string[];
  steps: string[];
  sources: string[]; // URLs for citation
}

export class ToolboxEngine {
  private tools: HabitTool[];

  constructor(tools: HabitTool[]) {
    this.tools = tools;
  }

  addTools(extra: HabitTool[]) {
    this.tools.push(...extra);
  }

  matchTools(problem: string, limit: number = 3): Array<{ tool: HabitTool; score: number }> {
    const text = problem.toLowerCase();

    const scored = this.tools.map(tool => ({
      tool,
      score: this.scoreTool(tool, text)
    }));

    const positive = scored.filter(s => s.score > 0);
    positive.sort((a, b) => b.score - a.score);
    return positive.slice(0, limit);
  }

  private scoreTool(tool: HabitTool, text: string): number {
    let score = 0;

    // Enhanced keyword matching with German support and exact matches
    for (const kw of tool.keywords) {
      const keyword = kw.toLowerCase();
      if (text.includes(keyword)) {
        score += 3;
        // Bonus for exact word matches
        if (text.includes(` ${keyword} `) || text.startsWith(`${keyword} `) || text.endsWith(` ${keyword}`)) {
          score += 2;
        }
        // Bonus for phrase matches
        if (text.includes(keyword + 's') || text.includes(keyword + 'ing') || text.includes(keyword + 'ed')) {
          score += 1;
        }
      }
    }

    // Enhanced problem patterns with German translations and fuzzy matching
    for (const p of tool.problemPatterns) {
      const pattern = p.toLowerCase();
      if (text.includes(pattern)) {
        score += 5;
        // Bonus for exact phrase matches
        if (text === pattern || text.includes(` ${pattern} `)) {
          score += 3;
        }
      }
      // Fuzzy matching for similar phrases
      const words = pattern.split(' ');
      if (words.length > 1) {
        const matchedWords = words.filter(word => text.includes(word));
        if (matchedWords.length >= words.length * 0.7) {
          score += 2;
        }
      }
    }

    // Comprehensive category hints with German and more use cases
    const catHints: Record<string, string[]> = {
      focus: [
        'focus', 'distraction', 'deep work', 'concentrat', 'interrupt', 'concentration', 'pomodoro', 'timer',
        'fokussieren', 'ablenkung', 'konzentration', 'stören', 'unterbrechung', 'fokussiert', 'aufmerksamkeit',
        'can\'t focus', 'get distracted', 'lose concentration', 'overwhelmed', 'scattered', 'unfocused'
      ],
      time: [
        'time', 'timebox', 'time box', 'time-box', 'timeblock', 'time block', 'calendar', 'schedule', 'busy', 'structure', 'planning',
        'zeit', 'keine zeit', 'keine zeit haben', 'zeitmangel', 'stress', 'hetze', 'eile', 'termin', 'planung',
        'no time', 'don\'t have time', 'busy', 'overwhelmed', 'too much', 'never start', 'postpone', 'procrastinate'
      ],
      motivation: [
        'motivation', 'friction', 'resist', 'temptation', 'easy', 'hard start', 'procrast', 'reward', 'incentive', 'energy', 'identity',
        'motivation', 'antrieb', 'lustlos', 'faul', 'träge', 'energielos', 'unmotiviert', 'belohnung', 'anreiz',
        'low motivation', 'boring', 'hard to start', 'procrastinate', 'lazy', 'tired', 'unmotivated', 'no energy'
      ],
      routine: [
        'routine', 'stack', 'bundle', 'anchor', 'after', 'before', 'remember', 'forget', 'morning', 'evening', 'micro', 'tiny', 'combining', 'combine', 'merge', 'group', 'tracking', 'track', 'streak',
        'routine', 'gewohnheit', 'vergesen', 'vergessen', 'morgens', 'abends', 'klein', 'winzig', 'automatisch', 'kombinieren', 'gruppieren', 'verfolgen', 'messen', 'streak', 'kette',
        'forget to do', 'hard to remember', 'no routine', 'inconsistent', 'irregular', 'sporadic', 'unreliable', 'combining habits', 'tracking habits', 'habit combination'
      ],
      environment: [
        'environment', 'setup', 'prepare', 'space', 'place', 'triggers', 'cues', 'digital', 'minimalism',
        'umgebung', 'vorbereitung', 'platz', 'raum', 'trigger', 'hinweis', 'digital', 'minimalismus',
        'environment not supportive', 'wrong place', 'distractions', 'noise', 'chaos', 'disorganized'
      ]
    };

    // Enhanced scoring with German language support
    for (const cat of tool.categories) {
      const hints = catHints[cat];
      if (!hints) continue;
      for (const h of hints) {
        if (text.includes(h)) {
          score += 2;
          // Bonus for exact phrase matches
          if (text.includes(` ${h} `) || text.startsWith(`${h} `) || text.endsWith(` ${h}`)) {
            score += 1;
          }
        }
      }
    }

    // Additional scoring for common German phrases
    const germanPhrases: Record<string, number> = {
      'keine zeit': 8,
      'keine zeit haben': 10,
      'zu wenig zeit': 8,
      'kein zeit': 6,
      'zeitmangel': 8,
      'stress': 4,
      'hetze': 4,
      'eile': 4,
      'fokussieren': 6,
      'konzentration': 6,
      'ablenkung': 6,
      'vergessen': 6,
      'vergesen': 6,
      'motivation': 6,
      'antrieb': 6,
      'lustlos': 6,
      'faul': 6,
      'träge': 6,
      'energielos': 6,
      'unmotiviert': 6,
      'routine': 4,
      'gewohnheit': 4,
      'gewohnheiten': 6,
      'morgens': 4,
      'abends': 4,
      'klein': 3,
      'winzig': 3,
      'umgebung': 4,
      'vorbereitung': 4,
      'platz': 3,
      'raum': 3,
      'kombinieren': 6,
      'gruppieren': 6,
      'verfolgen': 6,
      'messen': 6,
      'fortschritt': 6,
      'streak': 6,
      'kette': 6,
      'identität': 6,
      'werden': 4,
      'persönlichkeit': 6,
      'verketten': 6,
      'zusammenfassen': 6
    };

    for (const [phrase, points] of Object.entries(germanPhrases)) {
      if (text.includes(phrase)) {
        score += points;
      }
    }

    // Bonus for multiple word matches (compound problems)
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 3) {
      score += Math.min(wordCount - 3, 3); // Bonus up to 3 points for longer descriptions
    }

    return score;
  }
}

export function formatToolboxReply(problem: string, matches: Array<{ tool: HabitTool; score: number }>): string {
  if (matches.length === 0) {
    return `🧰 I couldn't map your problem to a tool yet. Try describing it with a bit more detail (what blocks you, when, where).`;
  }

  const lines: string[] = [];
  lines.push(`🤖 **Toolbox Suggestions**`);
  lines.push('');
  lines.push(`📝 Your problem: ${problem}`);
  lines.push('');

  for (const { tool } of matches) {
    lines.push(`🔧 **${tool.name}** — ${tool.summary}`);
    if (tool.whenToUse.length) lines.push(`• When to use: ${tool.whenToUse.join('; ')}`);
    if (tool.steps.length) {
      lines.push('• How to apply:');
      for (const step of tool.steps.slice(0, 4)) lines.push(`  - ${step}`);
    }
    if (tool.sources.length) lines.push(`• Sources: ${tool.sources.map(s => s).join(' | ')}`);
    lines.push('');
  }

  lines.push('💡 Add more tools easily by editing `src/toolbox/tools.ts` (no code changes needed).');
  return lines.join('\n');
}


