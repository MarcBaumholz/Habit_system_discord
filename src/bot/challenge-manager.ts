import { Challenge } from '../types/index.js';

/**
 * ChallengeManager
 *
 * Manages the 20 pre-defined weekly challenges.
 * Loads challenge definitions and provides rotation logic.
 */
export class ChallengeManager {
  private challenges: Challenge[];

  constructor() {
    this.challenges = this.loadChallenges();
  }

  /**
   * Load all 20 challenges
   * Hardcoded from challenges/weekly-challenges.md for reliability
   */
  private loadChallenges(): Challenge[] {
    return [
      {
        id: 1,
        name: 'Deep Work Sessions',
        description: 'Engage in distraction-free, cognitively demanding work for extended periods. Deep work is the ability to focus without distraction on a cognitively demanding task, producing high-quality output in less time.',
        dailyRequirement: '90 minutes of uninterrupted deep work',
        minimalDose: '60 minutes',
        daysRequired: 5,
        category: 'Productivity',
        source: 'Cal Newport (Author, Computer Science Professor)',
        link: 'https://www.calnewport.com/books/deep-work/'
      },
      {
        id: 2,
        name: 'Morning Pages Journaling',
        description: 'Write three pages of longhand, stream-of-consciousness writing first thing in the morning. This practice clears mental clutter and enhances creativity.',
        dailyRequirement: '3 pages (750 words) of morning journaling',
        minimalDose: '2 pages (500 words)',
        daysRequired: 7,
        category: 'Life Improvement',
        source: 'Julia Cameron (Author, "The Artist\'s Way")',
        link: 'https://juliacameronlive.com/basic-tools/morning-pages/'
      },
      {
        id: 3,
        name: 'Cold Exposure Therapy',
        description: 'Deliberate cold exposure through cold showers or ice baths. Increases metabolic rate, improves mood, and builds mental resilience.',
        dailyRequirement: '3 minutes of cold shower or 2 minutes ice bath',
        minimalDose: '2 minutes cold shower',
        daysRequired: 5,
        category: 'Biohacking',
        source: 'Wim Hof (Extreme Athlete, "The Iceman")',
        link: 'https://www.wimhofmethod.com/cold-therapy'
      },
      {
        id: 4,
        name: 'Reading Sprint',
        description: 'Consistent daily reading to build knowledge and expand perspectives. Warren Buffett reads 500 pages per day, but starting smaller builds the habit.',
        dailyRequirement: '30 pages of a non-fiction book',
        minimalDose: '20 pages',
        daysRequired: 6,
        category: 'CEO',
        source: 'Warren Buffett (CEO, Berkshire Hathaway)',
        link: 'https://fs.blog/warren-buffett-reading/'
      },
      {
        id: 5,
        name: 'Intermittent Fasting (16:8)',
        description: 'Fast for 16 hours, eat within an 8-hour window. Supports metabolic health, cellular repair, and mental clarity.',
        dailyRequirement: '16-hour fasting window',
        minimalDose: '14-hour fasting window',
        daysRequired: 6,
        category: 'Biohacking',
        source: 'Dr. Satchin Panda (Circadian Biology Researcher)',
        link: 'https://www.salk.edu/scientist/satchidananda-panda/'
      },
      {
        id: 6,
        name: '5 AM Club',
        description: 'Wake up at 5 AM to own your morning and start the day with intention. Use the first hour for exercise, reflection, and learning.',
        dailyRequirement: 'Wake up at 5:00 AM, complete 20-20-20 formula (20 min exercise, 20 min reflection, 20 min learning)',
        minimalDose: 'Wake up by 5:30 AM, 15 min each activity',
        daysRequired: 5,
        category: 'CEO',
        source: 'Robin Sharma (Leadership Expert, "The 5 AM Club")',
        link: 'https://www.robinsharma.com/book/the-5am-club'
      },
      {
        id: 7,
        name: 'Mindfulness Meditation',
        description: 'Daily meditation practice to reduce stress, improve focus, and increase emotional regulation. Used by top performers across industries.',
        dailyRequirement: '20 minutes of meditation',
        minimalDose: '10 minutes',
        daysRequired: 7,
        category: 'Life Improvement',
        source: 'Ray Dalio (Founder, Bridgewater Associates)',
        link: 'https://www.headspace.com/'
      },
      {
        id: 8,
        name: 'High-Intensity Interval Training (HIIT)',
        description: 'Short bursts of intense exercise followed by rest periods. Maximizes fitness gains in minimal time, boosts metabolism, and improves cardiovascular health.',
        dailyRequirement: '20 minutes HIIT workout',
        minimalDose: '15 minutes',
        daysRequired: 5,
        category: 'Health',
        source: 'Dr. Peter Attia (Longevity Expert)',
        link: 'https://peterattiamd.com/'
      },
      {
        id: 9,
        name: 'Digital Detox Evening',
        description: 'Eliminate all screens (phone, computer, TV) 2 hours before bed to improve sleep quality and reduce blue light exposure.',
        dailyRequirement: 'No screens from 8 PM until sleep',
        minimalDose: 'No screens 1 hour before bed',
        daysRequired: 6,
        category: 'Biohacking',
        source: 'Dr. Andrew Huberman (Neuroscientist, Stanford)',
        link: 'https://hubermanlab.com/'
      },
      {
        id: 10,
        name: 'Gratitude Practice',
        description: 'Write down three things you\'re grateful for each day. Scientifically proven to increase happiness and reduce depression.',
        dailyRequirement: 'Write 3 gratitudes with details (why you\'re grateful)',
        minimalDose: 'List 3 gratitudes',
        daysRequired: 7,
        category: 'Life Improvement',
        source: 'Tony Robbins (Peak Performance Coach)',
        link: 'https://www.tonyrobbins.com/'
      },
      {
        id: 11,
        name: 'Zone 2 Cardio',
        description: 'Low-intensity aerobic exercise where you can still hold a conversation. Builds mitochondrial health and endurance base.',
        dailyRequirement: '45 minutes of Zone 2 cardio (conversational pace)',
        minimalDose: '30 minutes',
        daysRequired: 5,
        category: 'Health',
        source: 'Dr. Peter Attia (Longevity Expert)',
        link: 'https://peterattiamd.com/zone-2-training/'
      },
      {
        id: 12,
        name: 'Creative Hour',
        description: 'Dedicate one hour daily to creative work without judgment or outcome attachment. Build creative muscle and discover new ideas.',
        dailyRequirement: '60 minutes of creative activity (writing, art, music, design)',
        minimalDose: '30 minutes',
        daysRequired: 6,
        category: 'Productivity',
        source: 'James Clear (Author, "Atomic Habits")',
        link: 'https://jamesclear.com/'
      },
      {
        id: 13,
        name: 'Protein Optimization',
        description: 'Consume adequate protein (1g per lb bodyweight) to support muscle maintenance, satiety, and metabolic health.',
        dailyRequirement: '150g+ protein spread across meals',
        minimalDose: '120g protein',
        daysRequired: 7,
        category: 'Biohacking',
        source: 'Dr. Gabrielle Lyon (Muscle-Centric Medicine)',
        link: 'https://drgabriellelyon.com/'
      },
      {
        id: 14,
        name: 'No Alcohol Week',
        description: 'Eliminate all alcohol consumption to improve sleep quality, mental clarity, and metabolic health.',
        dailyRequirement: 'Zero alcohol consumption',
        minimalDose: 'Zero alcohol consumption',
        daysRequired: 7,
        category: 'Health',
        source: 'Andrew Huberman (Neuroscientist)',
        link: 'https://hubermanlab.com/alcohol-and-your-health/'
      },
      {
        id: 15,
        name: 'Strategic Thinking Time',
        description: 'Dedicate uninterrupted time to strategic thinking and planning. Separate from execution work to gain clarity on priorities.',
        dailyRequirement: '30 minutes of strategic thinking/planning',
        minimalDose: '20 minutes',
        daysRequired: 5,
        category: 'CEO',
        source: 'Bill Gates (Founder, Microsoft - famous for "Think Weeks")',
        link: 'https://www.gatesnotes.com/'
      },
      {
        id: 16,
        name: 'Breath Work Practice',
        description: 'Structured breathing exercises to reduce stress, improve HRV, and enhance mental clarity. Box breathing or Wim Hof method.',
        dailyRequirement: '15 minutes of breath work',
        minimalDose: '10 minutes',
        daysRequired: 6,
        category: 'Biohacking',
        source: 'Wim Hof & James Nestor (Author, "Breath")',
        link: 'https://www.wimhofmethod.com/breathing-exercises'
      },
      {
        id: 17,
        name: 'Learn Something New',
        description: 'Commit to learning a new skill or subject for 30 minutes daily. Builds neuroplasticity and keeps the mind sharp.',
        dailyRequirement: '30 minutes of deliberate learning (course, book, practice)',
        minimalDose: '20 minutes',
        daysRequired: 6,
        category: 'Life Improvement',
        source: 'Elon Musk (CEO, Tesla/SpaceX - known for rapid learning)',
        link: 'https://www.tesla.com/'
      },
      {
        id: 18,
        name: 'Morning Sunlight Exposure',
        description: 'Get direct sunlight within 30 minutes of waking to optimize circadian rhythm, cortisol timing, and mood.',
        dailyRequirement: '10 minutes of direct morning sunlight (before 9 AM)',
        minimalDose: '5 minutes',
        daysRequired: 7,
        category: 'Biohacking',
        source: 'Dr. Andrew Huberman (Neuroscientist)',
        link: 'https://hubermanlab.com/light-and-health/'
      },
      {
        id: 19,
        name: 'Weekly Planning & Review',
        description: 'Dedicate time each day to plan the next day and review progress. Clarity of action leads to better execution.',
        dailyRequirement: '20 minutes of planning (evening) and 10 minutes review (morning)',
        minimalDose: '15 minutes total planning',
        daysRequired: 6,
        category: 'Productivity',
        source: 'David Allen (Author, "Getting Things Done")',
        link: 'https://gettingthingsdone.com/'
      },
      {
        id: 20,
        name: 'Acts of Kindness',
        description: 'Perform intentional acts of kindness daily. Increases happiness, strengthens relationships, and creates positive momentum.',
        dailyRequirement: 'Perform 2 meaningful acts of kindness and document them',
        minimalDose: '1 act of kindness',
        daysRequired: 7,
        category: 'Life Improvement',
        source: 'Shawn Achor (Positive Psychology Researcher)',
        link: 'https://www.shawnachor.com/'
      }
    ];
  }

  /**
   * Get all 20 challenges
   */
  getAllChallenges(): Challenge[] {
    return this.challenges;
  }

  /**
   * Get challenge by index (0-19)
   */
  getChallengeByIndex(index: number): Challenge | undefined {
    if (index < 0 || index >= this.challenges.length) {
      return undefined;
    }
    return this.challenges[index];
  }

  /**
   * Get challenge by ID (1-20)
   */
  getChallengeById(id: number): Challenge | undefined {
    return this.challenges.find(c => c.id === id);
  }

  /**
   * Get next challenge index (rotates 0→1→2→...→19→0)
   */
  getNextChallengeIndex(currentIndex: number): number {
    return (currentIndex + 1) % this.challenges.length;
  }

  /**
   * Get previous challenge index (rotates backward)
   */
  getPreviousChallengeIndex(currentIndex: number): number {
    return currentIndex === 0 ? this.challenges.length - 1 : currentIndex - 1;
  }

  /**
   * Validate challenge index
   */
  isValidIndex(index: number): boolean {
    return index >= 0 && index < this.challenges.length;
  }

  /**
   * Get total number of challenges
   */
  getTotalChallenges(): number {
    return this.challenges.length;
  }
}
