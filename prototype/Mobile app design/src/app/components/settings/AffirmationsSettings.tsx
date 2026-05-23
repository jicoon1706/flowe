import { useState } from 'react';
import { ChevronLeft, Heart, Bell, Clock } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const CATEGORIES = ['All', 'Rich Dad', 'Poor Dad', 'Mindset', 'Investment', 'Wealth Building', 'Financial Freedom'];

const SAMPLE_AFFIRMATIONS: Record<string, string[]> = {
  'Rich Dad': [
    '"The rich don\'t work for money. Money works for them."',
    '"Your house is not an asset. It\'s a liability."',
    '"Don\'t save money. Invest money."',
  ],
  'Mindset': [
    '"Financial freedom begins in your mind."',
    '"Your mindset is your greatest asset."',
    '"Think like an investor, not a consumer."',
  ],
  'Investment': [
    '"Buy assets, not liabilities."',
    '"Compound interest is the eighth wonder of the world."',
    '"Invest in what you understand."',
  ],
};

export function AffirmationsSettings({ onBack }: Props) {
  const [showOnHome, setShowOnHome] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewCategory, setPreviewCategory] = useState('Rich Dad');

  const previewAffirmations = SAMPLE_AFFIRMATIONS[previewCategory] || SAMPLE_AFFIRMATIONS['Rich Dad'];

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen p-4 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Affirmations</h1>
      </div>

      {/* Preview Card */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Today's Affirmation</span>
        </div>
        <p className="text-sm leading-relaxed italic">
          {previewAffirmations[0]}
        </p>
        <div className="flex gap-1.5 mt-3">
          {previewAffirmations.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-primary/30'}`} />
          ))}
        </div>
      </div>

      {/* Display Settings */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Display</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5" />
              <div>
                <p className="font-medium">Show on Home</p>
                <p className="text-xs text-muted-foreground">Display affirmation on dashboard</p>
              </div>
            </div>
            <ToggleSwitch enabled={showOnHome} onToggle={() => setShowOnHome(!showOnHome)} />
          </div>
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Daily Reminder</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <div>
                <p className="font-medium">Enable Reminder</p>
                <p className="text-xs text-muted-foreground">Daily notification with affirmation</p>
              </div>
            </div>
            <ToggleSwitch enabled={dailyReminder} onToggle={() => setDailyReminder(!dailyReminder)} />
          </div>

          {dailyReminder && (
            <div className={`flex items-center justify-between p-4`}>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Reminder Time</span>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* Category Preference */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Category Preference</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-black border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Affirmations will be chosen from: <span className="text-primary">{selectedCategory}</span>
        </p>
      </div>

      {/* Preview by Category */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Sample Affirmations</h3>
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {Object.keys(SAMPLE_AFFIRMATIONS).map((cat) => (
            <button
              key={cat}
              onClick={() => setPreviewCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                previewCategory === cat
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {(SAMPLE_AFFIRMATIONS[previewCategory] || []).map((quote, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm italic text-muted-foreground leading-relaxed">{quote}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
