// Audio manager — procedural Web Audio effects
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  
  masterVolume = 0.7;
  sfxVolume = 0.8;
  musicVolume = 0.3;

  setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
  }

  setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
  }

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.startAmbient();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private startAmbient() {
    if (!this.ctx || !this.musicGain) return;

    // Deep ambient drone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    // Pad
    const pad = this.ctx.createOscillator();
    pad.type = 'triangle';
    pad.frequency.value = 110;
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.08;
    pad.connect(padGain);
    padGain.connect(this.musicGain);
    pad.start();

    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0.12;
    osc.connect(oscGain);
    oscGain.connect(this.musicGain);
    osc.start();

    this.ambientOsc = osc;
    this.ambientLfo = lfo;
  }

  setVolume(type: 'master' | 'sfx' | 'music', value: number) {
    value = Math.max(0, Math.min(1, value));
    switch (type) {
      case 'master':
        this.masterVolume = value;
        if (this.masterGain) this.masterGain.gain.value = value;
        break;
      case 'sfx':
        this.sfxVolume = value;
        if (this.sfxGain) this.sfxGain.gain.value = value;
        break;
      case 'music':
        this.musicVolume = value;
        if (this.musicGain) this.musicGain.gain.value = value;
        break;
    }
  }

  playThrow(power: number) {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    // Whoosh — filtered noise
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800 + power * 1200;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.value = 0.3 + power * 0.3;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start();
  }

  playHit(result: { total: number; multiplier: number; segment: number }) {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    // Thud/stick sound
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 200;
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

    const gain = ctx.createGain();
    gain.gain.value = 0.4;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);

    // Bonus chime for high scores
    if (result.multiplier >= 2 || result.segment === 25) {
      setTimeout(() => this.playScoreChime(result), 50);
    }
  }

  private playScoreChime(result: { total: number; multiplier: number; segment: number }) {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    const baseFreq = result.segment === 25 ? 880 : (result.multiplier === 3 ? 660 : 523);
    const notes = result.segment === 25 && result.multiplier === 2
      ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2]
      : [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
  }

  playMiss() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    // Dull thud
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 100;
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  playGameStart() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    const notes = [262, 330, 392, 523];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
  }

  playGameOver(won: boolean) {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    if (won) {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.6);
      });
    } else {
      const notes = [400, 350, 300, 200];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.5);
      });
    }
  }

  playAchievement() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.35);
    });
  }

  playButtonClick() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 600;

    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  playTurnChange() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 440;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 554;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc2.start(ctx.currentTime + 0.06);
    osc.stop(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.16);
  }

  playKill() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    // Aggressive descending tone — "kill" hit
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 600;
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  playElimination() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    // Dramatic elimination chord
    const freqs = [220, 277, 330, 165];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 3 ? 'square' : 'sawtooth';
      osc.frequency.value = f;

      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + 0.7);
    });
  }

  playLifeGain() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    // Ascending cheerful tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 400;
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);

    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  playRematch() {
    const ctx = this.ensureContext();
    if (!this.sfxGain) return;

    // Quick ascending triplet
    [523, 659, 784].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;

      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.1);
    });
  }
}
