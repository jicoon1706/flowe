/**
 * The four Unsplash photo slots the canvas allows (welcome hero, home empty
 * state, Learn covers), with the photographers the canvas "brand/credits"
 * frame names.
 *
 * Photos are hotlinked from images.unsplash.com as Unsplash requires (never
 * copied into the repo), sized with `w` / `q` / `auto=format`. Each one's
 * download was recorded with Unsplash when it was picked. If a photo fails to
 * load, or the device is offline, the slot draws its gradient fallback.
 */
export interface PhotoSlotSpec {
  uri: string | null;
  /** What the photo shows, for screen readers. */
  alt: string;
  credit: string;
  /** Photographer's Unsplash profile (with Unsplash's referral params). */
  profile: string;
  /** The photo's page on Unsplash. */
  source: string;
}

const UTM = '?utm_source=flowe&utm_medium=referral';
const unsplash = (photo: string, width: number) =>
  `https://images.unsplash.com/${photo}?ixlib=rb-4.1.0&w=${width}&q=80&auto=format&fit=crop`;

export const PHOTOS = {
  welcomeHero: {
    uri: unsplash('photo-1564392870115-e7215e1d78b2', 1080),
    alt: 'Green and orange neon light trails on a black background',
    credit: 'Valentin Lacoste',
    profile: `https://unsplash.com/@valentinlacoste${UTM}`,
    source: `https://unsplash.com/photos/4nMgcoQXuSQ${UTM}`,
  },
  homeEmpty: {
    uri: unsplash('photo-1745761113481-0ece4971fa77', 800),
    alt: 'Kuala Lumpur skyline silhouetted against a colourful sunrise',
    credit: 'Muhammad Faiz Zulkeflee',
    profile: `https://unsplash.com/@fzeo${UTM}`,
    source: `https://unsplash.com/photos/EkCIgzxwym4${UTM}`,
  },
  learnGradient: {
    uri: unsplash('photo-1614854262318-831574f15f1f', 800),
    alt: 'Smooth gradient from light green to soft teal',
    credit: 'Codioful (Formerly Gradienta)',
    profile: `https://unsplash.com/@codioful${UTM}`,
    source: `https://unsplash.com/photos/UF_wwDxI6uk${UTM}`,
  },
  learnWave: {
    uri: unsplash('photo-1627637819794-fba32f82be16', 800),
    alt: 'Abstract blue layered waves on a dark blue background',
    credit: 'SIMON LEE',
    profile: `https://unsplash.com/@simonppt${UTM}`,
    source: `https://unsplash.com/photos/egWTpKFu8rU${UTM}`,
  },
} as const satisfies Record<string, PhotoSlotSpec>;

export type PhotoKey = keyof typeof PHOTOS;

/** Learn covers rotate through these (max 3 projects show a cover). */
export const LEARN_COVERS: PhotoKey[] = ['learnGradient', 'learnWave', 'homeEmpty'];
