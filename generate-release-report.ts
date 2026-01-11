/**
 * Generate Release Report Script
 * 
 * Generates a detailed release report for today's changes in Notion style
 * with a mindmap visualization and sends it to the Discord new features channel.
 * 
 * Usage:
 *   npx ts-node generate-release-report.ts
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

interface ChangeInfo {
  files: string[];
  additions: number;
  deletions: number;
  commitHash: string;
  author: string;
  date: string;
  message: string;
}

class ReleaseReportGenerator {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
  }

  /**
   * Get today's git commits and changes
   */
  getTodaysChanges(): ChangeInfo | null {
    try {
      const today = new Date().toISOString().split('T')[0];
      const gitLog = execSync(
        `git log --since="${today} 00:00" --pretty=format:"%h|%an|%ad|%s" --date=format:"%Y-%m-%d %H:%M:%S"`,
        { encoding: 'utf-8', cwd: process.cwd() }
      ).trim();

      if (!gitLog) {
        console.log('⚠️ No commits found for today');
        return null;
      }

      const lines = gitLog.split('\n');
      const latestCommit = lines[0];
      const [hash, author, date, ...messageParts] = latestCommit.split('|');
      const message = messageParts.join('|');

      // Get accurate stats from git show --stat
      const statOutput = execSync(
        `git show --stat ${hash}`,
        { encoding: 'utf-8', cwd: process.cwd() }
      ).trim();

      // Parse the summary line (last line of git show --stat)
      const statLines = statOutput.split('\n');
      const summaryLine = statLines[statLines.length - 1];
      const statMatch = summaryLine.match(/(\d+)\s+files?\s+changed,\s+(\d+)\s+insertions?\([+]\),\s+(\d+)\s+deletions?\(-\)/);
      
      let additions = 0;
      let deletions = 0;
      if (statMatch) {
        additions = parseInt(statMatch[2]) || 0;
        deletions = parseInt(statMatch[3]) || 0;
      }

      // Get file list with status (M, A, D)
      let fileList: string[] = [];
      try {
        const nameStatus = execSync(
          `git diff --name-status ${hash}^..${hash} 2>/dev/null`,
          { encoding: 'utf-8', cwd: process.cwd() }
        ).trim();
        
        if (nameStatus) {
          fileList = nameStatus.split('\n').map(line => {
            const parts = line.split('\t');
            return parts.length > 1 ? parts[1] : parts[0].replace(/^[AMD]\s+/, '').trim();
          }).filter(f => f);
        }
      } catch (e) {
        // Fallback: try git show --name-status
        try {
          const nameStatus = execSync(
            `git show --name-status ${hash} | grep -E "^[AMD]"`,
            { encoding: 'utf-8', cwd: process.cwd() }
          ).trim();
          
          if (nameStatus) {
            fileList = nameStatus.split('\n').map(line => {
              const parts = line.split('\t');
              return parts.length > 1 ? parts[1] : parts[0].replace(/^[AMD]\s+/, '').trim();
            }).filter(f => f);
          }
        } catch (e2) {
          console.warn('⚠️ Could not get file list with status');
        }
      }

      return {
        files: fileList,
        additions,
        deletions,
        commitHash: hash,
        author,
        date,
        message
      };
    } catch (error) {
      console.error('❌ Error getting git changes:', error);
      return null;
    }
  }

  /**
   * Generate mindmap in ASCII format
   */
  generateMindmap(changes: ChangeInfo): string {
    const categories = this.categorizeFiles(changes.files);
    
    let mindmap = '🚀 New Weekly Analysis Release\n';
    mindmap += '│\n';
    
    // Core Features branch
    mindmap += '├── 📊 Core Features\n';
    if (categories.core.length > 0) {
      const coreFiles = categories.core.slice(0, 4);
      coreFiles.forEach((file, idx) => {
        const isLast = idx === coreFiles.length - 1 && categories.test.length === 0 && categories.other.length === 0;
        const prefix = isLast ? '│   └──' : '│   ├──';
        const name = file.split('/').pop() || file;
        const shortName = name.length > 30 ? name.substring(0, 27) + '...' : name;
        mindmap += `${prefix} ${shortName}\n`;
      });
    } else {
      mindmap += '│   └── (none)\n';
    }
    
    // Testing branch
    if (categories.test.length > 0) {
      mindmap += '│\n';
      mindmap += '├── 🧪 Testing\n';
      const testFiles = categories.test.slice(0, 4);
      testFiles.forEach((file, idx) => {
        const isLast = idx === testFiles.length - 1 && categories.other.length === 0;
        const prefix = isLast ? '│   └──' : '│   ├──';
        const name = file.split('/').pop() || file;
        const shortName = name.length > 30 ? name.substring(0, 27) + '...' : name;
        mindmap += `${prefix} ${shortName}\n`;
      });
    }
    
    // Stats branch
    mindmap += '│\n';
    mindmap += '└── 📈 Statistics\n';
    mindmap += `    ├── +${changes.additions} lines added\n`;
    mindmap += `    ├── -${changes.deletions} lines deleted\n`;
    mindmap += `    └── ${changes.files.length} files changed\n`;
    
    return mindmap;
  }

  /**
   * Categorize files by type
   */
  private categorizeFiles(files: string[]): { core: string[]; test: string[]; other: string[] } {
    const categories = { core: [] as string[], test: [] as string[], other: [] as string[] };
    
    files.forEach(file => {
      if (file.includes('test') || file.includes('Test')) {
        categories.test.push(file);
      } else if (file.includes('src/') && !file.includes('test')) {
        categories.core.push(file);
      } else {
        categories.other.push(file);
      }
    });
    
    return categories;
  }

  /**
   * Format changes in Notion style
   */
  formatNotionStyleReport(changes: ChangeInfo): string {
    const date = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const categories = this.categorizeFiles(changes.files);
    
    let report = `🧭 **Release Report — ${date}**\n\n`;
    
    report += `## 📝 Overview\n\n`;
    report += `• **Commit:** \`${changes.commitHash}\`\n`;
    report += `• **Author:** ${changes.author}\n`;
    report += `• **Message:** ${changes.message}\n\n`;
    
    report += `### 📊 Changes Summary\n\n`;
    report += `• **Files Changed:** ${changes.files.length}\n`;
    report += `• **Additions:** \`+${changes.additions}\` lines\n`;
    report += `• **Deletions:** \`-${changes.deletions}\` lines\n`;
    report += `• **Net Change:** \`${changes.additions - changes.deletions > 0 ? '+' : ''}${changes.additions - changes.deletions}\` lines\n\n`;
    
    report += `## 🎯 What Changed\n\n`;
    
    if (categories.core.length > 0) {
      report += `### 🔧 Core Features\n\n`;
      categories.core.forEach(file => {
        const fileName = file.split('/').pop() || file;
        const status = file.includes('accountability_money_agent') ? '🔄 Enhanced' :
                      file.includes('report-formatter') ? '✨ Improved' :
                      file.includes('admin-commands') ? '⚡ Extended' : 
                      file.includes('bot.ts') ? '🔗 Integrated' : '📝 Updated';
        report += `• ${status} \`${fileName}\`\n`;
      });
      report += `\n`;
    }
    
    if (categories.test.length > 0) {
      report += `### 🧪 Testing\n\n`;
      categories.test.forEach(file => {
        const fileName = file.split('/').pop() || file;
        if (file.includes('test-weekly-report')) {
          report += `• ➕ Added \`${fileName}\` - Weekly accountability report testing utility\n`;
        } else if (file.includes('test-reflection-save')) {
          report += `• ➖ Removed \`${fileName}\` - Replaced with new weekly report test\n`;
        } else {
          report += `• ${file.startsWith('D') ? '➖ Removed' : '➕ Added'} \`${fileName}\`\n`;
        }
      });
      report += `\n`;
    }
    
    report += `## 🔍 Key Improvements\n\n`;
    report += `• **Weekly Analysis System:** Enhanced accountability money agent with improved reporting capabilities\n`;
    report += `• **Report Formatting:** Refined accountability report formatter for better presentation\n`;
    report += `• **Admin Tools:** Extended admin commands with new weekly report functionality\n`;
    report += `• **Testing Infrastructure:** Added comprehensive test script for weekly reports\n\n`;
    
    report += `## 💡 How to Use\n\n`;
    report += `The new weekly analysis feature provides:\n\n`;
    report += `• Enhanced weekly accountability reporting\n`;
    report += `• Improved report formatting and visualization\n`;
    report += `• Manual testing capabilities via \`test-weekly-report.ts\`\n`;
    report += `• Extended admin commands for report management\n\n`;
    
    return report;
  }

  /**
   * Split message for Discord (max 2000 characters per message)
   */
  private splitMessage(content: string, maxLength: number = 1900): string[] {
    if (content.length <= maxLength) {
      return [content];
    }

    const parts: string[] = [];
    const lines = content.split('\n');
    let currentPart = '';

    for (const line of lines) {
      if (currentPart.length + line.length + 1 <= maxLength) {
        currentPart += (currentPart ? '\n' : '') + line;
      } else {
        if (currentPart) parts.push(currentPart);
        currentPart = line;
      }
    }

    if (currentPart) parts.push(currentPart);
    return parts;
  }

  /**
   * Send report to Discord
   */
  async sendToDiscord(report: string, mindmap: string) {
    try {
      const channelId = process.env.DISCORD_NEWFEATURES;
      if (!channelId) {
        throw new Error('DISCORD_NEWFEATURES environment variable is not set');
      }

      if (!process.env.DISCORD_BOT_TOKEN) {
        throw new Error('DISCORD_BOT_TOKEN environment variable is not set');
      }

      await this.client.login(process.env.DISCORD_BOT_TOKEN);
      console.log('✅ Connected to Discord');

      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      // Split report into parts if needed
      const reportParts = this.splitMessage(report, 1900);

      // Send report parts
      for (let i = 0; i < reportParts.length; i++) {
        await channel.send(reportParts[i]);
        if (i < reportParts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit protection
        }
      }

      // Send mindmap separately
      const mindmapMessage = `## 🗺️ Release Mindmap\n\n\`\`\`\n${mindmap}\n\`\`\``;
      await channel.send(mindmapMessage);

      console.log('✅ Release report sent to Discord');
    } catch (error) {
      console.error('❌ Error sending to Discord:', error);
      throw error;
    } finally {
      this.client.destroy();
    }
  }

  /**
   * Main execution
   */
  async generateAndSend() {
    console.log('📊 Generating Release Report...\n');
    console.log('='.repeat(60));

    const changes = this.getTodaysChanges();
    if (!changes) {
      console.log('⚠️ No changes found for today. Exiting.');
      return;
    }

    console.log(`✅ Found commit: ${changes.commitHash}`);
    console.log(`   Author: ${changes.author}`);
    console.log(`   Message: ${changes.message}`);
    console.log(`   Files: ${changes.files.length}`);
    console.log(`   Changes: +${changes.additions} / -${changes.deletions}\n`);

    console.log('📝 Generating report...');
    const report = this.formatNotionStyleReport(changes);
    
    console.log('🗺️ Generating mindmap...');
    const mindmap = this.generateMindmap(changes);

    console.log('\n📤 Sending to Discord...');
    await this.sendToDiscord(report, mindmap);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Release report generated and sent successfully!');
    console.log('='.repeat(60));
  }
}

// Run the script
const generator = new ReleaseReportGenerator();
generator.generateAndSend()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
