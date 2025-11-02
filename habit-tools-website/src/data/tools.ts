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
    emoji: '🧱',
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
    emoji: '📊',
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
    emoji: '⛓️',
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
    emoji: '⏰',
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
    emoji: '🍅',
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
  },
  {
    id: 'identity-priming',
    name: 'Identity Priming Ritual',
    emoji: '🪞',
    summary: 'Stärke dein zukünftiges Selbst mit einem kurzen Identitäts-Statement vor jeder Session.',
    description:
      'Identity Priming verbindet psychologische Visualisierung mit konkreter Handlung. Vor Beginn einer wichtigen Routine formulierst du laut oder schriftlich, wer du in diesem Moment sein möchtest. Durch die bewusste Aktivierung deiner gewünschten Identität steigt die Wahrscheinlichkeit, dass du entsprechend handelst.',
    categories: ['motivation', 'focus'],
    keywords: ['identity', 'visualisierung', 'self-image', 'priming', 'motivationsproblem', 'mindset'],
    problemPatterns: [
      'fehlende Motivation',
      'zweifle an mir',
      'kein selbstvertrauen',
      'werde schnell abgelenkt',
      'vergesse wofür ich es mache',
      'self sabotage'
    ],
    whenToUse: [
      'Du kennst deine Ziele, aber handelst nicht konsequent.',
      'Du brauchst einen mentalen Reset vor schwierigen Aufgaben.'
    ],
    steps: [
      'Formuliere ein kurzes „Ich bin …"-Statement, das dein gewünschtes Verhalten beschreibt.',
      'Atme drei Mal tief ein und stelle dir dein zukünftiges Selbst vor.',
      'Starte mit einer konkreten Mini-Aktion, die zu dieser Identität passt.'
    ],
    examples: [
      'Ich bin ein Creator, der mit Fokus gestaltet – jetzt öffne ich Figma und starte den ersten Frame.',
      'Ich bin jemand, der seinen Körper pflegt – jetzt ziehe ich meine Laufschuhe an.'
    ],
    tips: [
      'Nutze eine physische Trigger-Karte oder ein Widget mit deinem Statement.',
      'Wechsle alle zwei Wochen das Statement, um es frisch zu halten.'
    ],
    sources: ['https://jamesclear.com/identity-based-habits'],
    difficulty: 'Beginner',
    timeToImplement: '3 Minuten',
    effectiveness: 4,
    language: 'both',
    icon: 'Sparkles',
    color: 'bg-pink-500'
  },
  {
    id: 'deep-work',
    name: 'Deep Work Sprint',
    emoji: '🧠',
    summary: 'Short, focused sessions with no distractions.',
    description: 'Deep Work Sprint is a technique for achieving peak focus by eliminating all distractions and dedicating yourself to a single task. Based on Cal Newport\'s concept of deep work, this method helps you produce high-quality work by creating protected time blocks free from interruptions.',
    categories: ['focus'],
    keywords: ['deep work', 'focus', 'distraction', 'concentration', 'fokussieren', 'konzentration', 'ablenkung', 'stören', 'deep work sprint', 'focused work'],
    problemPatterns: [
      'distracted', 'can\'t focus', 'interruptions', 'get distracted', 'lose focus', 'hard to concentrate',
      'fokussieren', 'konzentration', 'ablenkung', 'stören', 'unterbrechung', 'ablenkend'
    ],
    whenToUse: ['You need concentration', 'Environment is noisy', 'You struggle with distractions', 'Tasks require deep thinking'],
    steps: [
      'Choose a short sprint (25–45 min).',
      'Close all apps/tabs not needed; phone in another room.',
      'Define one specific outcome for the sprint.',
      'Take a short break (5–10 min), then repeat if needed.'
    ],
    examples: [
      'Deep work sprint for writing: 45 min focused writing with phone in another room, no social media',
      'Deep work for studying: 30 min session with only study materials, all notifications off',
      'Deep work for coding: 40 min block with IDE open, communication tools closed'
    ],
    tips: [
      'Start with shorter sprints (25 minutes) and gradually increase',
      'Schedule deep work during your peak energy hours',
      'Create a ritual: same setup each time signals your brain to focus',
      'Track your deep work hours to build awareness'
    ],
    sources: ['https://www.calnewport.com/books/deep-work/'],
    difficulty: 'Intermediate',
    timeToImplement: '10 minutes',
    effectiveness: 5,
    language: 'both',
    icon: 'Target',
    color: 'bg-purple-500'
  },
  {
    id: 'temptation-bundling',
    name: 'Temptation Bundling',
    emoji: '🎁',
    summary: 'Pair a desired habit with something you crave.',
    description: 'Temptation bundling is a behavioral strategy that pairs a habit you need to do with a habit you want to do. By only allowing yourself to enjoy something pleasurable while doing a less enjoyable task, you create a powerful incentive to follow through with your habit.',
    categories: ['motivation'],
    keywords: ['bundle', 'reward', 'temptation', 'pair habits', 'reward system', 'belohnung', 'anreiz'],
    problemPatterns: [
      'low motivation', 'boring habit', 'procrastinate', 'lack motivation', 'need incentive', 'unmotivated',
      'motivation', 'antrieb', 'lustlos', 'faul', 'träge', 'unmotiviert'
    ],
    whenToUse: ['You procrastinate because it\'s not fun', 'Habits feel boring', 'You need extra motivation to start'],
    steps: [
      'List activities you enjoy (podcast, playlist, show).',
      'Allow them only while doing the habit.',
      'Prepare everything in advance to reduce friction.'
    ],
    examples: [
      'Only listen to your favorite podcast while doing household chores',
      'Watch your favorite TV show only while exercising on the treadmill',
      'Enjoy a special coffee only while working on important tasks',
      'Listen to audiobooks only during your commute or while walking'
    ],
    tips: [
      'Choose temptations that genuinely excite you',
      'Be strict: no temptation without the habit',
      'Mix up your temptations to keep them fresh',
      'Start small: bundle with short habits first'
    ],
    sources: ['https://jamesclear.com/temptation-bundling'],
    difficulty: 'Beginner',
    timeToImplement: '5 minutes',
    effectiveness: 3,
    language: 'both',
    icon: 'Gift',
    color: 'bg-orange-500'
  },
  {
    id: 'implementation-intentions',
    name: 'Implementation Intentions',
    emoji: '📋',
    summary: 'Create if-then plans to handle obstacles.',
    description: 'Implementation intentions are specific plans that link situational cues to goal-directed behaviors. By creating "if-then" statements, you pre-decide how to handle obstacles and create automatic responses that keep you on track with your habits even when challenges arise.',
    categories: ['routine', 'motivation'],
    keywords: ['if-then', 'plan', 'intention', 'obstacles', 'planning', 'preparation', 'strategie'],
    problemPatterns: [
      'get derailed', 'unexpected obstacles', 'obstacles stop you', 'no backup plan', 'surprised by problems',
      'hürden', 'hindernisse', 'probleme', 'unvorbereitet'
    ],
    whenToUse: ['You know specific common blockers', 'You frequently get derailed', 'Obstacles surprise you'],
    steps: [
      'Identify a likely obstacle (e.g., arrive home tired).',
      'Plan: If [obstacle], then I will [tiny recovery action].',
      'Practice the plan mentally 1–2 times.'
    ],
    examples: [
      'If I arrive home tired after work, then I will do just 5 minutes of exercise instead of skipping',
      'If I forget my water bottle, then I will buy water at the nearest store',
      'If it\'s raining and I can\'t run outside, then I will do indoor workout videos',
      'If I miss my morning meditation, then I will do 2 minutes during lunch break'
    ],
    tips: [
      'Anticipate your 3-5 most common obstacles',
      'Make your "then" actions ridiculously small',
      'Write your if-then plans down',
      'Review and update them weekly based on experience'
    ],
    sources: ['https://jamesclear.com/implementation-intentions'],
    difficulty: 'Intermediate',
    timeToImplement: '15 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'FileText',
    color: 'bg-blue-500'
  },
  {
    id: 'habit-bundles',
    name: 'Habit Bundles',
    emoji: '📦',
    summary: 'Group small actions into a single routine packet.',
    description: 'Habit bundles combine multiple small, related actions into one cohesive routine. Instead of managing several habits separately, you create a sequence that flows naturally and feels like one integrated activity. This reduces decision fatigue and increases consistency.',
    categories: ['routine'],
    keywords: ['bundle', 'sequence', 'group habits', 'routine packet', 'habit sequence', 'gruppieren', 'kombinieren'],
    problemPatterns: [
      'too many steps', 'overwhelmed', 'too many habits', 'feels complicated', 'hard to remember sequence',
      'zu viele schritte', 'überfordert', 'kompliziert'
    ],
    whenToUse: ['You want to chain 2–3 mini-habits', 'Multiple related habits feel scattered', 'You want to simplify routine'],
    steps: [
      'Write a short checklist (e.g., fill bottle → warmup → start).',
      'Execute the bundle at one anchor time/place.',
      'Keep total time under 10–15 min initially.'
    ],
    examples: [
      'Morning bundle: Make bed → Open curtains → Drink water → Review goals',
      'Exercise bundle: Change clothes → Fill water bottle → Warm up → Start workout',
      'Evening bundle: Tidy desk → Prepare tomorrow\'s clothes → Write gratitude → Set phone to charge'
    ],
    tips: [
      'Start with 2-3 related habits maximum',
      'Create a logical flow that feels natural',
      'Use visual cues (checklist or post-it) to remember sequence',
      'Wait until bundle is automatic before adding more'
    ],
    sources: [],
    difficulty: 'Beginner',
    timeToImplement: '10 minutes',
    effectiveness: 3,
    language: 'both',
    icon: 'Package',
    color: 'bg-blue-500'
  },
  {
    id: 'environment-design',
    name: 'Environment Design',
    emoji: '🏗️',
    summary: 'Shape your surroundings to make good habits easier and bad ones harder.',
    description: 'Environment design is the practice of structuring your physical and digital spaces to support your desired behaviors. By making good habits obvious, easy, and attractive, while making bad habits invisible, difficult, and unattractive, you remove the need for willpower and rely on your environment to guide your actions.',
    categories: ['environment', 'routine'],
    keywords: ['environment', 'setup', 'preparation', 'make it easy', 'umgebung', 'vorbereitung', 'einrichten'],
    problemPatterns: [
      'forget to start', 'hard to begin', 'need reminders', 'environment not supportive', 'distractions everywhere',
      'vergessen', 'schwer zu beginnen', 'umgebung unterstützt nicht'
    ],
    whenToUse: ['You want to reduce friction for good habits', 'Your environment fights against you', 'You forget to start habits'],
    steps: [
      'Identify what you need for the habit.',
      'Place items in obvious, convenient locations.',
      'Remove obstacles and distractions.',
      'Make the first step impossible to miss.'
    ],
    examples: [
      'Place workout clothes and shoes next to your bed for morning exercise',
      'Keep water bottle on your desk for hydration reminders',
      'Put unhealthy snacks in hard-to-reach places, healthy snacks at eye level',
      'Charge your phone in another room to reduce bedtime scrolling'
    ],
    tips: [
      'One change at a time - don\'t redesign everything at once',
      'Make good habits visible: place reminders and tools in sight',
      'Reduce friction: prepare everything the night before',
      'Create dedicated spaces for specific habits'
    ],
    sources: ['https://jamesclear.com/environment-design'],
    difficulty: 'Intermediate',
    timeToImplement: '20 minutes',
    effectiveness: 5,
    language: 'both',
    icon: 'Settings',
    color: 'bg-teal-500'
  },
  {
    id: 'two-minute-rule',
    name: 'Two-Minute Rule',
    emoji: '⏱️',
    summary: 'Start any habit by committing to just two minutes.',
    description: 'The Two-Minute Rule states that when you start a new habit, it should take less than two minutes to do. This makes habits so small that you can\'t say no, eliminating the friction that prevents you from starting. The goal isn\'t to do the habit for two minutes, but to master the art of showing up.',
    categories: ['motivation', 'routine'],
    keywords: ['two minute', 'just start', 'small start', 'overcome resistance', 'mini habit', 'klein anfangen'],
    problemPatterns: [
      'hard to start', 'procrastinate', 'feel overwhelmed', 'too big', 'can\'t get started', 'resistance',
      'schwer anzufangen', 'aufgeschoben', 'überwältigend', 'zu groß'
    ],
    whenToUse: ['You procrastinate on starting', 'Habits feel too big', 'You have trouble getting started'],
    steps: [
      'Commit to just 2 minutes of the habit.',
      'Set a timer and start.',
      'You can stop after 2 minutes if you want.',
      'Most times, you\'ll continue past 2 minutes.'
    ],
    examples: [
      '\"Read\" becomes \"Read one page\" (2-minute rule version)',
      '\"Exercise\" becomes \"Put on workout clothes\" (2-minute rule version)',
      '\"Write\" becomes \"Write one sentence\" (2-minute rule version)',
      '\"Meditate\" becomes \"Sit in meditation position\" (2-minute rule version)'
    ],
    tips: [
      'Focus on showing up, not the duration',
      'Scale down your habit until it\'s laughably small',
      'Once you start, momentum often carries you forward',
      'The two-minute rule is the gateway habit'
    ],
    sources: ['https://jamesclear.com/how-to-stop-procrastinating'],
    difficulty: 'Beginner',
    timeToImplement: '2 minutes',
    effectiveness: 5,
    language: 'both',
    icon: 'Timer',
    color: 'bg-orange-500'
  },
  {
    id: 'time-blocking',
    name: 'Time Blocking',
    emoji: '📅',
    summary: 'Schedule specific blocks of time for different activities.',
    description: 'Time blocking is a calendar-based time management method where you divide your day into blocks of time dedicated to specific activities. Each block is reserved for a particular task or type of work, creating structure and preventing your day from getting away from you.',
    categories: ['time', 'focus'],
    keywords: ['time block', 'schedule', 'calendar', 'planning', 'zeitblock', 'planung', 'kalender'],
    problemPatterns: [
      'no structure', 'time gets away', 'unproductive', 'scattered', 'time disappears', 'no planning',
      'keine struktur', 'zeit vergeht', 'unproduktiv', 'zerstreut'
    ],
    whenToUse: ['Your days lack structure', 'Time disappears without progress', 'You need better time allocation'],
    steps: [
      'Divide your day into themed blocks.',
      'Assign specific activities to each block.',
      'Protect blocks from interruptions.',
      'Review and adjust weekly.'
    ],
    examples: [
      'Morning block (6-9 AM): Exercise, breakfast, planning',
      'Deep work block (9-12 PM): Focused work sessions',
      'Administrative block (2-3 PM): Email, meetings, logistics',
      'Creative block (4-6 PM): Projects requiring creativity'
    ],
    tips: [
      'Start with your non-negotiables (sleep, meals, exercise)',
      'Group similar tasks into themed blocks',
      'Leave buffer time between blocks for transitions',
      'Color-code blocks for visual clarity'
    ],
    sources: ['https://calendar.com/blog/time-blocking/'],
    difficulty: 'Intermediate',
    timeToImplement: '30 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Calendar',
    color: 'bg-green-500'
  },
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    emoji: '🌅',
    summary: 'Create a consistent start to your day that sets you up for success.',
    description: 'A morning routine is a set of habits you perform at the start of each day to set a positive tone and ensure you begin with intention. Research shows that successful people often have structured morning routines that provide predictability, reduce decision fatigue, and create momentum for the rest of the day.',
    categories: ['routine', 'motivation'],
    keywords: ['morning', 'routine', 'start day', 'win the morning', 'morgens', 'morgenroutine', 'tag beginnen'],
    problemPatterns: [
      'chaotic mornings', 'start day wrong', 'no energy', 'unproductive mornings', 'rushed mornings',
      'chaotische morgen', 'tag falsch beginnen', 'keine energie'
    ],
    whenToUse: ['Your mornings are chaotic', 'You want to start the day right', 'Mornings feel rushed'],
    steps: [
      'Design a 15-30 minute routine.',
      'Include 2-3 energizing activities.',
      'Do it at the same time daily.',
      'Keep it simple and achievable.'
    ],
    examples: [
      'Basic routine: Wake up → Drink water → Stretch → Review goals',
      'Energizing routine: Wake up → Exercise → Shower → Healthy breakfast → Read',
      'Mindful routine: Wake up → Meditation → Journal → Gratitude → Plan day'
    ],
    tips: [
      'Start with 2-3 activities maximum',
      'Wake up at the same time every day (even weekends)',
      'Prepare everything the night before',
      'Make your routine enjoyable, not a chore'
    ],
    sources: ['https://www.inc.com/melanie-curtin/the-5-minute-morning-routine-that-will-change-your-life.html'],
    difficulty: 'Beginner',
    timeToImplement: '15 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Sunrise',
    color: 'bg-blue-500'
  },
  {
    id: 'evening-routine',
    name: 'Evening Routine',
    emoji: '🌙',
    summary: 'Wind down with a consistent evening routine for better sleep and preparation.',
    description: 'An evening routine is a series of calming and preparatory activities performed before bed. It helps you transition from the busyness of the day to rest, improves sleep quality, and prepares you for the next day. A consistent evening routine signals your body and mind that it\'s time to wind down.',
    categories: ['routine', 'environment'],
    keywords: ['evening', 'wind down', 'prepare tomorrow', 'better sleep', 'abends', 'abendroutine', 'schlaf vorbereiten'],
    problemPatterns: [
      'can\'t sleep', 'chaotic evenings', 'unprepared for tomorrow', 'stress at night', 'trouble sleeping',
      'kann nicht schlafen', 'chaotische abende', 'nicht vorbereitet'
    ],
    whenToUse: ['You have trouble sleeping', 'Evenings feel chaotic', 'You wake up unprepared'],
    steps: [
      'Create a 30-60 minute wind-down routine.',
      'Include preparation for tomorrow.',
      'Avoid screens 1 hour before bed.',
      'Make it relaxing and consistent.'
    ],
    examples: [
      'Simple routine: Tidy up → Prepare tomorrow\'s clothes → Brush teeth → Read → Sleep',
      'Relaxing routine: Light stretching → Journal → Gratitude → Herbal tea → Meditation → Sleep',
      'Productive routine: Review day → Plan tomorrow → Tidy workspace → Prepare breakfast → Unwind → Sleep'
    ],
    tips: [
      'Start winding down 1 hour before desired sleep time',
      'Create a "no screens" rule 1 hour before bed',
      'Use dim lighting in the evening',
      'Make preparation for tomorrow part of the routine'
    ],
    sources: ['https://www.sleepfoundation.org/sleep-hygiene/healthy-sleep-tips'],
    difficulty: 'Beginner',
    timeToImplement: '20 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Moon',
    color: 'bg-blue-500'
  },
  {
    id: 'accountability-partner',
    name: 'Accountability Partner',
    emoji: '🤝',
    summary: 'Partner with someone to check in and support each other\'s habits.',
    description: 'An accountability partner is someone who helps you stay committed to your habits by providing regular check-ins, support, and encouragement. This social commitment increases your motivation and makes you more likely to follow through because someone else is counting on you and noticing your progress.',
    categories: ['motivation', 'environment'],
    keywords: ['accountability', 'partner', 'support', 'check in', 'buddy', 'verantwortlichkeit', 'partner', 'unterstützung'],
    problemPatterns: [
      'no support', 'easy to quit', 'isolated', 'need encouragement', 'lack accountability', 'give up easily',
      'keine unterstützung', 'leicht aufzugeben', 'isolated'
    ],
    whenToUse: ['You work better with others', 'You need external motivation', 'Private commitments aren\'t enough'],
    steps: [
      'Find someone with similar goals.',
      'Set regular check-in times.',
      'Share specific commitments.',
      'Celebrate wins together.'
    ],
    examples: [
      'Workout partner: Check in daily after workouts, meet at gym 3x/week',
      'Writing partner: Share daily word count, weekly progress reviews',
      'Meditation partner: 10-minute meditation together, weekly reflections',
      'Habit buddy: Text each other daily check-ins, weekly video call'
    ],
    tips: [
      'Choose someone reliable and committed, not just a friend',
      'Set clear expectations: frequency, format, goals',
      'Make it reciprocal: support each other equally',
      'Celebrate both small wins and big milestones'
    ],
    sources: ['https://www.psychologytoday.com/us/blog/tech-happy-life/201204/accountability-partners'],
    difficulty: 'Beginner',
    timeToImplement: '10 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Users',
    color: 'bg-orange-500'
  },
  {
    id: 'reward-system',
    name: 'Reward System',
    emoji: '🎁',
    summary: 'Create meaningful rewards for habit completion to reinforce behavior.',
    description: 'A reward system links positive reinforcement to habit completion, creating a dopamine response that makes the behavior more likely to repeat. By associating your habits with immediate, meaningful rewards, you train your brain to view the habit itself as rewarding, eventually making the reward unnecessary.',
    categories: ['motivation'],
    keywords: ['reward', 'celebration', 'incentive', 'motivation', 'belohnung', 'anreiz', 'feiern'],
    problemPatterns: [
      'no motivation', 'boring habit', 'need incentive', 'hard to stick with', 'lack motivation',
      'keine motivation', 'langweilig', 'brauche anreiz'
    ],
    whenToUse: ['Habits feel boring or unrewarding', 'You need extra motivation', 'Habits don\'t provide immediate gratification'],
    steps: [
      'Define meaningful rewards for you.',
      'Link rewards to habit completion.',
      'Vary rewards to maintain interest.',
      'Make rewards immediate when possible.'
    ],
    examples: [
      'After completing daily workout, enjoy a favorite smoothie',
      'After finishing writing session, watch one episode of favorite show',
      'After completing morning routine, enjoy special coffee',
      'After week of consistency, treat yourself to something special'
    ],
    tips: [
      'Make rewards immediate: within 1 hour of habit completion',
      'Choose rewards that genuinely excite you',
      'Vary rewards to prevent habituation',
      'Eventually, the habit itself becomes the reward'
    ],
    sources: ['https://www.verywellmind.com/how-to-use-rewards-to-motivate-yourself-2795385'],
    difficulty: 'Beginner',
    timeToImplement: '10 minutes',
    effectiveness: 3,
    language: 'both',
    icon: 'Star',
    color: 'bg-orange-500'
  },
  {
    id: 'preparation-ritual',
    name: 'Preparation Ritual',
    emoji: '📦',
    summary: 'Set up everything you need the night before to reduce morning friction.',
    description: 'A preparation ritual is the practice of preparing everything you need for tomorrow before going to bed. By removing decisions and friction from your morning, you make it easier to follow through with your habits. This is especially powerful for morning routines and ensures you start each day with clarity and ease.',
    categories: ['environment', 'routine'],
    keywords: ['prepare', 'setup', 'night before', 'reduce friction', 'vorbereitung', 'vorbereiten', 'abend vorbereitung'],
    problemPatterns: [
      'morning chaos', 'forget things', 'hard to start', 'unprepared', 'morning rush', 'forget to prepare',
      'morgenchaos', 'vergessen', 'schwer anzufangen', 'nicht vorbereitet'
    ],
    whenToUse: ['Mornings are rushed', 'You forget necessary items', 'Morning preparation adds stress'],
    steps: [
      'List everything needed for tomorrow.',
      'Set out clothes, equipment, materials.',
      'Prepare meals or ingredients.',
      'Create a simple checklist.'
    ],
    examples: [
      'Lay out workout clothes, fill water bottle, charge devices',
      'Prepare breakfast ingredients, pack lunch, set out keys',
      'Choose outfit, pack bag, review schedule, set intentions',
      'Prepare workspace, set out materials, review goals for next day'
    ],
    tips: [
      'Do preparation as part of your evening routine',
      'Create a checklist so you don\'t forget items',
      'Prepare in the same order each night (creates automaticity)',
      'Start with most critical items, add more over time'
    ],
    sources: ['https://www.fastcompany.com/3067079/why-successful-people-prepare-the-night-before'],
    difficulty: 'Beginner',
    timeToImplement: '10 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'CheckSquare',
    color: 'bg-teal-500'
  },
  {
    id: 'digital-minimalism',
    name: 'Digital Minimalism',
    emoji: '📱',
    summary: 'Reduce digital distractions to focus on what matters most.',
    description: 'Digital minimalism is a philosophy of technology use centered on carefully choosing which technologies add value to your life and eliminating those that don\'t. By reducing digital distractions, notifications, and mindless scrolling, you free up mental space and time for your meaningful habits and goals.',
    categories: ['environment', 'focus'],
    keywords: ['digital detox', 'reduce distractions', 'focus', 'technology', 'phone', 'digital', 'minimalismus', 'digital detox'],
    problemPatterns: [
      'too many notifications', 'phone addiction', 'distracted by apps', 'waste time online', 'distracted by my phone', 'phone distractions',
      'zu viele benachrichtigungen', 'handy süchtig', 'abgelenkt', 'zeit verschwenden'
    ],
    whenToUse: ['Digital distractions interfere with habits', 'You\'re addicted to devices', 'Technology interrupts your focus'],
    steps: [
      'Audit your digital usage for 1 week.',
      'Remove non-essential apps and accounts.',
      'Turn off non-critical notifications.',
      'Create phone-free zones and times.'
    ],
    examples: [
      'Remove social media apps, keep only messaging for family',
      'Turn off all notifications except calls from family',
      'Create phone-free morning and evening hours',
      'Delete unused apps, unsubscribe from email lists'
    ],
    tips: [
      'Start with a 30-day digital declutter: remove apps, unsubscribe',
      'Use screen time tracking to see actual usage',
      'Create physical distance: charge phone in another room',
      'Replace digital habits with analog alternatives'
    ],
    sources: ['https://www.calnewport.com/books/digital-minimalism/'],
    difficulty: 'Intermediate',
    timeToImplement: '30 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Smartphone',
    color: 'bg-teal-500'
  },
  {
    id: 'dedicated-space',
    name: 'Dedicated Space',
    emoji: '🏠',
    summary: 'Create a specific, dedicated space for your habit to improve consistency.',
    description: 'A dedicated space is a specific physical location reserved exclusively for a particular habit. By consistently using the same space, you create environmental cues that trigger the habit automatically. This spatial consistency eliminates the decision of "where" and makes starting the habit easier.',
    categories: ['environment', 'routine'],
    keywords: ['dedicated space', 'habit corner', 'specific place', 'environment', 'dedizierter ort', 'eigener platz'],
    problemPatterns: [
      'no good place', 'space not suitable', 'inconsistent location', 'environment fights habit', 'no dedicated area',
      'kein guter platz', 'platz nicht geeignet', 'inkonsistenter ort'
    ],
    whenToUse: ['Your environment doesn\'t support the habit', 'You need a consistent location', 'You want stronger environmental cues'],
    steps: [
      'Choose a specific space for the habit.',
      'Make it comfortable and functional.',
      'Remove distractions from the space.',
      'Use the space only for this habit.'
    ],
    examples: [
      'Dedicated meditation corner: same cushion, same spot, same time daily',
      'Dedicated reading nook: comfortable chair, good lighting, no distractions',
      'Dedicated workout space: exercise mat in corner, equipment ready',
      'Dedicated writing desk: clean surface, minimal items, inspiring setup'
    ],
    tips: [
      'Start small: even a corner of a room works',
      'Make the space inviting: add items that inspire you',
      'Keep the space clean and organized',
      'Use the space consistently: same time, same place'
    ],
    sources: ['https://jamesclear.com/environment-design'],
    difficulty: 'Beginner',
    timeToImplement: '20 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Home',
    color: 'bg-teal-500'
  },
  {
    id: 'energy-management',
    name: 'Energy Management',
    emoji: '⚡',
    summary: 'Schedule habits when your energy levels are highest.',
    description: 'Energy management is the practice of aligning your habits with your natural energy rhythms. Instead of forcing yourself to do demanding habits when you\'re low on energy, you schedule them during your peak hours and reserve low-energy times for easier tasks. This increases success rates and reduces resistance.',
    categories: ['motivation', 'time'],
    keywords: ['energy', 'peak hours', 'optimal time', 'when you feel best', 'energie', 'beste zeit', 'energielevel'],
    problemPatterns: [
      'low energy', 'wrong timing', 'feel sluggish', 'not motivated', 'tired', 'lack energy',
      'niedrige energie', 'falsche zeit', 'müde', 'träge'
    ],
    whenToUse: ['You have low energy for habits', 'Timing doesn\'t work', 'You feel unmotivated at habit time'],
    steps: [
      'Track your energy levels for 1 week.',
      'Identify your peak energy times.',
      'Schedule challenging habits during peaks.',
      'Use low-energy times for easy habits.'
    ],
    examples: [
      'Morning person: Schedule workouts at 6 AM, creative work at 8 AM',
      'Night owl: Schedule important tasks in evening, easy tasks in morning',
      'Afternoon peak: Schedule challenging habits at 2 PM, admin tasks in morning',
      'Split schedule: Physical habits in morning, mental habits in afternoon'
    ],
    tips: [
      'Track energy levels for 1-2 weeks to find patterns',
      'Respect your natural rhythms, don\'t fight them',
      'Schedule 2-3 important habits during peak energy',
      'Use low-energy times for maintenance and easy tasks'
    ],
    sources: ['https://hbr.org/2007/10/manage-your-energy-not-your-time'],
    difficulty: 'Intermediate',
    timeToImplement: '15 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Battery',
    color: 'bg-green-500'
  },
  {
    id: 'micro-habits',
    name: 'Micro-Habits',
    emoji: '🔬',
    summary: 'Start with ridiculously small habits that are impossible to fail.',
    description: 'Micro-habits are habits so small they require almost no effort or motivation to complete. By starting with actions that are laughably easy, you eliminate resistance and build consistency. Over time, these micro-habits naturally expand into larger behaviors, but the focus remains on showing up consistently, not on intensity.',
    categories: ['motivation', 'routine'],
    keywords: ['micro', 'tiny', 'small', 'impossible to fail', 'start small', 'mini', 'winzig', 'klein'],
    problemPatterns: [
      'too ambitious', 'overwhelm', 'hard to start', 'fail quickly', 'too much', 'overwhelming',
      'zu ehrgeizig', 'überwältigend', 'schwer anzufangen', 'scheitern schnell'
    ],
    whenToUse: ['You\'re overwhelmed by the habit', 'You keep failing to start', 'Habits feel too big'],
    steps: [
      'Make the habit so small it\'s laughable.',
      'Focus on consistency, not intensity.',
      'Gradually increase after 2-4 weeks.',
      'Celebrate every completion.'
    ],
    examples: [
      '\"Exercise\" becomes \"Do one push-up\" (micro-habit version)',
      '\"Read\" becomes \"Read one paragraph\" (micro-habit version)',
      '\"Meditate\" becomes \"Take one deep breath\" (micro-habit version)',
      '\"Write\" becomes \"Write one sentence\" (micro-habit version)'
    ],
    tips: [
      'Make it so small you can\'t say no',
      'Focus on the habit of showing up, not the outcome',
      'Increase only after 2-4 weeks of 100% consistency',
      'The smaller the habit, the more likely you\'ll continue past it'
    ],
    sources: ['https://jamesclear.com/atomic-habits'],
    difficulty: 'Beginner',
    timeToImplement: '2 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Minus',
    color: 'bg-orange-500'
  },
  {
    id: 'identity-based-habits',
    name: 'Identity-Based Habits',
    emoji: '🆔',
    summary: 'Build habits around the person you want to become, not just outcomes.',
    description: 'Identity-based habits focus on changing who you are rather than just what you do. Instead of setting outcome-based goals, you shift your focus to becoming the type of person who naturally engages in those behaviors. This creates more sustainable change because actions align with identity.',
    categories: ['motivation'],
    keywords: ['identity', 'who you want to be', 'person you become', 'self-image', 'become', 'different person', 'identität', 'werden'],
    problemPatterns: [
      'focus on outcome', 'lose motivation', 'not sustainable', 'external motivation', 'want to become', 'become a different',
      'fokus auf ergebnis', 'verliere motivation', 'nicht nachhaltig'
    ],
    whenToUse: ['You focus too much on results', 'Habits don\'t feel meaningful', 'Outcome-based motivation fades'],
    steps: [
      'Decide who you want to become.',
      'Ask: "What would this person do daily?"',
      'Focus on being that person.',
      'Let outcomes follow naturally.'
    ],
    examples: [
      'Instead of "lose 20 pounds" → "I am someone who takes care of their body"',
      'Instead of "write a book" → "I am a writer" (then write daily)',
      'Instead of "run a marathon" → "I am a runner" (then run regularly)',
      'Instead of "be more organized" → "I am an organized person" (then organize daily)'
    ],
    tips: [
      'Use "I am" statements to reinforce identity',
      'Start with small actions that prove the identity',
      'Focus on one identity shift at a time',
      'Let your identity evolve naturally through consistent action'
    ],
    sources: ['https://jamesclear.com/identity-based-habits'],
    difficulty: 'Advanced',
    timeToImplement: '20 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'User',
    color: 'bg-orange-500'
  },
  {
    id: 'obstacle-mapping',
    name: 'Obstacle Mapping',
    emoji: '🗺️',
    summary: 'Identify and plan for potential obstacles before they derail you.',
    description: 'Obstacle mapping is the practice of anticipating potential barriers to your habits and creating specific plans to overcome them. By thinking through obstacles in advance and developing "if-then" responses, you prevent derailment and maintain consistency even when challenges arise.',
    categories: ['motivation', 'routine'],
    keywords: ['obstacles', 'barriers', 'plan ahead', 'anticipate problems', 'plan for obstacles', 'hindernisse', 'hürden', 'planung'],
    problemPatterns: [
      'get derailed', 'unexpected problems', 'obstacles stop you', 'no backup plan', 'need to plan for obstacles', 'plan for obstacles',
      'werde abgelenkt', 'unerwartete probleme', 'hindernisse stoppen mich', 'kein backup plan'
    ],
    whenToUse: ['You frequently get derailed', 'Obstacles surprise you', 'You need better preparation for challenges'],
    steps: [
      'List all possible obstacles.',
      'Create specific if-then plans for each.',
      'Practice your responses mentally.',
      'Adjust plans based on experience.'
    ],
    examples: [
      'Obstacle: "Too tired after work" → Plan: "If tired, then I\'ll do 5-minute version instead of skipping"',
      'Obstacle: "Travel disrupts routine" → Plan: "If traveling, then I\'ll do hotel room version of habit"',
      'Obstacle: "Bad weather prevents outdoor habit" → Plan: "If bad weather, then I\'ll do indoor alternative"',
      'Obstacle: "Forget necessary items" → Plan: "If items forgotten, then I\'ll use minimal version available"'
    ],
    tips: [
      'Think through your 5 most common obstacles',
      'Create specific, actionable "if-then" plans',
      'Visualize handling obstacles successfully',
      'Review and update obstacle plans monthly'
    ],
    sources: ['https://jamesclear.com/implementation-intentions'],
    difficulty: 'Advanced',
    timeToImplement: '30 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Map',
    color: 'bg-blue-500'
  },
  {
    id: 'habit-replacement',
    name: 'Habit Replacement',
    emoji: '🔄',
    summary: 'Replace a bad habit with a good one using the same cue and reward.',
    description: 'Habit replacement is a strategy for breaking unwanted habits by substituting them with better alternatives. Instead of trying to eliminate a habit entirely (which leaves a void), you keep the same cue and reward but change only the routine. This makes the transition easier because the brain already recognizes the pattern.',
    categories: ['routine', 'motivation'],
    keywords: ['replace', 'substitute', 'swap', 'change habit', 'bad habit', 'ersetzen', 'austauschen', 'gewohnheit ändern'],
    problemPatterns: [
      'bad habit', 'unwanted behavior', 'hard to stop', 'automatic response', 'difficult to break habit',
      'schlechte gewohnheit', 'unerwünschtes verhalten', 'schwer zu stoppen'
    ],
    whenToUse: ['You have a bad habit to break', 'You want to replace unwanted behavior', 'Stopping entirely feels too difficult'],
    steps: [
      'Identify the cue, routine, and reward.',
      'Keep the same cue and reward.',
      'Change only the routine.',
      'Practice the new routine consistently.'
    ],
    examples: [
      'Replace: Stress cue → Smoking → Relief reward → New: Stress cue → Deep breathing → Relief reward',
      'Replace: Boredom cue → Scrolling social media → Entertainment → New: Boredom cue → Read article → Entertainment',
      'Replace: After lunch cue → Dessert → Sweet reward → New: After lunch cue → Fruit → Sweet reward',
      'Replace: Evening cue → TV binge → Relaxation → New: Evening cue → Read book → Relaxation'
    ],
    tips: [
      'Identify the underlying need the bad habit serves',
      'Choose replacement that satisfies same need',
      'Start replacement immediately when cue appears',
      'Be patient: replacement takes 3-4 weeks to stick'
    ],
    sources: ['https://charlesduhigg.com/the-power-of-habit/'],
    difficulty: 'Intermediate',
    timeToImplement: '20 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'RefreshCw',
    color: 'bg-blue-500'
  },
  {
    id: 'streak-protection',
    name: 'Streak Protection',
    emoji: '🔥',
    summary: 'Strategies to maintain your streak even on difficult days.',
    description: 'Streak protection involves creating a minimum viable version of your habit that you can maintain even on the toughest days. By defining a "never zero" version of your habit, you protect your streak during difficult periods, maintaining momentum and preventing the psychological setback of breaking your chain.',
    categories: ['motivation', 'routine'],
    keywords: ['streak', 'don\'t break chain', 'maintain consistency', 'bad days', 'protect my streak', 'streak', 'kette', 'konsistenz'],
    problemPatterns: [
      'break streak', 'bad days', 'lose momentum', 'start over', 'breaking my habit streak', 'protect my streak',
      'streak brechen', 'schlechte tage', 'momentum verlieren', 'nochmal anfangen'
    ],
    whenToUse: ['You have a good streak going', 'Bad days threaten consistency', 'You want to avoid starting over'],
    steps: [
      'Define your minimum viable habit.',
      'Use it on tough days.',
      'Never miss twice in a row.',
      'Celebrate streak milestones.'
    ],
    examples: [
      'Regular workout: 30 min run → Streak protection: 5 min walk',
      'Regular meditation: 20 min → Streak protection: 2 min breathing',
      'Regular reading: 30 min → Streak protection: Read one page',
      'Regular writing: 1000 words → Streak protection: Write one sentence'
    ],
    tips: [
      'Define your minimum viable habit before you need it',
      'Never miss twice in a row is more important than perfect streaks',
      'Use streak protection on 20% of days maximum',
      'Celebrate reaching streak milestones (7, 30, 100 days)'
    ],
    sources: ['https://jamesclear.com/never-miss-twice'],
    difficulty: 'Intermediate',
    timeToImplement: '10 minutes',
    effectiveness: 5,
    language: 'both',
    icon: 'Flame',
    color: 'bg-orange-500'
  },
  {
    id: 'environmental-triggers',
    name: 'Environmental Triggers',
    emoji: '🎯',
    summary: 'Use visual and physical cues in your environment to trigger habits.',
    description: 'Environmental triggers are physical or visual cues in your environment that automatically remind you to perform a habit. By strategically placing these triggers where you\'ll naturally encounter them, you remove the need to remember the habit and create automatic associations between your environment and your behavior.',
    categories: ['environment', 'routine'],
    keywords: ['triggers', 'cues', 'visual reminders', 'environmental signals', 'trigger', 'hinweise', 'erinnerungen'],
    problemPatterns: [
      'forget to start', 'no reminders', 'inconsistent triggers', 'environment doesn\'t help', 'hard to remember',
      'vergessen anzufangen', 'keine erinnerungen', 'umgebung hilft nicht'
    ],
    whenToUse: ['You forget to start habits', 'You need stronger cues', 'Visual reminders help you'],
    steps: [
      'Choose obvious visual triggers.',
      'Place them where you can\'t miss them.',
      'Make triggers specific to the habit.',
      'Change triggers if they stop working.'
    ],
    examples: [
      'Water bottle on desk triggers hydration habit',
      'Workout clothes on bed triggers morning exercise',
      'Guitar in living room triggers daily practice',
      'Journal on nightstand triggers evening reflection'
    ],
    tips: [
      'Make triggers impossible to miss',
      'Place triggers at the point of performance',
      'Use multiple triggers for important habits',
      'Refresh triggers if they become invisible over time'
    ],
    sources: ['https://jamesclear.com/environment-design'],
    difficulty: 'Beginner',
    timeToImplement: '10 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'Eye',
    color: 'bg-teal-500'
  },
  {
    id: 'social-contract',
    name: 'Social Contract',
    emoji: '📝',
    summary: 'Make a public commitment to your habit to increase accountability.',
    description: 'A social contract involves making a public commitment to your habit, sharing your goals and progress with others. This creates social accountability - the psychological pressure and motivation that comes from knowing others are aware of your commitments. The desire to maintain social standing and avoid letting others down increases follow-through.',
    categories: ['motivation', 'environment'],
    keywords: ['public commitment', 'social pressure', 'announce goals', 'accountability', 'öffentlich', 'verpflichtung', 'verantwortlichkeit'],
    problemPatterns: [
      'no accountability', 'easy to quit', 'private goals', 'lack motivation', 'give up easily',
      'keine verantwortlichkeit', 'leicht aufzugeben', 'private ziele'
    ],
    whenToUse: ['You need stronger accountability', 'Private commitments aren\'t enough', 'You respond well to social pressure'],
    steps: [
      'Announce your habit publicly.',
      'Share progress regularly.',
      'Ask for support from others.',
      'Use social pressure positively.'
    ],
    examples: [
      'Post on social media: "30-day meditation challenge, daily check-ins"',
      'Tell family/friends: "I\'m running every morning, ask me how it\'s going"',
      'Join accountability group: Share goals and weekly progress',
      'Public blog: Document habit journey, share updates with readers'
    ],
    tips: [
      'Be specific about your commitment and timeline',
      'Choose the right audience: supportive but honest',
      'Share progress regularly, not just announcements',
      'Use positive social pressure, not shame-based'
    ],
    sources: ['https://www.psychologytoday.com/us/blog/tech-happy-life/201204/accountability-partners'],
    difficulty: 'Beginner',
    timeToImplement: '5 minutes',
    effectiveness: 4,
    language: 'both',
    icon: 'FileSignature',
    color: 'bg-orange-500'
  }
];
