/**
 * Weekly Progress Mindmap Generator
 * Creates a personalized visual mindmap showing user's weekly progress
 */

import { createCanvas, registerFont } from 'canvas';
import { Habit, Proof } from '../types';

interface MindmapData {
  userName: string;
  weekRange: string;
  overallScore: number;
  daysCompleted: number;
  totalDays: number;
  strongestHabit: { name: string; rate: number } | null;
  weakestHabit: { name: string; rate: number } | null;
  keyInsight: string;
  mainAction: string;
  trend: '↑' | '↓' | '→';
}

export class MindmapGenerator {
  private width = 1200;
  private height = 800;
  private centerX = 600;
  private centerY = 400;

  /**
   * Generate a personalized mindmap PNG for the user's weekly progress
   */
  async generateMindmap(data: MindmapData): Promise<Buffer> {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Background
    this.drawBackground(ctx);

    // Draw connections first (so they're behind nodes)
    this.drawConnections(ctx);

    // Draw center node (main score)
    this.drawCenterNode(ctx, data);

    // Draw branch nodes
    this.drawScoreNode(ctx, data);
    this.drawHabitsNode(ctx, data);
    this.drawInsightNode(ctx, data);
    this.drawActionNode(ctx, data);

    // Add user name and date
    this.drawHeader(ctx, data);

    return canvas.toBuffer('image/png');
  }

  /**
   * Draw gradient background
   */
  private drawBackground(ctx: any): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw header with user name and date
   */
  private drawHeader(ctx: any, data: MindmapData): void {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${data.userName}'s Wöchentliche Übersicht`, this.centerX, 50);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#a8b2d1';
    ctx.fillText(data.weekRange, this.centerX, 80);
  }

  /**
   * Draw connections from center to branch nodes
   */
  private drawConnections(ctx: any): void {
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;

    // Positions for branch nodes
    const positions = [
      { x: this.centerX, y: this.centerY - 200 }, // Top (Score)
      { x: this.centerX - 350, y: this.centerY }, // Left (Habits)
      { x: this.centerX + 350, y: this.centerY }, // Right (Insight)
      { x: this.centerX, y: this.centerY + 200 }  // Bottom (Action)
    ];

    positions.forEach(pos => {
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    });
  }

  /**
   * Draw center node with overall progress
   */
  private drawCenterNode(ctx: any, data: MindmapData): void {
    const radius = 80;

    // Determine color based on score
    let color = '#ef4444'; // red (low)
    if (data.overallScore >= 80) color = '#10b981'; // green (high)
    else if (data.overallScore >= 50) color = '#f59e0b'; // orange (medium)

    // Draw circle
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw score text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${data.overallScore}%`, this.centerX, this.centerY - 10);

    // Draw emoji based on trend
    ctx.font = '32px Arial';
    const trendEmoji = data.trend === '↑' ? '📈' : data.trend === '↓' ? '📉' : '➡️';
    ctx.fillText(trendEmoji, this.centerX, this.centerY + 30);

    // Label below
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#a8b2d1';
    ctx.fillText('GESAMT', this.centerX, this.centerY + radius + 25);
  }

  /**
   * Draw score branch (top)
   */
  private drawScoreNode(ctx: any, data: MindmapData): void {
    const x = this.centerX;
    const y = this.centerY - 200;
    const width = 200;
    const height = 80;

    // Draw rounded rectangle
    this.drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, 15, '#3b82f6', '#ffffff');

    // Draw content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📊 Diese Woche', x, y - 15);

    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${data.daysCompleted}/${data.totalDays} Nachweise`, x, y + 15);
  }

  /**
   * Draw habits branch (left)
   */
  private drawHabitsNode(ctx: any, data: MindmapData): void {
    const x = this.centerX - 350;
    const y = this.centerY;
    const width = 240;
    const height = 140;

    // Draw rounded rectangle
    this.drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, 15, '#8b5cf6', '#ffffff');

    // Draw content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💪 Gewohnheiten', x, y - 50);

    // Strongest habit
    if (data.strongestHabit) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#d4ffd4';
      const strongName = this.truncateText(data.strongestHabit.name, 18);
      ctx.fillText(`✅ ${strongName}`, x, y - 20);
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${data.strongestHabit.rate}%`, x, y + 5);
    }

    // Weakest habit
    if (data.weakestHabit) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#ffd4d4';
      const weakName = this.truncateText(data.weakestHabit.name, 18);
      ctx.fillText(`⚠️ ${weakName}`, x, y + 35);
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`${data.weakestHabit.rate}%`, x, y + 55);
    }
  }

  /**
   * Draw insight branch (right)
   */
  private drawInsightNode(ctx: any, data: MindmapData): void {
    const x = this.centerX + 350;
    const y = this.centerY;
    const width = 240;
    const height = 120;

    // Draw rounded rectangle
    this.drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, 15, '#ec4899', '#ffffff');

    // Draw content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💡 Erkenntnis', x, y - 40);

    // Insight text (wrapped)
    ctx.font = '14px Arial';
    ctx.fillStyle = '#fff5d4';
    const lines = this.wrapText(data.keyInsight, 25);
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y - 10 + i * 20);
    });
  }

  /**
   * Draw action branch (bottom)
   */
  private drawActionNode(ctx: any, data: MindmapData): void {
    const x = this.centerX;
    const y = this.centerY + 200;
    const width = 280;
    const height = 100;

    // Draw rounded rectangle
    this.drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, 15, '#10b981', '#ffffff');

    // Draw content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯 Nächster Schritt', x, y - 30);

    // Action text (wrapped)
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#d4ffe0';
    const lines = this.wrapText(data.mainAction, 30);
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * 22);
    });
  }

  /**
   * Draw rounded rectangle helper
   */
  private drawRoundedRect(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor: string,
    strokeColor: string
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  /**
   * Truncate text to max length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Wrap text into multiple lines
   */
  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Limit to 3 lines
    return lines.slice(0, 3);
  }

  /**
   * Calculate habit performance from habits and proofs
   */
  static calculateHabitPerformance(
    habits: Habit[],
    currentWeekProofs: Proof[]
  ): {
    strongest: { name: string; rate: number } | null;
    weakest: { name: string; rate: number } | null;
  } {
    if (habits.length === 0) {
      return { strongest: null, weakest: null };
    }

    const habitRates = habits.map(habit => {
      const habitProofs = currentWeekProofs.filter(p => p.habitId === habit.id);
      const rate = Math.round((habitProofs.length / habit.frequency) * 100);
      return { name: habit.name, rate: Math.min(100, rate) };
    });

    // Sort by rate
    habitRates.sort((a, b) => b.rate - a.rate);

    const strongest = habitRates[0];
    const weakest = habitRates[habitRates.length - 1];

    return { strongest, weakest };
  }
}
