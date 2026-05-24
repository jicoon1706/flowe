import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, X, FilePlus } from '../../../../../components/ui/icons';

export default function AddEntryScreen() {
  const router = useRouter();
  useLocalSearchParams<{ projectId: string }>();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const canSave = text.trim().length > 0 || images.length > 0;

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!canSave) return;
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-xl font-semibold text-foreground">Tambah Entri</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {/* Text Area */}
        <View className="mt-4">
          <Text className="text-xs text-muted-foreground mb-2">Nota</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground min-h-[120]"
            placeholder="What did you learn?"
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Image Grid */}
        <View className="mt-4">
          <Text className="text-xs text-muted-foreground mb-2">Images</Text>
          <View className="flex-row flex-wrap">
            {images.map((img, index) => (
              <View key={index} className="relative mr-2 mb-2">
                <Image
                  source={{ uri: img }}
                  className="w-20 h-20 rounded-xl"
                />
                <Pressable
                  onPress={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-expense items-center justify-center"
                >
                  <X size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            {images.length < 4 && (
              <Pressable
                onPress={() => {
                  // Placeholder: image picker would go here
                  // For now, add a placeholder image
                  setImages([...images, 'https://placehold.co/100x100/2a2a2a/C5FF00?text=Img']);
                }}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-border items-center justify-center mb-2"
              >
                <FilePlus size={20} color="#888" />
                <Text className="text-xs text-muted-foreground mt-1">Add</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="px-4 pb-6">
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-2xl py-3 items-center ${
            canSave ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              canSave ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Simpan
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}