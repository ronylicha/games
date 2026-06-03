import AsyncStorage from '@react-native-async-storage/async-storage';

import { LevelResult, StreetBrawlProgress } from './types';

const storageKey = 'games:street-brawl:progress';

export const initialStreetBrawlProgress: StreetBrawlProgress = {
  currentLevel: 1,
  highestUnlockedLevel: 1,
  completedLevels: {},
};

export async function loadStreetBrawlProgress(): Promise<StreetBrawlProgress> {
  const stored = await AsyncStorage.getItem(storageKey);
  if (!stored) {
    return initialStreetBrawlProgress;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StreetBrawlProgress>;
    return normalizeProgress(parsed);
  } catch {
    return initialStreetBrawlProgress;
  }
}

export async function saveCurrentStreetBrawlLevel(level: number, progress: StreetBrawlProgress) {
  const next = normalizeProgress({
    ...progress,
    currentLevel: level,
    highestUnlockedLevel: Math.max(progress.highestUnlockedLevel, level),
  });
  await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export async function saveStreetBrawlLevelResult(
  level: number,
  result: LevelResult,
  progress: StreetBrawlProgress,
) {
  const key = String(level);
  const previous = progress.completedLevels[key];
  const merged: LevelResult = previous
    ? {
        bestScore: Math.max(previous.bestScore, result.bestScore),
        bestRank: betterRank(previous.bestRank, result.bestRank),
        bestTime: Math.min(previous.bestTime, result.bestTime),
      }
    : result;

  const next = normalizeProgress({
    ...progress,
    currentLevel: Math.min(50, level + 1),
    highestUnlockedLevel: Math.max(progress.highestUnlockedLevel, Math.min(50, level + 1)),
    completedLevels: {
      ...progress.completedLevels,
      [key]: merged,
    },
  });

  await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

function normalizeProgress(progress: Partial<StreetBrawlProgress>): StreetBrawlProgress {
  const currentLevel = clampLevel(progress.currentLevel ?? 1);
  const highestUnlockedLevel = clampLevel(progress.highestUnlockedLevel ?? currentLevel);
  return {
    currentLevel,
    highestUnlockedLevel: Math.max(currentLevel, highestUnlockedLevel),
    completedLevels: progress.completedLevels ?? {},
  };
}

function clampLevel(level: number) {
  return Math.max(1, Math.min(50, Math.floor(level)));
}

function betterRank(a: LevelResult['bestRank'], b: LevelResult['bestRank']) {
  const ranks = ['C', 'B', 'A', 'S'];
  return ranks.indexOf(b) > ranks.indexOf(a) ? b : a;
}
