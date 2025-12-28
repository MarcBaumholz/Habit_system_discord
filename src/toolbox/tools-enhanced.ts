import { HabitTool } from './index';

// Enhanced toolbox with German language support and more comprehensive matching
export const ENHANCED_TOOLS: HabitTool[] = [
  {
    id: 'habit-stacking',
    name: 'Habit Stacking',
    summary: 'Attach a new habit to an existing automatic routine.',
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
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    summary: 'Visual progress tracking to maintain motivation and consistency.',
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
    sources: ['https://jamesclear.com/habit-tracker']
  },
  {
    id: 'advanced-habit-stacking',
    name: 'Advanced Habit Stacking',
    summary: 'Build complex routines by chaining multiple habits together.',
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
    sources: ['https://jamesclear.com/habit-stacking']
  },
  {
    id: 'identity-based-habits',
    name: 'Identity-Based Habits',
    summary: 'Build habits around the person you want to become, not just outcomes.',
    categories: ['motivation'],
    keywords: ['identity', 'who you want to be', 'person you become', 'self-image', 'become', 'different person', 'identität', 'werden', 'persönlichkeit'],
    problemPatterns: [
      'focus on outcome', 'lose motivation', 'not sustainable', 'external motivation', 'want to become', 'become a different',
      'identität', 'werden', 'persönlichkeit', 'selbstbild', 'anders werden', 'verändern',
      'focus on outcome', 'lose motivation', 'not sustainable', 'external motivation', 'want to become', 'become a different'
    ],
    whenToUse: ['You focus too much on results', 'Habits don\'t feel meaningful', 'You want lasting change'],
    steps: [
      'Decide who you want to become.',
      'Ask: "What would this person do daily?"',
      'Focus on being that person.',
      'Let outcomes follow naturally.'
    ],
    sources: ['https://jamesclear.com/identity-based-habits']
  },
  {
    id: 'streak-protection',
    name: 'Streak Protection',
    summary: 'Strategies to maintain your streak even on difficult days.',
    categories: ['motivation', 'routine'],
    keywords: ['streak', 'don\'t break chain', 'maintain consistency', 'bad days', 'protect my streak', 'streak schützen', 'kette', 'durchhalten'],
    problemPatterns: [
      'break streak', 'bad days', 'lose momentum', 'start over', 'breaking my habit streak', 'protect my streak',
      'streak brechen', 'schlechte tage', 'momentum verlieren', 'von vorne anfangen', 'streak schützen', 'kette erhalten',
      'break streak', 'bad days', 'lose momentum', 'start over', 'breaking my habit streak', 'protect my streak'
    ],
    whenToUse: ['You have a good streak going', 'Bad days threaten consistency', 'You want to maintain momentum'],
    steps: [
      'Define your minimum viable habit.',
      'Use it on tough days.',
      'Never miss twice in a row.',
      'Celebrate streak milestones.'
    ],
    sources: ['https://jamesclear.com/never-miss-twice']
  },
  {
    id: 'obstacle-mapping',
    name: 'Obstacle Mapping',
    summary: 'Identify and plan for potential obstacles before they derail you.',
    categories: ['motivation', 'routine'],
    keywords: ['obstacles', 'barriers', 'plan ahead', 'anticipate problems', 'plan for obstacles', 'hindernisse', 'probleme', 'schwierigkeiten'],
    problemPatterns: [
      'get derailed', 'unexpected problems', 'obstacles stop you', 'no backup plan', 'need to plan for obstacles', 'plan for obstacles',
      'hindernisse', 'probleme', 'schwierigkeiten', 'planung', 'vorbereitung', 'obstacles', 'barriers',
      'get derailed', 'unexpected problems', 'obstacles stop you', 'no backup plan', 'need to plan for obstacles'
    ],
    whenToUse: ['You frequently get derailed', 'Obstacles surprise you', 'You want to be prepared'],
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
    keywords: ['replace', 'substitute', 'swap', 'change habit', 'bad habit', 'ersetzten', 'austauschen', 'schlechte gewohnheit'],
    problemPatterns: [
      'bad habit', 'unwanted behavior', 'hard to stop', 'automatic response', 'need to change', 'want to replace',
      'schlechte gewohnheit', 'unerwünschtes verhalten', 'schwer zu stoppen', 'automatische reaktion', 'ändern wollen',
      'bad habit', 'unwanted behavior', 'hard to stop', 'automatic response', 'need to change', 'want to replace'
    ],
    whenToUse: ['You have a bad habit to break', 'You want to replace unwanted behavior', 'You want to change automatic responses'],
    steps: [
      'Identify the cue, routine, and reward.',
      'Keep the same cue and reward.',
      'Change only the routine.',
      'Practice the new routine consistently.'
    ],
    sources: ['https://charlesduhigg.com/the-power-of-habit/']
  },
  {
    id: 'environmental-triggers',
    name: 'Environmental Triggers',
    summary: 'Use visual and physical cues in your environment to trigger habits.',
    categories: ['environment', 'routine'],
    keywords: ['triggers', 'cues', 'visual reminders', 'environmental signals', 'trigger', 'hinweis', 'umgebung', 'signale'],
    problemPatterns: [
      'forget to start', 'no reminders', 'inconsistent triggers', 'environment doesn\'t help', 'need visual cues',
      'vergessen zu starten', 'keine erinnerungen', 'inkonsistente trigger', 'umgebung hilft nicht', 'visuelle hinweise brauchen',
      'forget to start', 'no reminders', 'inconsistent triggers', 'environment doesn\'t help', 'need visual cues'
    ],
    whenToUse: ['You forget to start habits', 'You need stronger cues', 'Your environment doesn\'t support habits'],
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
    keywords: ['public commitment', 'social pressure', 'announce goals', 'accountability', 'öffentlich', 'sozialer druck', 'verantwortlichkeit'],
    problemPatterns: [
      'no accountability', 'easy to quit', 'private goals', 'lack motivation', 'need social support',
      'keine verantwortlichkeit', 'leicht aufzugeben', 'private ziele', 'motivation fehlt', 'soziale unterstützung brauchen',
      'no accountability', 'easy to quit', 'private goals', 'lack motivation', 'need social support'
    ],
    whenToUse: ['You need stronger accountability', 'Private commitments aren\'t enough', 'You work better with others'],
    steps: [
      'Announce your habit publicly.',
      'Share progress regularly.',
      'Ask for support from others.',
      'Use social pressure positively.'
    ],
    sources: ['https://www.psychologytoday.com/us/blog/tech-happy-life/201204/accountability-partners']
  },
  {
    id: 'energy-management',
    name: 'Energy Management',
    summary: 'Schedule habits when your energy levels are highest.',
    categories: ['motivation', 'time'],
    keywords: ['energy', 'peak hours', 'optimal time', 'when you feel best', 'energie', 'spitzenzeiten', 'optimale zeit'],
    problemPatterns: [
      'low energy', 'wrong timing', 'feel sluggish', 'not motivated', 'tired when doing habits', 'bad timing',
      'niedrige energie', 'falsches timing', 'träge fühlen', 'nicht motiviert', 'müde bei gewohnheiten', 'schlechtes timing',
      'low energy', 'wrong timing', 'feel sluggish', 'not motivated', 'tired when doing habits', 'bad timing'
    ],
    whenToUse: ['You have low energy for habits', 'Timing doesn\'t work', 'You feel tired during habit time'],
    steps: [
      'Track your energy levels for 1 week.',
      'Identify your peak energy times.',
      'Schedule challenging habits during peaks.',
      'Use low-energy times for easy habits.'
    ],
    sources: ['https://hbr.org/2007/10/manage-your-energy-not-your-time']
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

// Export the enhanced tools as the default
export const DEFAULT_TOOLS = ENHANCED_TOOLS;
