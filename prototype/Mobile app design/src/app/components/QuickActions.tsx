import { Plus, Camera, PiggyBank } from 'lucide-react';

interface QuickActionsProps {
  onAddTransaction: () => void;
  onNewTabung: () => void;
}

export function QuickActions({ onAddTransaction, onNewTabung }: QuickActionsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-3 text-muted-foreground">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onAddTransaction}
          className="bg-primary text-primary-foreground rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">Add Transaction</span>
        </button>
        <button className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors">
          <Camera className="w-6 h-6" />
          <span className="text-sm font-medium">Scan Receipt</span>
        </button>
        <button
          onClick={onNewTabung}
          className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors"
        >
          <PiggyBank className="w-6 h-6" />
          <span className="text-sm font-medium">New Tabung</span>
        </button>
      </div>
    </div>
  );
}
