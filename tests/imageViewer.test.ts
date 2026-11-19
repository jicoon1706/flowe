import { clampViewerIndex, viewerPhotos } from '../src/utils/imageViewer';

describe('viewerPhotos', () => {
  it('drops PDFs and keeps photo order, so a thumbnail index is the viewer index', () => {
    const files = [
      { id: 'a', storage_path: 'u/1.pdf' },
      { id: 'b', storage_path: 'u/2.jpg' },
      { id: 'c', storage_path: 'u/3.PDF' },
      { id: 'd', storage_path: 'u/4.png' },
      { id: 'e', storage_path: 'u/5.webp' },
    ];
    const photos = viewerPhotos(files);
    expect(photos.map((p) => p.id)).toEqual(['b', 'd', 'e']);
    // Tapping the 2nd thumbnail opens photo "d", not the PDF at files[1].
    expect(photos[clampViewerIndex(1, photos.length)!].id).toBe('d');
  });

  it('returns nothing for a PDF-only entry', () => {
    expect(viewerPhotos([{ storage_path: 'x.pdf' }])).toEqual([]);
  });
});

describe('clampViewerIndex', () => {
  it('keeps the viewer closed for null or an empty list', () => {
    expect(clampViewerIndex(null, 3)).toBeNull();
    expect(clampViewerIndex(0, 0)).toBeNull();
  });

  it('clamps into range and rounds a mid-swipe offset to the nearest page', () => {
    expect(clampViewerIndex(-1, 3)).toBe(0);
    expect(clampViewerIndex(7, 3)).toBe(2);
    expect(clampViewerIndex(1.4, 3)).toBe(1);
    expect(clampViewerIndex(1.6, 3)).toBe(2);
  });
});
