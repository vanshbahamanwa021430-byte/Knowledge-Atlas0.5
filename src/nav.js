// Information architecture: every screen lives in exactly one of five groups (bottom tabs / sidebar groups).
// Pure data so the reachability test can check that nothing is lost (tests/nav.test.js).
export const GROUPS = [
  { tab: 'home', label: 'Home', icon: 'home', views: ['home'] },
  { tab: 'library', label: 'Study', icon: 'study', views: ['library', 'study', 'section', 'notes', 'smarty', 'code', 'chat', 'cards'],
    links: [['library', 'library', 'Documents', 'Import and open your files'], ['study', 'map', 'Study map', 'Sections, outline and explanations'], ['smarty', 'brain', 'Smarty', 'Your tutor: ask, with citations and diagrams'], ['code', 'code', 'Smarty Code', 'Learn to code: plan, test, implement, review'], ['chat', 'chat', 'AI Chat', 'Ask about one document'], ['notes', 'sticky', 'Notes', 'Everything you’ve written'], ['cards', 'cards', 'Flashcards', 'Spaced repetition']] },
  { tab: 'practice', label: 'Practice', icon: 'test', views: ['practice', 'test', 'results', 'errors', 'examlab'],
    links: [['test', 'test', 'Practice test', 'From your document, any exam style'], ['examlab', 'grad', 'Past papers and exams', 'End Sem prep and custom exams'], ['smarty:practice', 'target', 'Weak-topic practice', 'Smarty picks your weak topics'], ['errors', 'alert', 'Mistakes', 'Retry what you got wrong'], ['results', 'trophy', 'Results', 'Scores and model answers']] },
  { tab: 'plan', label: 'Plan', icon: 'calendar', views: ['plan', 'planner', 'focus', 'progress'],
    links: [['planner', 'calendar', 'Planner and reminders', 'Exams, to-dos, goals, reminders'], ['focus', 'timer', 'Focus timer', 'Pomodoro with focus sounds'], ['progress', 'trend', 'Progress', 'Streaks, levels and badges']] },
  { tab: 'more', label: 'More', icon: 'more', views: ['more', 'settings', 'about', 'report', 'beta', 'licenses', 'privacy', 'terms', 'dev'],
    links: [['settings', 'settings', 'Settings', 'Appearance, AI, study, notifications, data'], ['settings:look-h', 'palette', 'Themes', 'Seven looks'], ['settings:ai-h', 'plug', 'Smarty’s brain', 'Free option, your own key, custom endpoint'], ['about', 'info', 'About us', 'Updates, credits, suggestions'], ['report', 'bug', 'Report a problem', 'Help: tell us what went wrong'], ['privacy', 'lock', 'Privacy policy', 'What stays on your device'], ['terms', 'file', 'Terms and disclaimer', 'Study aid only'], ['licenses', 'outline', 'Open-source licences', 'Credits and licence texts'], ['beta', 'flask', 'Beta features', 'Testers: early features and quick reports'], ['dev', 'terminal', 'Developer panel', 'Owner and co-developers: logs, errors, flags']] }
];
export const TAB_OF = Object.fromEntries(GROUPS.flatMap(g => g.views.map(v => [v, g.tab])));
export const ALL_VIEWS = GROUPS.flatMap(g => g.views);
