import { useState } from 'react';
import { ChevronLeft, Download, FileText, AlertTriangle, X, Check, Database, Clock } from 'lucide-react';

interface Props {
  onBack: () => void;
}

type ExportFormat = 'csv' | 'pdf';
type DateRange = '1m' | '3m' | '1y' | 'all';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '1m': 'This Month',
  '3m': 'Last 3 Months',
  '1y': 'Last Year',
  'all': 'All Time',
};

export function DataSettings({ onBack }: Props) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange>('1m');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }, 1500);
  };

  const handleReset = () => {
    if (resetInput.toLowerCase() !== 'reset') return;
    setShowResetConfirm(false);
    setResetDone(true);
    setResetInput('');
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
        <h1 className="text-xl font-bold">Data & Storage</h1>
      </div>

      {/* Storage Summary */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Database className="w-5 h-5 text-primary" />
          <span className="font-semibold">Storage Summary</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted rounded-xl py-3">
            <p className="text-lg font-bold text-primary">248</p>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </div>
          <div className="bg-muted rounded-xl py-3">
            <p className="text-lg font-bold text-primary">12</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </div>
          <div className="bg-muted rounded-xl py-3">
            <p className="text-lg font-bold text-primary">5</p>
            <p className="text-xs text-muted-foreground">Recurring</p>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Export Data</h3>
        <div className="bg-card border border-border rounded-2xl p-4">
          {/* Format */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Format</p>
            <div className="flex gap-2">
              {(['csv', 'pdf'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-colors ${
                    exportFormat === fmt
                      ? 'bg-primary text-black border-primary'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-5">
            <p className="text-sm font-medium mb-2">Date Range</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`py-2.5 px-3 rounded-xl text-sm border transition-colors ${
                    dateRange === range
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {DATE_RANGE_LABELS[range]}
                </button>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3.5 bg-primary text-black rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
          >
            {exported ? (
              <><Check className="w-5 h-5" /> Exported!</>
            ) : exporting ? (
              <><div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" /> Exporting...</>
            ) : (
              <><Download className="w-5 h-5" /> Export {exportFormat.toUpperCase()}</>
            )}
          </button>
        </div>
      </div>

      {/* Last Backup */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Backup</h3>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Last Backup</p>
              <p className="text-xs text-muted-foreground">Never backed up</p>
            </div>
          </div>
          <button className="w-full p-4 text-sm font-semibold text-primary text-left hover:bg-muted transition-colors">
            Backup to Cloud →
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <h3 className="text-sm font-medium text-red-400 mb-3 px-2">Danger Zone</h3>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">Reset App</p>
              <p className="text-xs text-muted-foreground mt-1">
                This will permanently delete all your transactions, categories, settings and data. This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl font-semibold text-sm hover:bg-red-500/30 transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-background border border-border rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-lg font-bold mb-2">Reset App?</h2>
              <p className="text-sm text-muted-foreground">
                All data will be permanently deleted. Type <span className="text-red-400 font-mono font-bold">reset</span> to confirm.
              </p>
            </div>

            <input
              type="text"
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              placeholder='Type "reset" to confirm'
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-center text-foreground focus:outline-none focus:border-red-500 mb-4 font-mono"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetConfirm(false); setResetInput(''); }}
                className="flex-1 py-3 bg-card border border-border rounded-xl font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetInput.toLowerCase() !== 'reset'}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 transition-opacity"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Done Toast */}
      {resetDone && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-card border border-border rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl z-50">
          <Check className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">App reset successfully</span>
          <button onClick={() => setResetDone(false)}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
