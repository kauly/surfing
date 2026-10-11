export const FOAM_ADVANCE_RATE = {
  easy: 0.12,
  normal: 0.20,
  hard: 0.28,
} as const;

export type Difficulty = keyof typeof FOAM_ADVANCE_RATE;
export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

export function resolveDifficulty(value: unknown): Difficulty {
  return value === 'easy' || value === 'normal' || value === 'hard'
    ? value : DEFAULT_DIFFICULTY;
}
