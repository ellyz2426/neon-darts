// Achievement system
import { GameManager, GameMode } from './game';
import { ScoreResult } from './dartboard';
import { StatsTracker } from './stats';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

const ACHIEVEMENTS_KEY = 'neon-darts-achievements';

export class AchievementManager {
  achievements: Achievement[] = [
    { id: 'first-game', name: 'First Steps', description: 'Complete your first game', unlocked: false },
    { id: 'bullseye', name: 'Bulls Eye!', description: 'Hit the bullseye', unlocked: false },
    { id: 'triple-20', name: 'Top Score', description: 'Hit a triple 20', unlocked: false },
    { id: 'one-eighty', name: '180!', description: 'Score 180 in a single turn', unlocked: false },
    { id: 'first-win', name: 'Winner!', description: 'Win your first game', unlocked: false },
    { id: 'hat-trick', name: 'Hat Trick', description: 'Hit 3 bullseyes in one turn', unlocked: false },
    { id: 'five-wins', name: 'Regular', description: 'Win 5 games', unlocked: false },
    { id: 'ten-wins', name: 'Veteran', description: 'Win 10 games', unlocked: false },
    { id: 'cricket-closer', name: 'Cricket Closer', description: 'Win a game of Cricket', unlocked: false },
    { id: 'shanghai', name: 'Shanghai!', description: 'Hit single, double, and triple of same number in one turn', unlocked: false },
    { id: 'clock-master', name: 'Clock Master', description: 'Win Around the Clock', unlocked: false },
    { id: 'perfect-leg', name: 'Perfect Leg', description: 'Finish 501 in 9 darts or less', unlocked: false },
    { id: 'accuracy-80', name: 'Sharpshooter', description: 'Achieve 80%+ accuracy in a game', unlocked: false },
    { id: 'all-doubles', name: 'Double or Nothing', description: 'Hit all 20 doubles', unlocked: false },
    { id: 'hundred-games', name: 'Centurion', description: 'Play 100 games', unlocked: false },
    { id: 'ton-plus', name: 'Ton Plus', description: 'Score 100+ in a single turn', unlocked: false },
    { id: 'no-miss-turn', name: 'Precision', description: 'Complete 10 turns with no misses', unlocked: false },
    { id: 'triple-triple', name: 'Triple Threat', description: 'Hit 3 triples in one turn', unlocked: false },
    { id: 'beat-hard-ai', name: 'AI Slayer', description: 'Beat the Hard AI', unlocked: false },
    { id: 'all-modes', name: 'Versatile', description: 'Win in all 4 game modes', unlocked: false },
    { id: 'tournament-win', name: 'Champion', description: 'Win the tournament', unlocked: false },
    { id: 'daily-complete', name: 'Daily Grind', description: 'Complete a daily challenge', unlocked: false },
    { id: 'daily-streak-5', name: 'Streak Week', description: 'Complete 5 daily challenges', unlocked: false },
    { id: 'nine-darter', name: 'Nine Darter', description: 'Finish 501 in exactly 9 darts', unlocked: false },
    { id: 'all-20s', name: 'Segment Master', description: 'Hit all 20 board segments in one game', unlocked: false },
    { id: 'comeback', name: 'Comeback Kid', description: 'Win a game after trailing by 100+ points', unlocked: false },
    { id: 'skin-collector', name: 'Fashionista', description: 'Try all 10 dart skins', unlocked: false },
    { id: 'theme-explorer', name: 'Interior Designer', description: 'Try all 5 board themes', unlocked: false },
    { id: 'fifty-wins', name: 'Legend', description: 'Win 50 games', unlocked: false },
    { id: 'speed-finish', name: 'Lightning Round', description: 'Finish any game in under 5 rounds', unlocked: false },
    { id: 'killer-win', name: 'Killer Instinct', description: 'Win a game of Killer', unlocked: false },
    { id: 'killer-no-loss', name: 'Untouchable', description: 'Win Killer without losing a life', unlocked: false },
    { id: 'profile-custom', name: 'Identity Crisis', description: 'Customize your profile', unlocked: false },
    { id: 'rematch-5', name: 'Rematch King', description: 'Use Quick Rematch 5 times', unlocked: false },
    { id: 'history-10', name: 'Historian', description: 'Play 10 tracked matches', unlocked: false },
  ];

  private stats: StatsTracker;
  public onUnlock: ((achievement: Achievement) => void) | null = null;

  constructor(stats: StatsTracker) {
    this.stats = stats;
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (saved) {
        const unlocked: string[] = JSON.parse(saved);
        for (const a of this.achievements) {
          a.unlocked = unlocked.includes(a.id);
        }
      }
    } catch {}
  }

  private save() {
    try {
      const unlocked = this.achievements.filter(a => a.unlocked).map(a => a.id);
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    } catch {}
  }

  unlock(id: string) {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.save();
      if (this.onUnlock) this.onUnlock(achievement);
    }
  }

  checkAll(game: GameManager, result: ScoreResult | null) {
    const s = this.stats.stats;

    // Throw-based
    if (result) {
      if (result.segment === 25 && result.multiplier === 2) this.unlock('bullseye');
      if (result.segment === 20 && result.multiplier === 3) this.unlock('triple-20');
      if (result.total >= 100) this.unlock('ton-plus');
    }

    // Turn-based
    if (game.currentTurnThrows.length === 3) {
      const turnTotal = game.currentTurnThrows.reduce((sum, t) => sum + t.total, 0);
      if (turnTotal === 180) this.unlock('one-eighty');
      if (turnTotal >= 100) this.unlock('ton-plus');

      const allBulls = game.currentTurnThrows.every(t => t.segment === 25 && t.multiplier === 2);
      if (allBulls) this.unlock('hat-trick');

      const allTriples = game.currentTurnThrows.every(t => t.multiplier === 3);
      if (allTriples) this.unlock('triple-triple');
    }

    // Game-based
    if (game.isGameOver()) {
      this.unlock('first-game');
      if (game.getWinner() === 1) {
        this.unlock('first-win');
        if (game.mode === GameMode.Cricket) this.unlock('cricket-closer');
        if (game.mode === GameMode.AroundTheClock) this.unlock('clock-master');
      }
    }

    // Stats-based
    if (s.gamesWon >= 5) this.unlock('five-wins');
    if (s.gamesWon >= 10) this.unlock('ten-wins');
    if (s.gamesPlayed >= 100) this.unlock('hundred-games');
    if (s.oneEighties > 0) this.unlock('one-eighty');

    // Check all modes won
    if (s.fiveOhOneWins > 0 && s.cricketWins > 0 && s.shanghaiWins > 0 && s.aroundTheClockWins > 0) {
      this.unlock('all-modes');
    }

    // New achievements
    if (s.gamesWon >= 50) this.unlock('fifty-wins');
  }

  // External triggers for new achievements
  unlockTournament() { this.unlock('tournament-win'); }
  unlockDaily() { this.unlock('daily-complete'); }
  unlockDailyStreak(count: number) { if (count >= 5) this.unlock('daily-streak-5'); }
  unlockSkinCollector() { this.unlock('skin-collector'); }
  unlockThemeExplorer() { this.unlock('theme-explorer'); }
  unlockKillerWin() { this.unlock('killer-win'); }
  unlockKillerNoLoss() { this.unlock('killer-no-loss'); }
  unlockProfileCustom() { this.unlock('profile-custom'); }
  unlockRematchKing(count: number) { if (count >= 5) this.unlock('rematch-5'); }
  unlockHistorian(count: number) { if (count >= 10) this.unlock('history-10'); }

  getUnlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  getTotalCount(): number {
    return this.achievements.length;
  }
}
