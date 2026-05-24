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
    target: '10,000',
  },
  {
    id: 'emergency',
    emoji: '🛡️',
    name: 'Emergency Fund',
    description: '6 months expenses safety net',
    target: '5,000',
  },
  {
    id: 'holiday',
    emoji: '✈️',
    name: 'Holiday',
    description: 'Travel and vacation fund',
    target: '3,000',
  },
  {
    id: 'gadget',
    emoji: '📱',
    name: 'New Gadget',
    description: 'Electronics, gadgets, equipment',
    target: '2,000',
  },
  {
    id: 'downPayment',
    emoji: '🏠',
    name: 'Down Payment',
    description: 'Car, house, or big ticket items',
    target: '50,000',
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
        <Text className="text-base text-muted-foreground mb-4">Choose a template or start from scratch</Text>

        {/* Template Grid */}
        <View className="flex-col gap-3">
          {TEMPLATES.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => router.push({
                pathname: '/tabung/new/form',
                params: {
                  templateId: template.id,
                  templateName: template.name,
                  templateEmoji: template.emoji,
                  templateTarget: template.target,
                }
              })}
              className="w-full bg-card rounded-2xl p-4 border border-border active:scale-[0.98] transition-transform flex-row items-center gap-4"
            >
              <Text className="text-3xl">{template.emoji}</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-1">{template.name}</Text>
                <Text className="text-xs text-muted-foreground">{template.description}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold text-primary">RM {template.target}</Text>
                <Text className="text-xs text-muted-foreground">target</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Start from Scratch */}
        <Pressable
          onPress={() => router.push({
                pathname: '/tabung/new/form',
                params: { templateId: 'custom' }
              })}
          className="w-full mt-2 bg-card rounded-2xl py-4 items-center border-2 border-dashed border-primary/40 active:scale-[0.98] transition-transform"
          style={{ borderStyle: 'dashed' }}
        >
          <Text className="text-primary font-semibold">Start from Scratch</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}