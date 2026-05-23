import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from '../../../../components/ui/icons';

const TEMPLATES = [
  {
    id: 'tabungRaya',
    emoji: '🎉',
    name: 'Tabung Raya',
    description: 'Hari Raya, weddings, big celebrations',
  },
  {
    id: 'emergency',
    emoji: '🛡️',
    name: 'Emergency Fund',
    description: '6 months expenses safety net',
  },
  {
    id: 'holiday',
    emoji: '✈️',
    name: 'Holiday',
    description: 'Travel and vacation fund',
  },
  {
    id: 'gadget',
    emoji: '📱',
    name: 'New Gadget',
    description: 'Electronics, gadgets, equipment',
  },
  {
    id: 'downPayment',
    emoji: '🏠',
    name: 'Down Payment',
    description: 'Car, house, or big ticket items',
  },
];

export default function NewTabungIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-xl font-semibold text-foreground">New Tabung</Text>
      </View>

      <View className="flex-1 px-4 py-4">
        {/* Template Grid */}
        <View className="flex-col gap-3">
          {TEMPLATES.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => router.push(`/tabung/new/form?template=${template.id}`)}
              className="w-full bg-card rounded-2xl p-4 border border-border active:scale-[0.98] transition-transform"
            >
              <Text className="text-3xl mb-2">{template.emoji}</Text>
              <Text className="text-sm font-semibold text-foreground mb-1">{template.name}</Text>
              <Text className="text-xs text-muted-foreground">{template.description}</Text>
            </Pressable>
          ))}
        </View>

        {/* Start from Scratch */}
        <Pressable
          onPress={() => router.push('/tabung/new/form?template=custom')}
          className="w-full mt-2 bg-card rounded-2xl py-4 items-center border-2 border-dashed border-primary/40 active:scale-[0.98] transition-transform"
          style={{ borderStyle: 'dashed' }}
        >
          <Text className="text-primary font-semibold">Start from Scratch</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}