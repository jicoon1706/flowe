import { View, Text, Pressable } from 'react-native';
import { Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react-native';

export type AffirmationItem = { emoji: string; category: string; quote: string };

const FALLBACK: AffirmationItem[] = [
  { emoji: '✨', category: 'Mindset', quote: 'Add your own affirmations in Settings → Affirmations.' },
];

interface AffirmationCardProps {
  index: number;
  items?: AffirmationItem[];
  onNext: () => void;
  onPrev: () => void;
  onFavourite: () => void;
  onShare: () => void;
}

export function AffirmationCard({ index, items, onNext, onPrev, onFavourite, onShare }: AffirmationCardProps) {
  const affirmations = items && items.length > 0 ? items : FALLBACK;
  const current = affirmations[((index % affirmations.length) + affirmations.length) % affirmations.length];

  return (
    <View className="mx-4 mb-5 bg-primary/10 border border-primary/20 rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg">{current.emoji}</Text>
          <Text className="text-xs text-primary font-medium uppercase tracking-wider">
            {current.category}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onFavourite} className="p-1">
            <Heart size={18} color="#EF4444" fill="#EF4444" />
          </Pressable>
          <Pressable onPress={onShare} className="p-1">
            <Share2 size={18} color="#a0a0a0" />
          </Pressable>
        </View>
      </View>
      <Text className="text-sm italic text-foreground mb-4 leading-relaxed">
        {current.quote}
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          {affirmations.map((_, i) => (
            <View
              key={i}
              className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
                i === index % affirmations.length ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={onPrev} className="p-1">
            <ChevronLeft size={18} color="#a0a0a0" />
          </Pressable>
          <Pressable onPress={onNext} className="p-1">
            <ChevronRight size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}