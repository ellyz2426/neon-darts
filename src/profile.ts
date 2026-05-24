// Player profile — persistent name, avatar color, stats preferences
const PROFILE_KEY = 'neondarts_profile';

export interface PlayerProfile {
  nickname: string;
  avatarColor: string; // hex color
  preferredHand: 'right' | 'left';
  soundVolume: number; // 0-1
  musicVolume: number; // 0-1
  hapticEnabled: boolean;
  showHints: boolean;
}

const DEFAULT_PROFILE: PlayerProfile = {
  nickname: 'Player 1',
  avatarColor: '#00ffff',
  preferredHand: 'right',
  soundVolume: 0.8,
  musicVolume: 0.4,
  hapticEnabled: true,
  showHints: true,
};

export class ProfileManager {
  profile: PlayerProfile;

  constructor() {
    this.profile = { ...DEFAULT_PROFILE };
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this.profile = { ...DEFAULT_PROFILE, ...saved };
      }
    } catch {
      this.profile = { ...DEFAULT_PROFILE };
    }
  }

  save() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
    } catch { /* ignore */ }
  }

  setNickname(name: string) {
    this.profile.nickname = name.trim().slice(0, 16) || 'Player 1';
    this.save();
  }

  setAvatarColor(color: string) {
    this.profile.avatarColor = color;
    this.save();
  }

  setSoundVolume(vol: number) {
    this.profile.soundVolume = Math.max(0, Math.min(1, vol));
    this.save();
  }

  setMusicVolume(vol: number) {
    this.profile.musicVolume = Math.max(0, Math.min(1, vol));
    this.save();
  }

  toggleHaptic() {
    this.profile.hapticEnabled = !this.profile.hapticEnabled;
    this.save();
  }

  toggleHand() {
    this.profile.preferredHand = this.profile.preferredHand === 'right' ? 'left' : 'right';
    this.save();
  }

  toggleHints() {
    this.profile.showHints = !this.profile.showHints;
    this.save();
  }

  get nickname(): string {
    return this.profile.nickname;
  }

  readonly AVATAR_COLORS = [
    '#00ffff', '#ff00ff', '#00ff88', '#ff6600',
    '#ffff00', '#ff0066', '#8844ff', '#44ff44',
  ];

  cycleColor(): string {
    const idx = this.AVATAR_COLORS.indexOf(this.profile.avatarColor);
    const next = (idx + 1) % this.AVATAR_COLORS.length;
    this.setAvatarColor(this.AVATAR_COLORS[next]);
    return this.profile.avatarColor;
  }
}
