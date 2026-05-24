// Extended dart skins v2 — 5 additional premium skins (15 total)
import { Color } from '@iwsdk/core';

export interface DartSkinV2 {
  id: string;
  name: string;
  barrel: Color;
  flight: Color;
  tip: Color;
  emissive: Color;
  emissiveIntensity: number;
  trailColor: Color;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition?: string;
}

export const EXTENDED_SKINS: DartSkinV2[] = [
  {
    id: 'void-walker',
    name: 'Void Walker',
    barrel: new Color(0x1a0033),
    flight: new Color(0x6600cc),
    tip: new Color(0x9933ff),
    emissive: new Color(0x6600cc),
    emissiveIntensity: 0.8,
    trailColor: new Color(0x9933ff),
    rarity: 'epic',
    unlockCondition: 'Win 10 games in Killer mode',
  },
  {
    id: 'solar-wind',
    name: 'Solar Wind',
    barrel: new Color(0xffcc00),
    flight: new Color(0xff8800),
    tip: new Color(0xff4400),
    emissive: new Color(0xff8800),
    emissiveIntensity: 0.9,
    trailColor: new Color(0xffaa00),
    rarity: 'rare',
    unlockCondition: 'Complete a Daily Challenge with 100+ avg',
  },
  {
    id: 'quantum-shift',
    name: 'Quantum Shift',
    barrel: new Color(0x00ffaa),
    flight: new Color(0x00aaff),
    tip: new Color(0x0066ff),
    emissive: new Color(0x00ccff),
    emissiveIntensity: 1.0,
    trailColor: new Color(0x00ffcc),
    rarity: 'legendary',
    unlockCondition: 'Win a Tournament without losing a round',
  },
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    barrel: new Color(0x660000),
    flight: new Color(0xcc0000),
    tip: new Color(0xff3333),
    emissive: new Color(0xcc0000),
    emissiveIntensity: 0.7,
    trailColor: new Color(0xff2222),
    rarity: 'rare',
    unlockCondition: 'Hit 3 bullseyes in a single game',
  },
  {
    id: 'diamond-dust',
    name: 'Diamond Dust',
    barrel: new Color(0xcccccc),
    flight: new Color(0xffffff),
    tip: new Color(0xaaeeff),
    emissive: new Color(0xffffff),
    emissiveIntensity: 1.2,
    trailColor: new Color(0xeeeeff),
    rarity: 'legendary',
    unlockCondition: 'Earn 30 achievements',
  },
];

export function getSkinById(id: string): DartSkinV2 | undefined {
  return EXTENDED_SKINS.find(s => s.id === id);
}

export function getSkinsByRarity(rarity: DartSkinV2['rarity']): DartSkinV2[] {
  return EXTENDED_SKINS.filter(s => s.rarity === rarity);
}

export function getRarityColor(rarity: DartSkinV2['rarity']): string {
  switch (rarity) {
    case 'common': return '#cccccc';
    case 'rare': return '#00aaff';
    case 'epic': return '#aa00ff';
    case 'legendary': return '#ffaa00';
  }
}

export function isUnlocked(skinId: string, achievements: Set<string>, stats: Record<string, number>): boolean {
  const skin = getSkinById(skinId);
  if (!skin || !skin.unlockCondition) return true;
  // Unlock logic delegated to achievement system
  return false;
}
