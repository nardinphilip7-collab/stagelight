import type { Discipline } from './types';

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  actor: 'Actor',
  singer: 'Singer',
  dancer: 'Dancer',
  musician: 'Musician',
  voice_actor: 'Voice Actor',
  comedian: 'Comedian',
  presenter: 'Presenter',
  director: 'Director',
};

export const REEL_TYPE_LABELS: Record<string, string> = {
  monologue: 'Monologue',
  song: 'Song',
  dance: 'Dance',
  voice_demo: 'Voice Demo',
  comedy: 'Comedy',
  reel: 'Showreel',
  cover: 'Cover',
};

export const DISCIPLINE_REEL_TYPES: Record<Discipline, string[]> = {
  actor: ['reel', 'monologue'],
  singer: ['song', 'reel', 'cover'],
  dancer: ['dance', 'reel'],
  musician: ['reel'],
  voice_actor: ['voice_demo'],
  comedian: ['comedy', 'reel'],
  presenter: ['reel'],
  director: ['reel'],
};

export function getDisciplineReelTypes(discipline: Discipline): string[] {
  return DISCIPLINE_REEL_TYPES[discipline] ?? ['reel'];
}
