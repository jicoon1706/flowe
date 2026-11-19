import { isPdfPath } from './attachments';

/** Clamps a requested photo index into the list, or null when there is nothing to show. */
export function clampViewerIndex(index: number | null, count: number): number | null {
  if (index === null || count === 0) return null;
  return Math.min(Math.max(0, Math.round(index)), count - 1);
}

/**
 * The photos of a mixed attachment list, in order, for the viewer. A thumbnail's
 * position in this list is the index the viewer opens at — PDFs never count.
 */
export function viewerPhotos<T extends { storage_path: string }>(files: T[]): T[] {
  return files.filter((f) => !isPdfPath(f.storage_path));
}
