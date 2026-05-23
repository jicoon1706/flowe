import { useState } from 'react';
import { ChevronLeft, Plus, Trash2, X, Check } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const COLORS = ['#C5FF00', '#00d4ff', '#ff6b6b', '#ffd93d', '#6bcf7f', '#ff9f43', '#a29bfe', '#fd79a8'];

const DEFAULT_EXPENSE: Category[] = [
  { id: '1', name: 'Food & Dining', emoji: '🍜', color: '#ff6b6b' },
  { id: '2', name: 'Transport', emoji: '🚗', color: '#00d4ff' },
  { id: '3', name: 'Shopping', emoji: '🛍️', color: '#ffd93d' },
  { id: '4', name: 'Entertainment', emoji: '🎮', color: '#a29bfe' },
  { id: '5', name: 'Health', emoji: '💊', color: '#6bcf7f' },
  { id: '6', name: 'Bills & Utilities', emoji: '💡', color: '#fd79a8' },
  { id: '7', name: 'Housing', emoji: '🏠', color: '#ff9f43' },
  { id: '8', name: 'Education', emoji: '📚', color: '#C5FF00' },
  { id: '9', name: 'Travel', emoji: '✈️', color: '#00d4ff' },
  { id: '10', name: 'Others', emoji: '📦', color: '#636e72' },
];

const DEFAULT_INCOME: Category[] = [
  { id: '11', name: 'Salary', emoji: '💰', color: '#C5FF00' },
  { id: '12', name: 'Freelance', emoji: '💻', color: '#00d4ff' },
  { id: '13', name: 'Investment', emoji: '📈', color: '#6bcf7f' },
  { id: '14', name: 'Business', emoji: '🏢', color: '#ffd93d' },
  { id: '15', name: 'Gift', emoji: '🎁', color: '#fd79a8' },
  { id: '16', name: 'Others', emoji: '📦', color: '#636e72' },
];

const EMOJIS = ['💰', '🍜', '🚗', '🛍️', '🎮', '💊', '🏠', '📚', '✈️', '💡', '📈', '🏢', '🎁', '💻', '🎯', '⚡', '🌟', '🎪'];

export function CategoriesSettings({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [expenseCategories, setExpenseCategories] = useState(DEFAULT_EXPENSE);
  const [incomeCategories, setIncomeCategories] = useState(DEFAULT_INCOME);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📦');
  const [newColor, setNewColor] = useState('#C5FF00');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
  const setCategories = activeTab === 'expense' ? setExpenseCategories : setIncomeCategories;

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      name: newName.trim(),
      emoji: newEmoji,
      color: newColor,
    };
    setCategories((prev) => [...prev, newCat]);
    setNewName('');
    setNewEmoji('📦');
    setNewColor('#C5FF00');
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen p-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Manage Categories</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 rounded-xl bg-primary text-black hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-card border border-border rounded-xl p-1">
        {(['expense', 'income'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? 'bg-primary text-black' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Category List */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-card border border-border rounded-xl flex items-center gap-3 px-4 py-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: cat.color + '22' }}
            >
              {cat.emoji}
            </div>
            <span className="flex-1 font-medium">{cat.name}</span>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            {deleteId === cat.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteId(cat.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-background border border-border rounded-t-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add Category</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: newColor + '22' }}
              >
                {newEmoji}
              </div>
              <span className="font-medium">{newName || 'Category name'}</span>
              <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: newColor }} />
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Emoji */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewEmoji(emoji)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-colors ${
                      newEmoji === emoji ? 'border-primary bg-primary/20' : 'border-border bg-card'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      newColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full py-4 bg-primary text-black rounded-2xl font-semibold"
            >
              Add Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
