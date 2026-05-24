// Commentator system — dynamic commentary based on game events
export type CommentaryEvent =
  | 'throw_single'
  | 'throw_double'
  | 'throw_triple'
  | 'throw_bullseye'
  | 'throw_miss'
  | 'throw_180'
  | 'checkout'
  | 'bust'
  | 'combo_3'
  | 'combo_5'
  | 'combo_7'
  | 'game_start'
  | 'game_win'
  | 'game_lose'
  | 'round_start'
  | 'shanghai'
  | 'triple_20'
  | 'high_score'
  | 'close_game';

interface CommentaryLine {
  text: string;
  weight: number; // Higher = more likely
}

const COMMENTARY: Record<CommentaryEvent, CommentaryLine[]> = {
  throw_single: [
    { text: 'Solid throw.', weight: 3 },
    { text: 'On the board.', weight: 2 },
    { text: 'That\'ll do.', weight: 2 },
    { text: 'Right where they wanted it.', weight: 1 },
    { text: 'Clean.', weight: 2 },
  ],
  throw_double: [
    { text: 'Double! Nice shot!', weight: 3 },
    { text: 'Lands in the double ring!', weight: 2 },
    { text: 'Precision on that double!', weight: 2 },
    { text: 'The thin wire pays off!', weight: 1 },
  ],
  throw_triple: [
    { text: 'TRIPLE! What a dart!', weight: 3 },
    { text: 'Into the treble! Brilliant!', weight: 2 },
    { text: 'Finding the narrow bed!', weight: 2 },
    { text: 'Oh, that\'s a beauty!', weight: 1 },
    { text: 'Right in the money!', weight: 2 },
  ],
  throw_bullseye: [
    { text: 'BULLSEYE! Outstanding!', weight: 3 },
    { text: 'Right in the red! What a throw!', weight: 2 },
    { text: 'The BULL! Maximum drama!', weight: 2 },
    { text: 'Center of the universe!', weight: 1 },
  ],
  throw_miss: [
    { text: 'Off the board...', weight: 3 },
    { text: 'That one got away.', weight: 2 },
    { text: 'No score there.', weight: 2 },
    { text: 'Unfortunate.', weight: 2 },
  ],
  throw_180: [
    { text: '🎯 ONE HUNDRED AND EIGHTY! 🎯', weight: 5 },
    { text: 'MAXIMUM! 180! INCREDIBLE!', weight: 3 },
    { text: 'It\'s a PERFECT score! 180!', weight: 3 },
  ],
  checkout: [
    { text: 'Game shot! What a finish!', weight: 3 },
    { text: 'Takes the double! Game over!', weight: 2 },
    { text: 'Clinical checkout!', weight: 2 },
    { text: 'That\'s the leg!', weight: 2 },
  ],
  bust: [
    { text: 'BUST! Over the target!', weight: 3 },
    { text: 'Oh no, gone past the number!', weight: 2 },
    { text: 'Busted! Back to the previous score.', weight: 2 },
  ],
  combo_3: [
    { text: '3x combo! On fire!', weight: 3 },
    { text: 'Three in a row! Nice streak!', weight: 2 },
    { text: 'Hat trick!', weight: 2 },
  ],
  combo_5: [
    { text: '5x COMBO! Unstoppable!', weight: 3 },
    { text: 'FIVE consecutive hits! Incredible form!', weight: 2 },
  ],
  combo_7: [
    { text: '7x COMBO! Absolutely PHENOMENAL!', weight: 3 },
    { text: 'SEVEN! They can\'t miss!', weight: 2 },
  ],
  game_start: [
    { text: 'Game on!', weight: 3 },
    { text: 'Let\'s play darts!', weight: 2 },
    { text: 'Approach the oche!', weight: 1 },
  ],
  game_win: [
    { text: 'Victory! Congratulations!', weight: 3 },
    { text: 'You did it! Champion!', weight: 2 },
    { text: 'Winner winner!', weight: 2 },
  ],
  game_lose: [
    { text: 'Better luck next time!', weight: 3 },
    { text: 'The opponent takes it!', weight: 2 },
    { text: 'Close game! Try again!', weight: 2 },
  ],
  round_start: [
    { text: 'New round!', weight: 3 },
    { text: 'Three darts at the ready.', weight: 2 },
    { text: 'Your throw.', weight: 2 },
  ],
  shanghai: [
    { text: 'SHANGHAI! Instant win!', weight: 5 },
    { text: 'Single-Double-Triple! SHANGHAI!', weight: 3 },
  ],
  triple_20: [
    { text: 'Triple 20! Maximum single dart!', weight: 3 },
    { text: 'T20! The perfect dart!', weight: 2 },
    { text: '60! Top of the board!', weight: 2 },
  ],
  high_score: [
    { text: 'New personal best! 🏆', weight: 3 },
    { text: 'That\'s a record-breaker!', weight: 2 },
  ],
  close_game: [
    { text: 'This one is TIGHT!', weight: 3 },
    { text: 'Nail-biter! Either player could take it!', weight: 2 },
    { text: 'Edge of your seat stuff!', weight: 2 },
  ],
};

export class CommentatorManager {
  private enabled = true;
  private lastComment = '';
  private cooldown = 0;
  private recentEvents: Set<string> = new Set();

  constructor() {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getComment(event: CommentaryEvent): string | null {
    if (!this.enabled) return null;
    if (this.cooldown > 0) return null;

    const lines = COMMENTARY[event];
    if (!lines || lines.length === 0) return null;

    // Weighted random selection, avoiding repeats
    const totalWeight = lines.reduce((sum, l) => sum + l.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const line of lines) {
      roll -= line.weight;
      if (roll <= 0) {
        if (line.text === this.lastComment) continue;
        this.lastComment = line.text;
        this.cooldown = event === 'throw_single' ? 2 : 0; // Cooldown on common events
        return line.text;
      }
    }

    return lines[0].text;
  }

  update(dt: number): void {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  reset(): void {
    this.lastComment = '';
    this.cooldown = 0;
    this.recentEvents.clear();
  }
}
