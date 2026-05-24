// Extended achievements v2 — additional achievements for new features
import { StatsTracker } from './stats';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'gameplay' | 'skill' | 'dedication' | 'social' | 'discovery';
}

export const EXTENDED_ACHIEVEMENTS: AchievementDef[] = [
  // Skill achievements
  {
    id: 'perfect_round',
    name: 'Perfect Round',
    description: 'Score 180 in a single round (T20 × 3)',
    icon: '💎',
    category: 'skill',
  },
  {
    id: 'sniper',
    name: 'Sniper',
    description: 'Hit the same segment 3 times in one round',
    icon: '🎯',
    category: 'skill',
  },
  {
    id: 'bullseye_streak',
    name: 'Bulls Eye Streak',
    description: 'Hit 3 bullseyes in a row',
    icon: '🐂',
    category: 'skill',
  },
  {
    id: 'checkout_master',
    name: 'Checkout Master',
    description: 'Finish a 501 game with a checkout of 100+',
    icon: '🏁',
    category: 'skill',
  },
  {
    id: 'no_miss_game',
    name: 'Flawless',
    description: 'Complete an entire game without missing the board',
    icon: '✨',
    category: 'skill',
  },

  // Dedication achievements
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Play 100 total games',
    icon: '🏃',
    category: 'dedication',
  },
  {
    id: 'thousand_darts',
    name: 'Thousand Darts',
    description: 'Throw 1000 total darts',
    icon: '🎪',
    category: 'dedication',
  },
  {
    id: 'daily_player',
    name: 'Daily Player',
    description: 'Complete 7 daily challenges',
    icon: '📅',
    category: 'dedication',
  },
  {
    id: 'all_modes',
    name: 'Well Rounded',
    description: 'Play every game mode at least once',
    icon: '🌍',
    category: 'dedication',
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Unlock all 15 dart skins',
    icon: '💰',
    category: 'dedication',
  },

  // Discovery achievements
  {
    id: 'power_up_user',
    name: 'Power Player',
    description: 'Use 10 power-ups total',
    icon: '⚡',
    category: 'discovery',
  },
  {
    id: 'replay_watcher',
    name: 'Replay Fan',
    description: 'Watch 5 instant replays',
    icon: '📹',
    category: 'discovery',
  },
  {
    id: 'warm_up_pro',
    name: 'Warm Up Pro',
    description: 'Average 60+ in warm-up throws',
    icon: '🔥',
    category: 'discovery',
  },
  {
    id: 'theme_explorer',
    name: 'Theme Explorer',
    description: 'Try all 5 board themes',
    icon: '🎨',
    category: 'discovery',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Play a game after midnight local time',
    icon: '🦉',
    category: 'discovery',
  },
];

// Total achievements: 36 (base) + 15 (extended) = 51
export function getAllAchievementCount(): number {
  return 36 + EXTENDED_ACHIEVEMENTS.length;
}

export function getCategoryAchievements(category: AchievementDef['category']): AchievementDef[] {
  return EXTENDED_ACHIEVEMENTS.filter(a => a.category === category);
}
