/**
 * The four Unsplash photo slots the canvas allows (welcome hero, home empty
 * state, Learn covers). Credits come from the canvas "brand/credits" frame.
 *
 * The canvas names the photographers but carries no photo URLs, so `uri` is
 * null and every slot draws its gradient fallback with the credit line. Paste a
 * photo URL here to switch a slot to the photo.
 */
export interface PhotoSlotSpec {
  uri: string | null;
  credit: string;
  profile: string;
}

export const PHOTOS = {
  welcomeHero: { uri: null, credit: 'Valentin Lacoste', profile: 'https://unsplash.com/@valentinlacoste' },
  homeEmpty: { uri: null, credit: 'Muhammad Faiz Zulkeflee', profile: 'https://unsplash.com/@fzeo' },
  learnGradient: { uri: null, credit: 'Codioful (Formerly Gradienta)', profile: 'https://unsplash.com/@codioful' },
  learnWave: { uri: null, credit: 'SIMON LEE', profile: 'https://unsplash.com/@simonppt' },
} as const satisfies Record<string, PhotoSlotSpec>;

export type PhotoKey = keyof typeof PHOTOS;

/** Learn covers rotate through these (max 3 projects show a cover). */
export const LEARN_COVERS: PhotoKey[] = ['learnGradient', 'learnWave', 'homeEmpty'];
