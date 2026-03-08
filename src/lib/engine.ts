import { TIERS } from './data';
import { TierDef } from '../types';

/**
 * 경험치 곡선 계산 (XP Curve)
 * 공식: Next_Max_XP = Current_Max_XP * 1.25
 * 초기 설정: Lv.1 -> Lv.2 는 100 XP
 */
export function getXpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;

    let totalXp = 0;
    let currentLevelXpDist = 100;

    for (let i = 1; i < level; i++) {
        totalXp += currentLevelXpDist;
        currentLevelXpDist = Math.floor(currentLevelXpDist * 1.25);
    }

    return totalXp;
}

export function getLevelFromTotalXp(totalXp: number): number {
    let level = 1;
    let accumulatedXp = 0;
    let currentLevelXpDist = 100;

    while (totalXp >= accumulatedXp + currentLevelXpDist) {
        accumulatedXp += currentLevelXpDist;
        level++;
        currentLevelXpDist = Math.floor(currentLevelXpDist * 1.25);
    }

    return level;
}

export function getXpProgressForCurrentLevel(totalXp: number): {
    currentLevelXp: number;
    xpRequiredForNextLevel: number;
    percentage: number;
} {
    const currentLevel = getLevelFromTotalXp(totalXp);
    const baseXpForCurrentLevel = getXpRequiredForLevel(currentLevel);
    const nextLevelXpRequiredDist = getXpRequiredForLevel(currentLevel + 1) - baseXpForCurrentLevel;

    const currentLevelXp = totalXp - baseXpForCurrentLevel;
    const percentage = (currentLevelXp / nextLevelXpRequiredDist) * 100;

    return {
        currentLevelXp,
        xpRequiredForNextLevel: nextLevelXpRequiredDist,
        percentage: Math.min(Math.max(percentage, 0), 100)
    };
}

export function getTierForLevel(level: number): TierDef {
    return TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) || TIERS[TIERS.length - 1];
}
