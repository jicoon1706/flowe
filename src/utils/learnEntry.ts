/**
 * Learn entries store one text body. The v2 editor has a Title and Notes, so
 * the first line is the title and the rest are the notes.
 */
export function splitEntry(body: string | null | undefined): { title: string; notes: string } {
  const text = (body ?? '').replace(/\r\n/g, '\n');
  const i = text.indexOf('\n');
  if (i < 0) return { title: text.trim(), notes: '' };
  return { title: text.slice(0, i).trim(), notes: text.slice(i + 1).replace(/^\n+/, '') };
}

export function joinEntry(title: string, notes: string): string {
  const t = title.trim();
  const n = notes.trim();
  if (!t) return n;
  return n ? `${t}\n\n${n}` : t;
}
