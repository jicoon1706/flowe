import { useState, useRef } from 'react';
import {
  ChevronLeft, Plus, FolderOpen, MoreVertical, Trash2, Edit3,
  X, Check, Image, FileText, Clock, ChevronRight, BookOpen,
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface ProjectEntry {
  id: string;
  text: string;
  images: string[];
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
  entries: ProjectEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// ── sample seed data ──────────────────────────────────────────────────────────
const SEED_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Pelan Kewangan 2025',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-05-01'),
    entries: [
      {
        id: 'e1',
        text: 'Sasaran tahun ini:\n• Simpan 20% dari gaji setiap bulan\n• Tambah ASB hingga RM 15,000\n• Mula labur dalam Bursa — beli saham dividen\n• Bayar kredit kad sepenuhnya sebelum Jun\n\nKalau boleh capai semua ini, net worth akan naik dalam RM 25,000.',
        images: [],
        createdAt: new Date('2025-01-10'),
      },
      {
        id: 'e2',
        text: 'Semak kemajuan Q1:\n✅ Simpanan bulan Jan-Mar — RM 2,100 (7% lebih dari sasaran)\n❌ ASB masih RM 12,400 — kena tambah RM 2,600 lagi\n⏳ Kredit kad — baki RM 1,200 (progress baik)\n\nRancang topup ASB RM 500/bulan bermula Apr.',
        images: [],
        createdAt: new Date('2025-04-02'),
      },
      {
        id: 'e3',
        text: 'Baru baca buku "Rich Dad Poor Dad" untuk kali kedua. Takeaway penting:\n\n1. Rumah bukan aset kalau ia tak hasilkan duit\n2. Fokus bina kolum aset dulu\n3. Beli liabiliti dengan income pasif, bukan gaji\n\nInspirasional. Nak tambah satu lagi unit trust sebelum akhir tahun.',
        images: [],
        createdAt: new Date('2025-05-01'),
      },
    ],
  },
  {
    id: 'p2',
    name: 'Belajar Saham & ETF',
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2025-04-20'),
    entries: [
      {
        id: 'e4',
        text: 'Notes dari webinar "Saham untuk Pemula":\n\n• P/E ratio < 15 — nilai murah\n• Dividend yield > 4% — pendapatan pasif baik\n• ROE > 15% — syarikat kuat\n\nSaham yang nak research: Maybank (1155), Public Bank (1295), Petronas Dagangan (5681)',
        images: [],
        createdAt: new Date('2025-02-15'),
      },
      {
        id: 'e5',
        text: 'ETF vs Unit Trust — perbandingan:\n\nETF:\n✅ Fee rendah (0.3-0.5%)\n✅ Boleh beli/jual masa pasaran buka\n❌ Kena ada akaun broker\n\nUnit Trust:\n✅ Mudah — boleh beli terus dalam app\n✅ Auto-invest boleh set\n❌ Fee lebih tinggi (1-1.5%)\n\nKesimpulan: Mula dengan Unit Trust (mudah), pindah ke ETF bila dah faham.',
        images: [],
        createdAt: new Date('2025-04-20'),
      },
    ],
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(d: Date) {
  return d.toLocaleString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(d: Date) {
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Semalam';
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

// ── ENTRY DETAIL ──────────────────────────────────────────────────────────────
interface EntryDetailProps {
  entry: ProjectEntry;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
function EntryDetail({ entry, onBack, onEdit, onDelete }: EntryDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Edit3 className="w-4 h-4 text-primary" />
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-xl hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        {/* Text */}
        {entry.text ? (
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm leading-relaxed whitespace-pre-line">{entry.text}</p>
          </div>
        ) : null}

        {/* Images */}
        {entry.images.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" /> {entry.images.length} gambar
            </p>
            <div className="grid grid-cols-2 gap-2">
              {entry.images.map((img, i) => (
                <button key={i} onClick={() => setLightboxImg(img)} className="aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
            <p className="font-bold mb-2">Padam entri ini?</p>
            <p className="text-sm text-muted-foreground mb-5">Tindakan ini tidak boleh dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-muted rounded-xl font-semibold text-sm">Batal</button>
              <button onClick={onDelete} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-semibold text-sm">Padam</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full" onClick={() => setLightboxImg(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}

// ── ADD / EDIT ENTRY ──────────────────────────────────────────────────────────
interface AddEntryProps {
  initial?: ProjectEntry;
  onSave: (text: string, images: string[]) => void;
  onBack: () => void;
}
function AddEntry({ initial, onSave, onBack }: AddEntryProps) {
  const [text, setText] = useState(initial?.text ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setImages((prev) => [...prev, e.target!.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const canSave = text.trim().length > 0 || images.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-bold">{initial ? 'Edit Entri' : 'Tambah Entri'}</h2>
        <button
          onClick={() => { if (canSave) onSave(text, images); }}
          disabled={!canSave}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${canSave ? 'bg-primary text-black' : 'bg-muted text-muted-foreground'}`}
        >
          Simpan
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Text input */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex-1 min-h-48">
          <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-border">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Nota</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis nota kewangan anda di sini…"
            className="w-full h-full min-h-48 p-4 bg-transparent text-sm resize-none outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        {/* Image section */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Gambar</span>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImages(e.target.files)}
            />
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Image className="w-5 h-5" />
              <span className="text-xs">Ketik untuk tambah gambar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PROJECT DETAIL ────────────────────────────────────────────────────────────
interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdate: (updated: Project) => void;
  onDelete: () => void;
}
function ProjectDetail({ project, onBack, onUpdate, onDelete }: ProjectDetailProps) {
  type View = 'list' | 'add-entry' | 'edit-entry' | 'entry-detail';
  const [view, setView] = useState<View>('list');
  const [selectedEntry, setSelectedEntry] = useState<ProjectEntry | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameName, setRenameName] = useState(project.name);
  const [showDeleteProject, setShowDeleteProject] = useState(false);

  const sorted = [...project.entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleSaveEntry = (text: string, images: string[]) => {
    const now = new Date();
    if (view === 'edit-entry' && selectedEntry) {
      const updated: Project = {
        ...project,
        updatedAt: now,
        entries: project.entries.map((e) =>
          e.id === selectedEntry.id ? { ...e, text, images, updatedAt: now } : e
        ),
      };
      onUpdate(updated);
      setView('entry-detail');
      setSelectedEntry({ ...selectedEntry, text, images });
    } else {
      const newEntry: ProjectEntry = { id: Date.now().toString(), text, images, createdAt: now };
      const updated: Project = { ...project, updatedAt: now, entries: [...project.entries, newEntry] };
      onUpdate(updated);
      setView('list');
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    const updated: Project = {
      ...project,
      updatedAt: new Date(),
      entries: project.entries.filter((e) => e.id !== entryId),
    };
    onUpdate(updated);
    setView('list');
    setSelectedEntry(null);
  };

  const handleRename = () => {
    if (!renameName.trim()) return;
    onUpdate({ ...project, name: renameName.trim(), updatedAt: new Date() });
    setShowRename(false);
  };

  if (view === 'add-entry') {
    return <AddEntry onSave={handleSaveEntry} onBack={() => setView('list')} />;
  }
  if (view === 'edit-entry' && selectedEntry) {
    return <AddEntry initial={selectedEntry} onSave={handleSaveEntry} onBack={() => setView('entry-detail')} />;
  }
  if (view === 'entry-detail' && selectedEntry) {
    return (
      <EntryDetail
        entry={selectedEntry}
        onBack={() => { setView('list'); setSelectedEntry(null); }}
        onEdit={() => setView('edit-entry')}
        onDelete={() => handleDeleteEntry(selectedEntry.id)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors flex-shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate">{project.name}</h1>
          <p className="text-xs text-muted-foreground">Dibuat {formatDate(project.createdAt)}</p>
        </div>
        <button
          onClick={() => setView('add-entry')}
          className="p-2 rounded-xl bg-primary text-black hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="relative flex-shrink-0">
          <button onClick={() => setShowMore(!showMore)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMore(false)} />
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-40 overflow-hidden w-40">
                <button
                  onClick={() => { setShowMore(false); setRenameName(project.name); setShowRename(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-muted transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Rename
                </button>
                <button
                  onClick={() => { setShowMore(false); setShowDeleteProject(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Padam
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-3xl">📝</div>
            <p className="font-semibold mb-1">Belum ada entri</p>
            <p className="text-sm text-muted-foreground mb-5">Tambah nota, gambar atau pemikiran kewangan anda</p>
            <button
              onClick={() => setView('add-entry')}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-black rounded-xl font-bold text-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Entri
            </button>
          </div>
        ) : (
          sorted.map((entry) => {
            const previewLines = entry.text.split('\n').slice(0, 2).join('\n');
            return (
              <button
                key={entry.id}
                onClick={() => { setSelectedEntry(entry); setView('entry-detail'); }}
                className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 active:scale-[0.98] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    {entry.images.length > 0 ? (
                      <Image className="w-4 h-4 text-primary" />
                    ) : (
                      <FileText className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
                      {entry.images.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          {entry.images.length} gambar
                        </span>
                      )}
                    </div>
                    {entry.text ? (
                      <p className="text-sm text-foreground/90 line-clamp-2 whitespace-pre-line">{previewLines}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">{entry.images.length} gambar</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
                {entry.images.length > 0 && (
                  <div className="flex gap-2 mt-3 ml-12">
                    {entry.images.slice(0, 3).map((img, i) => (
                      <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-border flex-shrink-0">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {entry.images.length > 3 && (
                      <div className="w-14 h-14 rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                        +{entry.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Add entry FAB (when list has entries) */}
      {sorted.length > 0 && (
        <div className="p-4">
          <button
            onClick={() => setView('add-entry')}
            className="w-full py-3.5 bg-primary text-black rounded-2xl font-bold flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Entri
          </button>
        </div>
      )}

      {/* Rename modal */}
      {showRename && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
          <div className="bg-background border border-border rounded-t-3xl p-5 w-full max-w-md">
            <h3 className="font-bold mb-4">Tukar Nama Projek</h3>
            <input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRename(false)} className="flex-1 py-3 bg-muted rounded-xl font-semibold text-sm">Batal</button>
              <button onClick={handleRename} className="flex-1 py-3 bg-primary text-black rounded-xl font-bold text-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete project confirm */}
      {showDeleteProject && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
            <p className="font-bold mb-2">Padam projek ini?</p>
            <p className="text-sm text-muted-foreground mb-5">
              Semua <strong>{project.entries.length}</strong> entri akan dipadam secara kekal.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteProject(false)} className="flex-1 py-3 bg-muted rounded-xl font-semibold text-sm">Batal</button>
              <button onClick={onDelete} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-semibold text-sm">Padam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN LEARN PAGE ───────────────────────────────────────────────────────────
export function Learn({ onBack }: Props) {
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const now = new Date();
    const p: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [p, ...prev]);
    setNewProjectName('');
    setShowNewProject(false);
    setSelectedProject(p);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSelectedProject(null);
  };

  // ── Project Detail subpage ──
  if (selectedProject) {
    const live = projects.find((p) => p.id === selectedProject.id) ?? selectedProject;
    return (
      <ProjectDetail
        project={live}
        onBack={() => setSelectedProject(null)}
        onUpdate={handleUpdateProject}
        onDelete={() => handleDeleteProject(live.id)}
      />
    );
  }

  // ── Projects List ──
  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mb-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Financial Tasks</h1>
            <p className="text-xs text-muted-foreground">{projects.length} projek aktif</p>
          </div>
        </div>
        <button
          onClick={() => { setNewProjectName(''); setShowNewProject(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-black rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" /> Projek
        </button>
      </div>

      {/* Hero banner */}
      <div className="mx-4 mb-5 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent border border-primary/25 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-bold text-primary">Nota Kewangan Peribadi</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Simpan nota, idea &amp; kajian kewangan anda dalam satu tempat
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{projects.length}</p>
            <p className="text-xs text-muted-foreground">Projek</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{projects.reduce((s, p) => s + p.entries.length, 0)}</p>
            <p className="text-xs text-muted-foreground">Entri</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{projects.reduce((s, p) => s + p.entries.reduce((ss, e) => ss + e.images.length, 0), 0)}</p>
            <p className="text-xs text-muted-foreground">Gambar</p>
          </div>
        </div>
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-5 text-4xl">
            <FolderOpen className="w-10 h-10 text-primary/50" />
          </div>
          <p className="font-bold text-lg mb-2">Belum ada projek</p>
          <p className="text-sm text-muted-foreground mb-6">Buat projek pertama anda untuk mula menyimpan nota kewangan!</p>
          <button
            onClick={() => { setNewProjectName(''); setShowNewProject(true); }}
            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-black rounded-2xl font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Buat Projek Pertama
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 active:scale-[0.98] transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Folder icon */}
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{project.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {project.entries.length} entri
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(project.updatedAt)}
                    </span>
                  </div>
                  {/* Latest entry preview */}
                  {project.entries.length > 0 && (() => {
                    const latest = [...project.entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
                    return latest.text ? (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{latest.text.split('\n')[0]}</p>
                    ) : null;
                  })()}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDate(project.createdAt)}</span>
                </div>
              </div>

              {/* Entry type badges */}
              {project.entries.length > 0 && (
                <div className="flex gap-1.5 mt-3 ml-12">
                  <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2.5 py-1">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {project.entries.filter((e) => e.text).length} teks
                    </span>
                  </div>
                  {project.entries.some((e) => e.images.length > 0) && (
                    <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2.5 py-1">
                      <Image className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {project.entries.reduce((s, e) => s + e.images.length, 0)} gambar
                      </span>
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* New Project bottom sheet */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowNewProject(false)}>
          <div
            className="bg-background border border-border rounded-t-3xl p-5 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Projek Baru</h3>
              <button onClick={() => setShowNewProject(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
              placeholder="cth. Belajar S&P 500, Pelan Beli Rumah…"
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-colors mb-5"
              autoFocus
            />
            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors ${
                newProjectName.trim() ? 'bg-primary text-black' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Check className="w-4 h-4" /> Buat Projek
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
