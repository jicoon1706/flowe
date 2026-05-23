import { useState } from 'react';
import { ChevronLeft, Camera, Check, User } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function AccountSettings({ onBack }: Props) {
  const [name, setName] = useState('Ahmad');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Account</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-black" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-card border-2 border-background rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <Camera className="w-4 h-4 text-foreground" />
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Tap to change photo</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Username</label>
          <input
            type="text"
            value="@ahmad_mywallet"
            readOnly
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed opacity-60"
          />
          <p className="text-xs text-muted-foreground mt-1 px-1">Username cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Member Since</label>
          <input
            type="text"
            value="January 2025"
            readOnly
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed opacity-60"
          />
        </div>
      </div>

      {/* Financial Identity */}
      <div className="mt-6 bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Financial Identity</p>
        <div className="grid grid-cols-3 gap-2">
          {['Rich Dad', 'Middle Class', 'Building Wealth'].map((label) => (
            <button
              key={label}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                label === 'Building Wealth'
                  ? 'bg-primary text-black border-primary'
                  : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full mt-8 py-4 bg-primary text-black rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        {saved ? (
          <>
            <Check className="w-5 h-5" /> Saved!
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  );
}
