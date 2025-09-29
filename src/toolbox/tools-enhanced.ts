import { HabitTool } from './index';

// Enhanced toolbox with German language support and more comprehensive matching
export const ENHANCED_TOOLS: HabitTool[] = [
  {
    id: 'habit-stacking',
    name: 'Habit Stacking',
    summary: 'Attach a new habit to an existing automatic routine.',
    categories: ['routine'],
    keywords: ['stack', 'bundle', 'anchor', 'after', 'before', 'remember', 'forget', 'routine', 'gewohnheit', 'vergesen', 'vergessen', 'morgens', 'abends'],
    problemPatterns: [
      'hard to remember', 'forget to do it', 'forget to do my', 'no routine', 'dont remember',
      'vergessen', 'vergesen', 'vergesse', 'routine', 'gewohnheit', 'morgens', 'abends',
      'forget to start', 'hard to remember', 'no routine', 'inconsistent', 'irregular', 'sporadic'
    ],
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
    problemPatterns: [
      'distracted', 'can\'t focus', 'interruptions', 'get distracted', 'lose concentration', 'overwhelmed',
      'ablenkung', 'fokussieren', 'konzentration', 'stören', 'unterbrechung', 'fokussiert', 'aufmerksamkeit',
      'can\'t concentrate', 'mind wanders', 'scattered', 'unfocused', 'hard to focus', 'lose focus'
    ],
    whenToUse: ['You need concentration', 'Environment is noisy', 'You get distracted easily', 'Tasks feel overwhelming'],
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
    keywords: ['bundle', 'reward', 'temptation', 'motivation', 'antrieb', 'lustlos', 'faul', 'träge', 'energielos', 'unmotiviert'],
    problemPatterns: [
      'low motivation', 'boring habit', 'no motivation', 'boring', 'hard to start', 'procrastinate',
      'motivation', 'antrieb', 'lustlos', 'faul', 'träge', 'energielos', 'unmotiviert', 'belohnung', 'anreiz',
      'low motivation', 'boring', 'hard to start', 'procrastinate', 'lazy', 'tired', 'unmotivated', 'no energy'
    ],
    whenToUse: ['You procrastinate because it\'s not fun', 'Habits feel boring or unrewarding', 'You need extra motivation'],
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
    keywords: ['if-then', 'plan', 'intention', 'obstacles', 'barriers', 'plan ahead', 'anticipate problems'],
    problemPatterns: [
      'get derailed', 'unexpected obstacles', 'obstacles stop you', 'no backup plan', 'need to plan for obstacles',
      'hindernisse', 'probleme', 'schwierigkeiten', 'planung', 'vorbereitung', 'obstacles', 'barriers',
      'get derailed', 'unexpected problems', 'obstacles stop you', 'no backup plan', 'need to plan for obstacles'
    ],
    whenToUse: ['You know specific common blockers', 'You frequently get derailed', 'Obstacles surprise you'],
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
    keywords: ['bundle', 'sequence', 'routine', 'gewohnheit', 'klein', 'winzig', 'automatisch'],
    problemPatterns: [
      'too many steps', 'overwhelmed', 'too many habits', 'overwhelming', 'complex routine', 'hard to remember',
      'zu viele', 'überwältigt', 'kompliziert', 'schwierig', 'routine', 'gewohnheit', 'klein', 'winzig',
      'too many steps', 'overwhelmed', 'too many habits', 'overwhelming', 'complex routine', 'hard to remember'
    ],
    whenToUse: ['You want to chain 2–3 mini-habits', 'You have multiple habits to build', 'You want a comprehensive routine'],
    steps: [
      'Write a short checklist (e.g., fill bottle → warmup → start).',
      'Execute the bundle at one anchor time/place.',
      'Keep total time under 10–15 min initially.'
    ],
    sources: []
  },
  {
    id: 'pomodoro-technique',
    name: 'Pomodoro Technique',
    summary: 'Work in focused 25-minute intervals with short breaks.',
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
    sources: ['https://francescocirillo.com/pages/pomodoro-technique']
  },
  {
    id: 'environment-design',
    name: 'Environment Design',
    summary: 'Shape your surroundings to make good habits easier and bad ones harder.',
    categories: ['environment', 'routine'],
    keywords: ['environment', 'setup', 'preparation', 'make it easy', 'umgebung', 'vorbereitung', 'platz', 'raum'],
    problemPatterns: [
      'forget to start', 'hard to begin', 'need reminders', 'environment not supportive', 'wrong place', 'distractions',
      'umgebung', 'vorbereitung', 'platz', 'raum', 'trigger', 'hinweis', 'digital', 'minimalismus',
      'environment not supportive', 'wrong place', 'distractions', 'noise', 'chaos', 'disorganized'
    ],
    whenToUse: ['You want to reduce friction for good habits', 'Your environment fights against you', 'You need stronger cues'],
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
    keywords: ['two minute', 'just start', 'small start', 'overcome resistance', 'klein', 'winzig', 'start'],
    problemPatterns: [
      'hard to start', 'procrastinate', 'feel overwhelmed', 'too big', 'overwhelmed', 'too much', 'never start',
      'schwierig', 'aufgeschoben', 'überwältigt', 'zu groß', 'klein', 'winzig', 'start',
      'hard to start', 'procrastinate', 'feel overwhelmed', 'too big', 'overwhelmed', 'too much', 'never start'
    ],
    whenToUse: ['You procrastinate on starting', 'Habits feel too big', 'You\'re overwhelmed by the habit', 'You keep failing to start'],
    steps: [
      'Commit to just 2 minutes of the habit.',
      'Set a timer and start.',
      'You can stop after 2 minutes if you want.',
      'Most times, you\'ll continue past 2 minutes.'
    ],
    sources: ['https://jamesclear.com/how-to-stop-procrastinating']
  },
  {
    id: 'micro-habits',
    name: 'Micro-Habits',
    summary: 'Start with ridiculously small habits that are impossible to fail.',
    categories: ['motivation', 'routine'],
    keywords: ['micro', 'tiny', 'small', 'impossible to fail', 'start small', 'klein', 'winzig', 'mini'],
    problemPatterns: [
      'too ambitious', 'overwhelm', 'hard to start', 'fail quickly', 'too big', 'overwhelmed', 'never start',
      'zu groß', 'überwältigt', 'schwierig', 'fehlschlag', 'klein', 'winzig', 'mini',
      'too ambitious', 'overwhelm', 'hard to start', 'fail quickly', 'too big', 'overwhelmed', 'never start'
    ],
    whenToUse: ['You\'re overwhelmed by the habit', 'You keep failing to start', 'You want to build consistency'],
    steps: [
      'Make the habit so small it\'s laughable.',
      'Focus on consistency, not intensity.',
      'Gradually increase after 2-4 weeks.',
      'Celebrate every completion.'
    ],
    sources: ['https://jamesclear.com/atomic-habits']
  }
];

// Export the enhanced tools as the default
export const DEFAULT_TOOLS = ENHANCED_TOOLS;
