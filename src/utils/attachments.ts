// Learn entries keep photos and PDFs in one list (one `learn_entry_images` row
// and one `learn-images` object each), so the storage path's extension is what
// tells the two apart everywhere they're rendered.

export function isPdfPath(path: string | undefined | null): boolean {
  return !!path && path.toLowerCase().endsWith('.pdf');
}

/** Filename to show for a PDF attachment, falling back to the stored object id. */
export function pdfLabel(path: string, savedName?: string): string {
  if (savedName) return savedName;
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.pdf$/i, '') + '.pdf';
}
