import { HabitTool, ToolCategory } from '@/types/tools';

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'routine',
    name: 'Routine & Structure',
    description: 'Tools for building consistent daily routines and habits',
    color: 'bg-blue-500',
    icon: 'Calendar',
    emoji: '🧱'
  },
  {
    id: 'focus',
    name: 'Focus & Concentration',
    description: 'Techniques for improving focus and eliminating distractions',
    color: 'bg-purple-500',
    icon: 'Target',
    emoji: '🎯'
  },
  {
    id: 'time',
    name: 'Time Management',
    description: 'Strategies for better time allocation and productivity',
    color: 'bg-green-500',
    icon: 'Clock',
    emoji: '⏱️'
  },
  {
    id: 'motivation',
    name: 'Motivation & Accountability',
    description: 'Methods to maintain motivation and build accountability',
    color: 'bg-orange-500',
    icon: 'Zap',
    emoji: '⚡'
  },
  {
    id: 'environment',
    name: 'Environment & Setup',
    description: 'Creating supportive environments for habit success',
    color: 'bg-teal-500',
    icon: 'Home',
    emoji: '🏠'
  }
];

export const HABIT_TOOLS: HabitTool[] = [
  {
    id: 'habit-stacking',
    name: 'Habit Stacking',
    summary: 'Attach a new habit to an existing automatic routine.',
    description: 'Habit stacking is a powerful technique that leverages your existing habits as anchors for new ones. By linking a new habit to something you already do automatically, you create a natural trigger that makes the new habit easier to remember and maintain.',
    categories: ['routine'],
    keywords: ['stack', 'bundle', 'anchor', 'after', 'before', 'remember', 'forget', 'routine', 'gewohnheit', 'vergesen', 'vergessen', 'morgens', 'abends', 'combining', 'combine', 'merge', 'group', 'kombinieren', 'gruppieren'],
    problemPatterns: [
      'hard to remember', 'forget to do it', 'forget to do my', 'no routine', 'dont remember',
      'vergessen', 'vergesen', 'vergesse', 'routine', 'gewohnheit', 'morgens', 'abends',
      'forget to start', 'hard to remember', 'no routine', 'inconsistent', 'irregular', 'sporadic',
      'combining habits', 'combine habits', 'merge habits', 'group habits', 'habit combination',
      'gewohnheiten kombinieren', 'gewohnheiten gruppieren', 'gewohnheiten zusammenfassen'
    ],
    whenToUse: ['You already have stable daily anchors', 'You forget to start'],
    steps: [
      'Identify a reliable daily anchor (e.g., after brushing teeth).',
      'Define: After [anchor], I will [new habit].',
      'Keep the new habit tiny for 1-2 weeks.',
      'Gradually increase duration/complexity once automatic.'
    ],
    examples: [
      'After I pour my morning coffee, I will do 5 minutes of meditation.',
      'After I put on my running shoes, I will do 10 push-ups.',
      'After I close my laptop at night, I will write in my gratitude journal.'
    ],
    tips: [
      'Choose anchors that happen at the same time every day',
      'Start with the smallest possible version of your new habit',
      'Be specific about the location and timing',
      'Track your success for the first 2-3 weeks'
    ],
    sources: ['https://jamesclear.com/habit-stacking'],
    difficulty: 'Beginner',
    timeToImplement: '5 minutes',
    effectiveness: 5,
    language: 'both',
    icon: 'Layers',
    color: 'bg-blue-500'
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    summary: 'Visual progress tracking to maintain motivation and consistency.',
    description: 'A habit tracker is a simple way to measure whether you did a habit. The most basic format is to get a calendar and cross off each day you stick with your routine. This visual representation of your progress provides powerful motivation to maintain consistency.',
    categories: ['motivation', 'routine'],
    keywords: ['tracker', 'tracking', 'track', 'visual', 'streak', 'progress', 'checklist', 'measure', 'monitor', 'verfolgen', 'messen', 'fortschritt', 'streak'],
    problemPatterns: [
      'tracking habits', 'track habits', 'measuring progress', 'habit monitoring', 'lose motivation', 'forget progress', 'no accountability', 'inconsistent',
      'gewohnheiten verfolgen', 'gewohnheiten messen', 'fortschritt verfolgen', 'fortschritt messen', 'gewohnheiten überwachen',
      'lose motivation', 'forget progress', 'no accountability', 'inconsistent', 'need to track', 'want to measure', 'see progress'
    ],
    whenToUse: ['You need visual motivation', 'You want to see progress', 'You need accountability'],
    steps: [
      'Choose a simple tracking method (app, calendar, journal).',
      'Mark completion immediately after the habit.',
      'Don\'t break the chain - aim for consistency.',
      'Review weekly to celebrate wins.'
    ],
    examples: [
      'Use a simple X on your calendar for each day you complete the habit',
      'Download a habit tracking app like Streaks or Habitica',
      'Create a simple spreadsheet with checkboxes for each day',
      'Use a bullet journal with habit trackers on each page'
    ],
    tips: [
      'Keep it simple - don\'t overcomplicate the tracking',
      'Mark completion immediately after doing the habit',
      'Focus on consistency over perfection',
      'Review your tracker weekly to identify patterns'
    ],
    sources: ['https://jamesclear.com/habit-tracker'],
    difficulty: 'Beginner',
    timeToImplement: '2 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'BarChart3',
    color: 'bg-green-500'
  },
  {
    id: 'advanced-habit-stacking',
    name: 'Advanced Habit Stacking',
    summary: 'Build complex routines by chaining multiple habits together.',
    description: 'Advanced habit stacking takes the basic concept further by creating comprehensive routines that chain multiple habits together. This technique is perfect for building morning or evening routines that include several beneficial habits.',
    categories: ['routine', 'motivation'],
    keywords: ['chain habits', 'routine sequence', 'multiple habits', 'complex routine', 'combining habits', 'combine habits', 'merge habits', 'group habits', 'kombinieren', 'gruppieren', 'verketten'],
    problemPatterns: [
      'combining habits', 'combine habits', 'merge habits', 'group habits', 'habit combination', 'too many habits', 'overwhelming', 'complex routine', 'hard to remember',
      'gewohnheiten kombinieren', 'gewohnheiten gruppieren', 'gewohnheiten zusammenfassen', 'zu viele gewohnheiten', 'kompliziert', 'überwältigend',
      'too many habits', 'overwhelming', 'complex routine', 'hard to remember', 'multiple habits', 'habit sequence'
    ],
    whenToUse: ['You have multiple habits to build', 'You want a comprehensive routine', 'You want to combine habits efficiently'],
    steps: [
      'Start with one anchor habit.',
      'Add one new habit at a time.',
      'Wait 2-3 weeks before adding another.',
      'Keep the sequence simple and logical.'
    ],
    examples: [
      'Morning routine: After I wake up → I will drink water → then meditate for 5 minutes → then do 10 push-ups → then review my goals',
      'Evening routine: After I finish dinner → I will wash dishes → then prepare tomorrow\'s clothes → then write in gratitude journal → then read for 20 minutes'
    ],
    tips: [
      'Start with just 2-3 habits in your stack',
      'Wait until each habit is automatic before adding the next',
      'Keep the total time under 30 minutes initially',
      'Have a backup plan for days when you\'re short on time'
    ],
    sources: ['https://jamesclear.com/habit-stacking'],
    difficulty: 'Intermediate',
    timeToImplement: '15 minutes',
    effectiveness: 5,
    language: 'both',
    icon: 'Workflow',
    color: 'bg-purple-500'
  },
  {
    id: 'time-boxing',
    name: 'Time Boxing',
    summary: 'Block specific time slots to guarantee a start.',
    description: 'Time boxing is a time management technique where you allocate a fixed time period, called a "time box", to each planned activity. This method helps eliminate the "I don\'t have time" excuse by creating dedicated blocks for your habits.',
    categories: ['time', 'focus'],
    keywords: ['time', 'timebox', 'calendar', 'schedule', 'time block', 'time-block', 'zeit', 'keine zeit', 'zeitmangel', 'stress', 'hetze', 'eile'],
    problemPatterns: [
      'no time', 'dont have time', 'keep postponing', 'never start', 'busy day', 'not enough time',
      'keine zeit', 'keine zeit haben', 'zu wenig zeit', 'kein zeit', 'zeitmangel', 'stress', 'hetze', 'eile',
      'no time for', 'too busy', 'overwhelmed', 'never find time', 'time gets away', 'chaotic schedule'
    ],
    whenToUse: ['Your days fill up without progress', 'You need a clear start time', 'You feel overwhelmed by tasks'],
    steps: [
      'Pick a realistic slot (e.g., 20–30 min).',
      'Put it on your calendar with a clear title.',
      'At start time, do the smallest possible action.',
      'Protect the block: silence notifications, close distractions.'
    ],
    examples: [
      'Block 6:30-7:00 AM for morning meditation',
      'Schedule 12:00-12:30 PM for a lunchtime walk',
      'Reserve 8:00-8:30 PM for reading before bed',
      'Set aside 15 minutes after dinner for journaling'
    ],
    tips: [
      'Start with shorter time blocks (15-20 minutes)',
      'Treat these blocks as important appointments',
      'Set reminders 5 minutes before each block starts',
      'If you miss a block, reschedule it immediately'
    ],
    sources: ['https://todoist.com/productivity-methods/time-boxing'],
    difficulty: 'Beginner',
    timeToImplement: '10 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Clock',
    color: 'bg-orange-500'
  },
  {
    id: 'pomodoro-technique',
    name: 'Pomodoro Technique',
    summary: 'Work in focused 25-minute intervals with short breaks.',
    description: 'The Pomodoro Technique is a time management method that breaks work into intervals, traditionally 25 minutes in length, separated by short breaks. This technique helps maintain focus and prevents burnout during habit formation.',
    categories: ['focus', 'time'],
    keywords: ['pomodoro', 'timer', 'intervals', 'breaks', 'concentration', 'fokussieren', 'konzentration', 'ablenkung'],
    problemPatterns: [
      'can\'t focus', 'get distracted', 'lose concentration', 'overwhelmed by tasks', 'distracted', 'interruptions',
      'fokussieren', 'konzentration', 'ablenkung', 'stören', 'unterbrechung', 'fokussiert', 'aufmerksamkeit',
      'can\'t concentrate', 'mind wanders', 'scattered', 'unfocused', 'hard to focus', 'lose focus'
    ],
    whenToUse: ['You need sustained focus', 'Tasks feel overwhelming', 'You get distracted easily'],
    steps: [
      'Set a timer for 25 minutes.',
      'Work on ONE task until timer rings.',
      'Take a 5-minute break.',
      'Repeat 4 times, then take a 15-30 minute break.'
    ],
    examples: [
      'Use Pomodoro for studying: 25 min study → 5 min break → repeat',
      'Apply to writing: 25 min writing → 5 min stretch → repeat',
      'Use for cleaning: 25 min cleaning → 5 min rest → repeat',
      'Apply to exercise: 25 min workout → 5 min cool down → repeat'
    ],
    tips: [
      'Use a physical timer or app like Forest or Be Focused',
      'During breaks, do something completely different',
      'If you get distracted, restart the timer',
      'Adjust the intervals if 25 minutes doesn\'t work for you'
    ],
    sources: ['https://francescocirillo.com/pages/pomodoro-technique'],
    difficulty: 'Beginner',
    timeToImplement: '5 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Timer',
    color: 'bg-red-500'
  }
];
