/**
 * Text and settings that appear on the site.
 * Edit this file to change wording — no other code needs to change.
 */

export const APP_NAME = 'FecalScore';
export const APP_TAGLINE = 'Iowa State University · Swine fecal scoring';

export const CREDITS = [
  { role: 'Built by', name: 'Yi Xun Lim' },
  { role: 'Built for', name: 'Felipe' },
  { role: 'Funded by', name: 'Dr. Rosero, Iowa State University' },
  { role: 'Hosted by', name: 'Ethan' },
];

/** General definitions — replace with Felipe's wording when available. */
export const SCORE_GUIDE = [
  { score: 0, label: 'Normal', description: 'Firm and well formed, holds its shape' },
  { score: 1, label: 'Soft', description: 'Formed but soft, loses some shape' },
  { score: 2, label: 'Loose', description: 'Pasty and unformed, spreads out' },
  { score: 3, label: 'Watery', description: 'Liquid diarrhea, no form' },
] as const;
