import { Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const affirmations = [
  {
    text: "Small savings now, big rewards later.",
    category: "Saving",
    icon: "💰"
  },
  {
    text: "Your money should work as hard as you do.",
    category: "Investing",
    icon: "📈"
  },
  {
    text: "Financial freedom starts with one good decision today.",
    category: "Mindset",
    icon: "🧠"
  },
  {
    text: "Aware of your spending today, wealthy tomorrow.",
    category: "Awareness",
    icon: "⚠️"
  },
  {
    text: "Don't just save — invest instead.",
    category: "Investing",
    icon: "📈"
  },
  {
    text: "Track it. Every single ringgit.",
    category: "Awareness",
    icon: "⚠️"
  }
];

export function AffirmationCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const currentAffirmation = affirmations[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % affirmations.length);
    setIsFavorite(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + affirmations.length) % affirmations.length);
    setIsFavorite(false);
  };

  return (
    <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl p-6 mb-6 border border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{currentAffirmation.icon}</span>
          <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
            {currentAffirmation.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 hover:bg-muted/50 rounded-full transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
            />
          </button>
          <button className="p-2 hover:bg-muted/50 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-lg font-medium mb-4 leading-relaxed">
        "{currentAffirmation.text}"
      </p>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          className="p-2 hover:bg-muted/50 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-1">
          {affirmations.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="p-2 hover:bg-muted/50 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
