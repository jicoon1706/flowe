import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';

interface Props {
  onBack: () => void;
  onCreated?: (tabung: { name: string; target: number; icon: string; deadline: string }) => void;
}

const ICONS = ['🐷', '🏠', '✈️', '🎓', '💍', '🚗', '📱', '💻', '🏋️', '🎮', '🌴', '⚡'];
const COLORS = ['#C5FF00', '#00d4ff', '#ffd93d', '#ff6b6b', '#6bcf7f', '#a29bfe', '#fd79a8', '#ff9f43'];

const TEMPLATES = [
  { name: 'Tabung Raya', icon: '🌙', target: 500, description: 'Save for Eid celebration' },
  { name: 'Emergency Fund', icon: '🛡️', target: 3000, description: '3 months of expenses' },
  { name: 'Holiday Fund', icon: '✈️', target: 2000, description: 'Dream vacation savings' },
  { name: 'New Gadget', icon: '📱', target: 1500, description: 'Tech upgrade fund' },
  { name: 'Down Payment', icon: '🏠', target: 10000, description: 'House down payment' },
];

export function NewTabung({ onBack, onCreated }: Props) {
  const [step, setStep] = useState<'template' | 'form' | 'success'>('template');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🐷');
  const [selectedColor, setSelectedColor] = useState('#C5FF00');
  const [autoSave, setAutoSave] = useState(false);
  const [autoSaveAmt, setAutoSaveAmt] = useState('');

  const handleTemplate = (t: typeof TEMPLATES[0]) => {
    setName(t.name);
    setTarget(t.target.toString());
    setSelectedIcon(t.icon);
    setStep('form');
  };

  const handleCreate = () => {
    if (!name.trim() || !target || !deadline) return;
    setStep('success');
    onCreated?.({ name, target: parseFloat(target), icon: selectedIcon, deadline });
  };

  const daysLeft = deadline
    ? Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 86400000))
    : 0;
  const weeklyNeeded = daysLeft > 0 && target
    ? (parseFloat(target) / (daysLeft / 7)).toFixed(2)
    : '0.00';

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-4xl">
          {selectedIcon}
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Tabung Created! 🎉</p>
          <p className="text-muted-foreground text-sm">"{name}" has been added to your savings</p>
          <p className="text-primary font-semibold mt-2">Goal: RM {parseFloat(target).toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 w-full">
          <p className="text-sm text-muted-foreground text-center">To reach your goal, save approximately</p>
          <p className="text-2xl font-bold text-primary text-center mt-1">RM {weeklyNeeded}/week</p>
        </div>
        <button onClick={onBack} className="w-full py-4 bg-primary text-black rounded-2xl font-bold">
          Back to Home
        </button>
      </div>
    );
  }

  if (step === 'template') {
    return (
      <div className="min-h-screen p-4 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">New Tabung</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-4 px-1">Choose a template or start from scratch</p>

        {/* Templates */}
        <div className="space-y-3 mb-5">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => handleTemplate(t)}
              className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 active:bg-muted transition-colors text-left"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-2xl">
                {t.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <span className="text-sm font-bold text-primary">RM {t.target.toLocaleString()}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep('form')}
          className="w-full py-4 bg-card border-2 border-dashed border-border rounded-2xl text-muted-foreground font-medium hover:border-primary hover:text-primary transition-colors"
        >
          + Start from Scratch
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep('template')} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">New Tabung</h1>
      </div>

      {/* Preview */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center gap-4 border"
        style={{ backgroundColor: selectedColor + '15', borderColor: selectedColor + '40' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: selectedColor + '30' }}
        >
          {selectedIcon}
        </div>
        <div>
          <p className="font-bold">{name || 'Tabung Name'}</p>
          <p className="text-sm" style={{ color: selectedColor }}>
            Goal: RM {target || '0.00'}
          </p>
          {deadline && <p className="text-xs text-muted-foreground">{daysLeft} days left</p>}
        </div>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Tabung Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tabung Raya"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Target */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Target Amount (RM)</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="500.00"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Target Date</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
          />
          {daysLeft > 0 && target && (
            <p className="text-xs text-primary mt-1 px-1">
              Save ~RM {weeklyNeeded}/week to reach your goal
            </p>
          )}
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setSelectedIcon(icon)}
                className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border transition-colors ${
                  selectedIcon === icon ? 'border-primary bg-primary/20' : 'border-border bg-card'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Color Theme</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-9 h-9 rounded-full border-2 transition-transform ${
                  selectedColor === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Auto Save Toggle */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Auto-Save</p>
              <p className="text-xs text-muted-foreground">Automatically contribute each month</p>
            </div>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`relative w-12 h-6 rounded-full transition-colors ${autoSave ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSave ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          {autoSave && (
            <input
              type="number"
              value={autoSaveAmt}
              onChange={(e) => setAutoSaveAmt(e.target.value)}
              placeholder="Monthly amount (RM)"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          )}
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={!name.trim() || !target || !deadline}
        className="w-full mt-6 py-4 bg-primary text-black rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
      >
        <Check className="w-5 h-5" /> Create Tabung
      </button>
    </div>
  );
}
