/**
 * Notion Database Property Names
 * 
 * WICHTIG: Diese Namen müssen exakt mit den Notion-Datenbank-Properties übereinstimmen!
 * Trailing spaces sind Teil der Property-Namen in Notion.
 * 
 * Diese Datei zentralisiert alle Property-Namen um:
 * - Konsistenz zu gewährleisten
 * - Tippfehler zu vermeiden
 * - Einfache Wartung zu ermöglichen
 */

export const WEEKS_DB_PROPERTIES = {
  USER: 'User',
  WEEK_NUM: 'Week Num',
  START_DATE: 'Start Date',
  SUMMARY: 'Summary',
  SCORE: 'Score',
  DISCORD_ID: 'Discord ID ', // Trailing space!
  REFLECTION_RESPONSES: 'Reflection Responses',
  REFLECTION_COMPLETED: 'Reflection Completed ', // Trailing space!
  REFLECTION_DATE: 'Reflection Date'
} as const;

export const USERS_DB_PROPERTIES = {
  DISCORD_ID: 'DiscordID',
  NAME: 'Name',
  TIMEZONE: 'Timezone',
  BEST_TIME: 'Best Time',
  TRUST_COUNT: 'Trust Count',
  STATUS: 'Status',
  PERSONAL_CHANNEL_ID: 'Personal Channel ID',
  PAUSE_REASON: 'Pause Reason',
  PAUSE_DURATION: 'Pause Duration',
  BUDDY: 'buddy',
  BUDDY_START: 'BuddyStart',
  BATCH: 'batch',
  NICKNAME: 'nickname'
} as const;
