import { HabitTool } from './index';

// Curated initial toolbox — extend freely.
export const DEFAULT_TOOLS: HabitTool[] = [
  {
    id: 'habit-stacking',
    name: 'Habit Stacking',
    summary: 'Attach a new habit to an existing automatic routine.',
    categories: ['routine'],
    keywords: ['stack', 'bundle', 'anchor', 'after', 'before', 'remember', 'forget'],
    problemPatterns: ['hard to remember', 'forget to do it', 'forget to do my', 'no routine', 'dont remember'],
    whenToUse: ['You already have stable daily anchors', 'You forget to start'],
    steps: [
      'Identify a reliable daily anchor (e.g., after brushing teeth).',
      'Define: After [anchor], I will [new habit].',
      'Keep the new habit tiny for 1-2 weeks.',
      'Gradually increase duration/complexity once automatic.'
    ],
    sources: ['https://jamesclear.com/habit-stacking']
  },
  {
    id: 'time-boxing',
    name: 'Time Boxing',
    summary: 'Block specific time slots to guarantee a start.',
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
    sources: ['https://todoist.com/productivity-methods/time-boxing']
  },
  {
    id: 'deep-work',
    name: 'Deep Work Sprint',
    summary: 'Short, focused sessions with no distractions.',
    categories: ['focus'],
    keywords: ['deep work', 'focus', 'distraction', 'concentration', 'fokussieren', 'konzentration', 'ablenkung', 'stören'],
    problemPatterns: ['distracted', 'can’t focus', 'interruptions'],
    whenToUse: ['You need concentration', 'Environment is noisy'],
    steps: [
      'Choose a short sprint (25–45 min).',
      'Close all apps/tabs not needed; phone in another room.',
      'Define one specific outcome for the sprint.',
      'Take a short break (5–10 min), then repeat if needed.'
    ],
    sources: ['https://www.calnewport.com/books/deep-work/']
  },
  {
    id: 'temptation-bundling',
    name: 'Temptation Bundling',
    summary: 'Pair a desired habit with something you crave.',
    categories: ['motivation'],
    keywords: ['bundle', 'reward', 'temptation'],
    problemPatterns: ['low motivation', 'boring habit'],
    whenToUse: ['You procrastinate because it’s not fun'],
    steps: [
      'List activities you enjoy (podcast, playlist, show).',
      'Allow them only while doing the habit.',
      'Prepare everything in advance to reduce friction.'
    ],
    sources: ['https://jamesclear.com/temptation-bundling']
  },
  {
    id: 'implementation-intentions',
    name: 'Implementation Intentions',
    summary: 'Create if-then plans to handle obstacles.',
    categories: ['routine', 'motivation'],
    keywords: ['if-then', 'plan', 'intention'],
    problemPatterns: ['get derailed', 'unexpected obstacles'],
    whenToUse: ['You know specific common blockers'],
    steps: [
      'Identify a likely obstacle (e.g., arrive home tired).',
      'Plan: If [obstacle], then I will [tiny recovery action].',
      'Practice the plan mentally 1–2 times.'
    ],
    sources: ['https://jamesclear.com/implementation-intentions']
  },
  {
    id: 'habit-bundles',
    name: 'Habit Bundles',
    summary: 'Group small actions into a single routine packet.',
    categories: ['routine'],
    keywords: ['bundle', 'sequence'],
    problemPatterns: ['too many steps', 'overwhelmed'],
    whenToUse: ['You want to chain 2–3 mini-habits'],
    steps: [
      'Write a short checklist (e.g., fill bottle → warmup → start).',
      'Execute the bundle at one anchor time/place.',
      'Keep total time under 10–15 min initially.'
    ],
    sources: []
  },

  // Focus & Concentration Tools
  {
    id: 'pomodoro-technique',
    name: 'Pomodoro Technique',
    summary: 'Work in focused 25-minute intervals with short breaks.',
    categories: ['focus', 'time'],
    keywords: ['pomodoro', 'timer', 'intervals', 'breaks', 'concentration'],
    problemPatterns: ['can\'t focus', 'get distracted', 'lose concentration', 'overwhelmed by tasks'],
    whenToUse: ['You need sustained focus', 'Tasks feel overwhelming', 'You get distracted easily'],
    steps: [
      'Set a timer for 25 minutes.',
      'Work on ONE task until timer rings.',
      'Take a 5-minute break.',
      'Repeat 4 times, then take a 15-30 minute break.'
    ],
    sources: ['https://francescocirillo.com/pages/pomodoro-technique']
  },

  {
    id: 'environment-design',
    name: 'Environment Design',
    summary: 'Shape your surroundings to make good habits easier and bad ones harder.',
    categories: ['environment', 'routine'],
    keywords: ['environment', 'setup', 'preparation', 'make it easy'],
    problemPatterns: ['forget to start', 'hard to begin', 'need reminders', 'environment not supportive'],
    whenToUse: ['You want to reduce friction for good habits', 'Your environment fights against you'],
    steps: [
      'Identify what you need for the habit.',
      'Place items in obvious, convenient locations.',
      'Remove obstacles and distractions.',
      'Make the first step impossible to miss.'
    ],
    sources: ['https://jamesclear.com/environment-design']
  },

  {
    id: 'two-minute-rule',
    name: 'Two-Minute Rule',
    summary: 'Start any habit by committing to just two minutes.',
    categories: ['motivation', 'routine'],
    keywords: ['two minute', 'just start', 'small start', 'overcome resistance'],
    problemPatterns: ['hard to start', 'procrastinate', 'feel overwhelmed', 'too big'],
    whenToUse: ['You procrastinate on starting', 'Habits feel too big'],
    steps: [
      'Commit to just 2 minutes of the habit.',
      'Set a timer and start.',
      'You can stop after 2 minutes if you want.',
      'Most times, you\'ll continue past 2 minutes.'
    ],
    sources: ['https://jamesclear.com/how-to-stop-procrastinating']
  },

  // Time Management Tools
  {
    id: 'time-blocking',
    name: 'Time Blocking',
    summary: 'Schedule specific blocks of time for different activities.',
    categories: ['time', 'focus'],
    keywords: ['time block', 'schedule', 'calendar', 'planning'],
    problemPatterns: ['no structure', 'time gets away', 'unproductive', 'scattered'],
    whenToUse: ['Your days lack structure', 'Time disappears without progress'],
    steps: [
      'Divide your day into themed blocks.',
      'Assign specific activities to each block.',
      'Protect blocks from interruptions.',
      'Review and adjust weekly.'
    ],
    sources: ['https://calendar.com/blog/time-blocking/']
  },

  {
    id: 'morning-routine',
    name: 'Morning Routine',
    summary: 'Create a consistent start to your day that sets you up for success.',
    categories: ['routine', 'motivation'],
    keywords: ['morning', 'routine', 'start day', 'win the morning'],
    problemPatterns: ['chaotic mornings', 'start day wrong', 'no energy', 'unproductive mornings'],
    whenToUse: ['Your mornings are chaotic', 'You want to start the day right'],
    steps: [
      'Design a 15-30 minute routine.',
      'Include 2-3 energizing activities.',
      'Do it at the same time daily.',
      'Keep it simple and achievable.'
    ],
    sources: ['https://www.inc.com/melanie-curtin/the-5-minute-morning-routine-that-will-change-your-life.html']
  },

  {
    id: 'evening-routine',
    name: 'Evening Routine',
    summary: 'Wind down with a consistent evening routine for better sleep and preparation.',
    categories: ['routine', 'environment'],
    keywords: ['evening', 'wind down', 'prepare tomorrow', 'better sleep'],
    problemPatterns: ['can\'t sleep', 'chaotic evenings', 'unprepared for tomorrow', 'stress at night'],
    whenToUse: ['You have trouble sleeping', 'Evenings feel chaotic'],
    steps: [
      'Create a 30-60 minute wind-down routine.',
      'Include preparation for tomorrow.',
      'Avoid screens 1 hour before bed.',
      'Make it relaxing and consistent.'
    ],
    sources: ['https://www.sleepfoundation.org/sleep-hygiene/healthy-sleep-tips']
  },

  // Motivation & Accountability Tools
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    summary: 'Visual progress tracking to maintain motivation and consistency.',
    categories: ['motivation', 'routine'],
    keywords: ['tracker', 'visual', 'streak', 'progress', 'checklist'],
    problemPatterns: ['lose motivation', 'forget progress', 'no accountability', 'inconsistent'],
    whenToUse: ['You need visual motivation', 'You want to see progress'],
    steps: [
      'Choose a simple tracking method (app, calendar, journal).',
      'Mark completion immediately after the habit.',
      'Don\'t break the chain - aim for consistency.',
      'Review weekly to celebrate wins.'
    ],
    sources: ['https://jamesclear.com/habit-tracker']
  },

  {
    id: 'accountability-partner',
    name: 'Accountability Partner',
    summary: 'Partner with someone to check in and support each other\'s habits.',
    categories: ['motivation', 'environment'],
    keywords: ['accountability', 'partner', 'support', 'check in', 'buddy'],
    problemPatterns: ['no support', 'easy to quit', 'isolated', 'need encouragement'],
    whenToUse: ['You work better with others', 'You need external motivation'],
    steps: [
      'Find someone with similar goals.',
      'Set regular check-in times.',
      'Share specific commitments.',
      'Celebrate wins together.'
    ],
    sources: ['https://www.psychologytoday.com/us/blog/tech-happy-life/201204/accountability-partners']
  },

  {
    id: 'reward-system',
    name: 'Reward System',
    summary: 'Create meaningful rewards for habit completion to reinforce behavior.',
    categories: ['motivation'],
    keywords: ['reward', 'celebration', 'incentive', 'motivation'],
    problemPatterns: ['no motivation', 'boring habit', 'need incentive', 'hard to stick with'],
    whenToUse: ['Habits feel boring or unrewarding', 'You need extra motivation'],
    steps: [
      'Define meaningful rewards for you.',
      'Link rewards to habit completion.',
      'Vary rewards to maintain interest.',
      'Make rewards immediate when possible.'
    ],
    sources: ['https://www.verywellmind.com/how-to-use-rewards-to-motivate-yourself-2795385']
  },

  // Environment & Setup Tools
  {
    id: 'preparation-ritual',
    name: 'Preparation Ritual',
    summary: 'Set up everything you need the night before to reduce morning friction.',
    categories: ['environment', 'routine'],
    keywords: ['prepare', 'setup', 'night before', 'reduce friction'],
    problemPatterns: ['morning chaos', 'forget things', 'hard to start', 'unprepared'],
    whenToUse: ['Mornings are rushed', 'You forget necessary items'],
    steps: [
      'List everything needed for tomorrow.',
      'Set out clothes, equipment, materials.',
      'Prepare meals or ingredients.',
      'Create a simple checklist.'
    ],
    sources: ['https://www.fastcompany.com/3067079/why-successful-people-prepare-the-night-before']
  },

  {
    id: 'digital-minimalism',
    name: 'Digital Minimalism',
    summary: 'Reduce digital distractions to focus on what matters most.',
    categories: ['environment', 'focus'],
    keywords: ['digital detox', 'reduce distractions', 'focus', 'technology', 'phone', 'digital'],
    problemPatterns: ['too many notifications', 'phone addiction', 'distracted by apps', 'waste time online', 'distracted by my phone', 'phone distractions'],
    whenToUse: ['Digital distractions interfere with habits', 'You\'re addicted to devices'],
    steps: [
      'Audit your digital usage for 1 week.',
      'Remove non-essential apps and accounts.',
      'Turn off non-critical notifications.',
      'Create phone-free zones and times.'
    ],
    sources: ['https://www.calnewport.com/books/digital-minimalism/']
  },

  {
    id: 'dedicated-space',
    name: 'Dedicated Space',
    summary: 'Create a specific, dedicated space for your habit to improve consistency.',
    categories: ['environment', 'routine'],
    keywords: ['dedicated space', 'habit corner', 'specific place', 'environment'],
    problemPatterns: ['no good place', 'space not suitable', 'inconsistent location', 'environment fights habit'],
    whenToUse: ['Your environment doesn\'t support the habit', 'You need a consistent location'],
    steps: [
      'Choose a specific space for the habit.',
      'Make it comfortable and functional.',
      'Remove distractions from the space.',
      'Use the space only for this habit.'
    ],
    sources: ['https://jamesclear.com/environment-design']
  },

  // Energy & Motivation Tools
  {
    id: 'energy-management',
    name: 'Energy Management',
    summary: 'Schedule habits when your energy levels are highest.',
    categories: ['motivation', 'time'],
    keywords: ['energy', 'peak hours', 'optimal time', 'when you feel best'],
    problemPatterns: ['low energy', 'wrong timing', 'feel sluggish', 'not motivated'],
    whenToUse: ['You have low energy for habits', 'Timing doesn\'t work'],
    steps: [
      'Track your energy levels for 1 week.',
      'Identify your peak energy times.',
      'Schedule challenging habits during peaks.',
      'Use low-energy times for easy habits.'
    ],
    sources: ['https://hbr.org/2007/10/manage-your-energy-not-your-time']
  },

  {
    id: 'micro-habits',
    name: 'Micro-Habits',
    summary: 'Start with ridiculously small habits that are impossible to fail.',
    categories: ['motivation', 'routine'],
    keywords: ['micro', 'tiny', 'small', 'impossible to fail', 'start small'],
    problemPatterns: ['too ambitious', 'overwhelm', 'hard to start', 'fail quickly'],
    whenToUse: ['You\'re overwhelmed by the habit', 'You keep failing to start'],
    steps: [
      'Make the habit so small it\'s laughable.',
      'Focus on consistency, not intensity.',
      'Gradually increase after 2-4 weeks.',
      'Celebrate every completion.'
    ],
    sources: ['https://jamesclear.com/atomic-habits']
  },

  {
    id: 'identity-based-habits',
    name: 'Identity-Based Habits',
    summary: 'Build habits around the person you want to become, not just outcomes.',
    categories: ['motivation'],
    keywords: ['identity', 'who you want to be', 'person you become', 'self-image', 'become', 'different person'],
    problemPatterns: ['focus on outcome', 'lose motivation', 'not sustainable', 'external motivation', 'want to become', 'become a different'],
    whenToUse: ['You focus too much on results', 'Habits don\'t feel meaningful'],
    steps: [
      'Decide who you want to become.',
      'Ask: "What would this person do daily?"',
      'Focus on being that person.',
      'Let outcomes follow naturally.'
    ],
    sources: ['https://jamesclear.com/identity-based-habits']
  },

  // Overcoming Obstacles Tools
  {
    id: 'obstacle-mapping',
    name: 'Obstacle Mapping',
    summary: 'Identify and plan for potential obstacles before they derail you.',
    categories: ['motivation', 'routine'],
    keywords: ['obstacles', 'barriers', 'plan ahead', 'anticipate problems', 'plan for obstacles'],
    problemPatterns: ['get derailed', 'unexpected problems', 'obstacles stop you', 'no backup plan', 'need to plan for obstacles', 'plan for obstacles'],
    whenToUse: ['You frequently get derailed', 'Obstacles surprise you'],
    steps: [
      'List all possible obstacles.',
      'Create specific if-then plans for each.',
      'Practice your responses mentally.',
      'Adjust plans based on experience.'
    ],
    sources: ['https://jamesclear.com/implementation-intentions']
  },

  {
    id: 'habit-replacement',
    name: 'Habit Replacement',
    summary: 'Replace a bad habit with a good one using the same cue and reward.',
    categories: ['routine', 'motivation'],
    keywords: ['replace', 'substitute', 'swap', 'change habit', 'bad habit'],
    problemPatterns: ['bad habit', 'unwanted behavior', 'hard to stop', 'automatic response'],
    whenToUse: ['You have a bad habit to break', 'You want to replace unwanted behavior'],
    steps: [
      'Identify the cue, routine, and reward.',
      'Keep the same cue and reward.',
      'Change only the routine.',
      'Practice the new routine consistently.'
    ],
    sources: ['https://charlesduhigg.com/the-power-of-habit/']
  },

  {
    id: 'streak-protection',
    name: 'Streak Protection',
    summary: 'Strategies to maintain your streak even on difficult days.',
    categories: ['motivation', 'routine'],
    keywords: ['streak', 'don\'t break chain', 'maintain consistency', 'bad days', 'protect my streak'],
    problemPatterns: ['break streak', 'bad days', 'lose momentum', 'start over', 'breaking my habit streak', 'protect my streak'],
    whenToUse: ['You have a good streak going', 'Bad days threaten consistency'],
    steps: [
      'Define your minimum viable habit.',
      'Use it on tough days.',
      'Never miss twice in a row.',
      'Celebrate streak milestones.'
    ],
    sources: ['https://jamesclear.com/never-miss-twice']
  },

  // Advanced Tools
  {
    id: 'habit-stacking-advanced',
    name: 'Advanced Habit Stacking',
    summary: 'Build complex routines by chaining multiple habits together.',
    categories: ['routine', 'motivation'],
    keywords: ['chain habits', 'routine sequence', 'multiple habits', 'complex routine'],
    problemPatterns: ['too many habits', 'overwhelming', 'complex routine', 'hard to remember'],
    whenToUse: ['You have multiple habits to build', 'You want a comprehensive routine'],
    steps: [
      'Start with one anchor habit.',
      'Add one new habit at a time.',
      'Wait 2-3 weeks before adding another.',
      'Keep the sequence simple and logical.'
    ],
    sources: ['https://jamesclear.com/habit-stacking']
  },

  {
    id: 'environmental-triggers',
    name: 'Environmental Triggers',
    summary: 'Use visual and physical cues in your environment to trigger habits.',
    categories: ['environment', 'routine'],
    keywords: ['triggers', 'cues', 'visual reminders', 'environmental signals'],
    problemPatterns: ['forget to start', 'no reminders', 'inconsistent triggers', 'environment doesn\'t help'],
    whenToUse: ['You forget to start habits', 'You need stronger cues'],
    steps: [
      'Choose obvious visual triggers.',
      'Place them where you can\'t miss them.',
      'Make triggers specific to the habit.',
      'Change triggers if they stop working.'
    ],
    sources: ['https://jamesclear.com/environment-design']
  },

  {
    id: 'social-contract',
    name: 'Social Contract',
    summary: 'Make a public commitment to your habit to increase accountability.',
    categories: ['motivation', 'environment'],
    keywords: ['public commitment', 'social pressure', 'announce goals', 'accountability'],
    problemPatterns: ['no accountability', 'easy to quit', 'private goals', 'lack motivation'],
    whenToUse: ['You need stronger accountability', 'Private commitments aren\'t enough'],
    steps: [
      'Announce your habit publicly.',
      'Share progress regularly.',
      'Ask for support from others.',
      'Use social pressure positively.'
    ],
    sources: ['https://www.psychologytoday.com/us/blog/tech-happy-life/201204/accountability-partners']
  },
  {
    id: 'five-whys',
    name: '5 Whys Method',
    summary: 'Ask "why" five times to uncover the root cause of habit failures.',
    categories: ['motivation', 'routine'],
    keywords: ['why', 'root cause', '5 whys', 'five whys', 'understand problem', 'deep dive', 'cause analysis', 'warum', 'ursache', 'grundproblem', 'verstehen'],
    problemPatterns: [
      'dont know why', 'not sure why', 'keep failing', 'dont understand', 'same problem keeps happening', 'recurring issues',
      'warum', 'verstehe nicht', 'immer wieder', 'gleiches problem', 'ursache nicht klar', 'grundproblem',
      'dont know why', 'not sure why', 'keep failing', 'dont understand', 'same problem keeps happening', 'recurring issues', 'need to understand root cause'
    ],
    whenToUse: ['You keep encountering the same obstacles', 'You don\'t understand why habits fail', 'You need to find the root cause'],
    steps: [
      'Start with your habit problem statement (e.g., "I keep skipping my morning workout").',
      'Ask "Why?" and write down the first answer.',
      'Ask "Why?" again about that answer, and continue for 5 iterations.',
      'The 5th answer reveals the root cause.',
      'Address the root cause, not just the symptoms.'
    ],
    sources: ['https://www.lean.org/lexicon-terms/5-whys/']
  }
];


