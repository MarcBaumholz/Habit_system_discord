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

    // Exact keyword hits
    for (const kw of tool.keywords) {
      if (text.includes(kw.toLowerCase())) score += 3;
    }

    // Problem patterns (phrases)
    for (const p of tool.problemPatterns) {
      if (text.includes(p.toLowerCase())) score += 5;
    }

    // Category hints
    const catHints: Record<string, string[]> = {
      focus: ['focus', 'distraction', 'deep work', 'concentrat', 'interrupt', 'concentration', 'pomodoro', 'timer'],
      time: ['time', 'timebox', 'time box', 'time-box', 'timeblock', 'time block', 'calendar', 'schedule', 'busy', 'structure', 'planning'],
      motivation: ['motivation', 'friction', 'resist', 'temptation', 'easy', 'hard start', 'procrast', 'reward', 'incentive', 'energy', 'identity'],
      routine: ['routine', 'stack', 'bundle', 'anchor', 'after', 'before', 'remember', 'forget', 'morning', 'evening', 'micro', 'tiny'],
      environment: ['environment', 'setup', 'prepare', 'space', 'place', 'triggers', 'cues', 'digital', 'minimalism']
    };
    for (const cat of tool.categories) {
      const hints = catHints[cat];
      if (!hints) continue;
      for (const h of hints) if (text.includes(h)) score += 2;
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


