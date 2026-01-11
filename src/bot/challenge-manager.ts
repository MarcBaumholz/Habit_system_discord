import { Challenge } from '../types/index.js';

/**
 * ChallengeManager
 *
 * Manages the 15 user-generated weekly challenges organized by creator.
 * 3-week rotation: Week 1 (JonesMCL), Week 2 (Marc), Week 3 (JanWilken)
 * Loads challenge definitions and provides rotation logic.
 */
export class ChallengeManager {
  private challenges: Challenge[];

  constructor() {
    this.challenges = this.loadChallenges();
  }

  /**
   * Load all 15 challenges organized by user creator
   * Challenges 1-5: JonesMCL
   * Challenges 6-10: Marc
   * Challenges 11-15: JanWilken
   */
  private loadChallenges(): Challenge[] {
    return [
      // ============================================
      // JONESMCL CHALLENGES (1-5)
      // ============================================
      {
        id: 1,
        name: 'Daily Mobility Stretching',
        description: 'Improve flexibility, reduce muscle tension, and enhance overall mobility through consistent daily stretching. Regular stretching helps prevent injuries and improves range of motion.',
        dailyRequirement: '15 minutes of stretching per day',
        minimalDose: '10 minutes of stretching',
        daysRequired: 6,
        category: 'Health',
        source: 'JonesMCL',
        link: ''
      },
      {
        id: 2,
        name: '10,000 Steps Daily',
        description: 'Achieve 10,000 steps per day to improve cardiovascular health, boost energy levels, and maintain an active lifestyle. Walking is one of the most accessible forms of exercise.',
        dailyRequirement: '10,000 steps per day',
        minimalDose: '7,500 steps per day',
        daysRequired: 6,
        category: 'Health',
        source: 'JonesMCL',
        link: ''
      },
      {
        id: 3,
        name: 'Eat the Frog First',
        description: 'Complete one unpleasant or challenging task first thing each day before moving to easier tasks. This builds discipline, reduces procrastination, and creates momentum for the rest of the day.',
        dailyRequirement: 'Complete 1 unpleasant task first thing in the morning',
        minimalDose: 'Complete 1 unpleasant task before noon',
        daysRequired: 5,
        category: 'Productivity',
        source: 'JonesMCL',
        link: ''
      },
      {
        id: 4,
        name: 'Screen-Free Before Bed',
        description: 'Eliminate all screens 60 minutes before sleep to improve sleep quality, reduce blue light exposure, and allow the mind to wind down naturally. Exception: submitting challenge proof is allowed.',
        dailyRequirement: 'No screens 60 minutes before sleep (exception: proof submission)',
        minimalDose: 'No screens 30 minutes before sleep',
        daysRequired: 6,
        category: 'Biohacking',
        source: 'JonesMCL',
        link: ''
      },
      {
        id: 5,
        name: 'Daily Push-Up Challenge',
        description: 'Complete 50 push-ups per day to build upper body strength, improve core stability, and develop consistent exercise habits. Push-ups can be distributed throughout the day.',
        dailyRequirement: '50 push-ups per day (can be distributed throughout the day)',
        minimalDose: '30 push-ups per day',
        daysRequired: 6,
        category: 'Health',
        source: 'JonesMCL',
        link: ''
      },
      // ============================================
      // MARC CHALLENGES (6-10)
      // ============================================
      {
        id: 6,
        name: 'The Scientist',
        description: 'Read and analyze one scientific paper daily in AI/Tech/Neuroscience or related fields. Document key insights and takeaways to build knowledge and stay current with research.',
        dailyRequirement: 'Read 1 scientific paper (AI/Tech/Neuroscience) and note key insights (minimum: Abstract + Conclusion)',
        minimalDose: 'Read Abstract + Conclusion of 1 scientific paper',
        daysRequired: 5,
        category: 'CEO',
        source: 'Marc',
        link: ''
      },
      {
        id: 7,
        name: 'Sleep Wind-Down Ritual',
        description: 'Create a tech-free evening routine before bed to signal your body for rest. Activities like reading, stretching, or journaling help transition from active day to restful sleep.',
        dailyRequirement: '20-30 minutes of tech-free evening routine (reading, stretching, journaling) before sleep',
        minimalDose: '10 minutes of tech-free evening routine',
        daysRequired: 6,
        category: 'Biohacking',
        source: 'Marc',
        link: ''
      },
      {
        id: 8,
        name: 'Non-Time Stillness',
        description: 'Practice intentional stillness and presence by doing nothing for a set period. This could be window gazing, mindful walking, or simply allowing thoughts to flow without engagement.',
        dailyRequirement: '15 minutes of conscious stillness (window gazing, mindful walking, letting thoughts flow)',
        minimalDose: '5 minutes of conscious stillness',
        daysRequired: 6,
        category: 'Life Improvement',
        source: 'Marc',
        link: ''
      },
      {
        id: 9,
        name: 'The Minimalist Reset',
        description: 'Declutter your physical space daily by removing at least one item. This practice creates mental clarity, reduces decision fatigue, and maintains an organized environment.',
        dailyRequirement: 'Remove at least 1 item per day (discard, donate, or organize) and tidy space',
        minimalDose: 'Remove 1 item per day',
        daysRequired: 6,
        category: 'Life Improvement',
        source: 'Marc',
        link: ''
      },
      {
        id: 10,
        name: 'Vision Manifestation',
        description: 'Visualize your future vision and annual goals daily with closed eyes. This practice strengthens neural pathways, increases motivation, and aligns actions with desired outcomes.',
        dailyRequirement: '10 minutes of future vision and annual goals visualization with closed eyes',
        minimalDose: '5 minutes of visualization',
        daysRequired: 6,
        category: 'CEO',
        source: 'Marc',
        link: ''
      },
      // ============================================
      // JANWILKEN CHALLENGES (11-15)
      // ============================================
      {
        id: 11,
        name: 'Daily Compliments',
        description: 'Give genuine compliments to people in your environment about their clothing, behavior, or positive qualities. This practice strengthens relationships, spreads positivity, and improves social connections.',
        dailyRequirement: 'Give at least 1 genuine compliment to someone in your environment (clothing, behavior, etc.)',
        minimalDose: 'Give 1 compliment per day',
        daysRequired: 6,
        category: 'Life Improvement',
        source: 'JanWilken',
        link: ''
      },
      {
        id: 12,
        name: 'Microdosing Practice',
        description: 'Engage in microdosing with substances like LSD or mushrooms following safe protocols. This practice is reported to enhance creativity, focus, and emotional well-being when done responsibly.',
        dailyRequirement: 'Microdose LSD, mushrooms, or similar (following safe protocols)',
        minimalDose: 'Microdose as per protocol',
        daysRequired: 5,
        category: 'Biohacking',
        source: 'JanWilken',
        link: ''
      },
      {
        id: 13,
        name: 'Approach Strangers',
        description: 'Practice social courage by approaching strangers in everyday situations (street, public transport) and asking for recommendations or engaging in brief, positive interactions.',
        dailyRequirement: 'Approach 1 stranger in daily life (street, public transport) and ask for a recommendation or engage positively',
        minimalDose: 'Approach 1 stranger per day',
        daysRequired: 5,
        category: 'Life Improvement',
        source: 'JanWilken',
        link: ''
      },
      {
        id: 14,
        name: 'Mindfulness Labelling',
        description: 'Practice present-moment awareness by mentally labeling your actions as you perform them. For example, while walking, think "walking, walking, walking" or "step, step, step" to stay fully present.',
        dailyRequirement: 'Practice mindfulness labeling during daily activities (e.g., "walking, walking" while walking, "brushing, brushing" while brushing teeth)',
        minimalDose: 'Label 1 activity per day mindfully',
        daysRequired: 6,
        category: 'Life Improvement',
        source: 'JanWilken',
        link: ''
      },
      {
        id: 15,
        name: 'Zero Added Sugar',
        description: 'Eliminate all added sugars from your diet to improve metabolic health, reduce inflammation, stabilize energy levels, and break sugar dependency patterns.',
        dailyRequirement: 'Zero added sugar consumption',
        minimalDose: 'Zero added sugar consumption',
        daysRequired: 7,
        category: 'Health',
        source: 'JanWilken',
        link: ''
      }
    ];
  }

  /**
   * Get all 15 challenges
   */
  getAllChallenges(): Challenge[] {
    return this.challenges;
  }

  /**
   * Get challenge by index (0-14)
   */
  getChallengeByIndex(index: number): Challenge | undefined {
    if (index < 0 || index >= this.challenges.length) {
      return undefined;
    }
    return this.challenges[index];
  }

  /**
   * Get challenge by ID (1-15)
   */
  getChallengeById(id: number): Challenge | undefined {
    return this.challenges.find(c => c.id === id);
  }

  /**
   * Get challenges by user creator
   * @param user 'JonesMCL' | 'Marc' | 'JanWilken'
   */
  getChallengesByUser(user: 'JonesMCL' | 'Marc' | 'JanWilken'): Challenge[] {
    return this.challenges.filter(c => c.source === user);
  }

  /**
   * Get challenge indices for a specific user (for 3-week rotation)
   * @param user 'JonesMCL' | 'Marc' | 'JanWilken'
   * @returns Array of challenge indices (0-14)
   */
  getChallengeIndicesByUser(user: 'JonesMCL' | 'Marc' | 'JanWilken'): number[] {
    const userRanges = {
      'JonesMCL': [0, 1, 2, 3, 4],      // IDs 1-5
      'Marc': [5, 6, 7, 8, 9],           // IDs 6-10
      'JanWilken': [10, 11, 12, 13, 14] // IDs 11-15
    };
    return userRanges[user];
  }

  /**
   * Get next challenge index (rotates 0→1→2→...→14→0)
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
