import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, ArrowRight, Banknote } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';

const patterns = {
  poor: {
    emoji: '😟',
    label: 'Poor Pattern',
    color: '#ff6b6b',
    bgColor: 'bg-expense/10',
    borderColor: 'border-expense/30',
    flow: ['Job', 'Income', 'Expenses', 'Money Gone'],
    flowIcons: ['briefcase', 'wallet', 'shopping-cart', 'x-circle'],
    keyFacts: [
      'Only source of income is salary',
      'No savings or investments',
      'Expenses equal or exceed income',
      'Living paycheck to paycheck',
    ],
    quote: '"The poor work for money. The rich have money work for them."',
    tip: 'Start building an emergency fund with just RM 100/month',
  },
  middle: {
    emoji: '😐',
    label: 'Middle Class',
    color: '#ffd93d',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    flow: ['Job', 'Income', 'Liabilities', 'Treadmill Loop'],
    flowIcons: ['briefcase', 'wallet', 'credit-card', 'refresh-cw'],
    keyFacts: [
      'Primary income is salary',
      'Accumulating liabilities (car loans, mortgages)',
      'Passive income is minimal',
      'Stuck on the financial treadmill',
    ],
    quote: '"The middle class buys liabilities, thinking they are assets."',
    tip: 'Focus on paying off liabilities and building real assets',
  },
  rich: {
    emoji: '💎',
    label: 'Rich Pattern',
    color: '#C5FF00',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    flow: ['Assets', 'Income', 'Expenses', 'Reinvest'],
    flowIcons: ['trending-up', 'dollar-sign', 'shopping-bag', 'repeat'],
    keyFacts: [
      'Passive income exceeds expenses',
      'Owns income-producing assets',
      'Continuously reinvests profits',
      'Money works for them 24/7',
    ],
    quote: '"The rich acquire assets. The poor merely create expenses."',
    tip: 'Keep reinvesting 50% of your passive income into assets',
  },
};

const comparisonData = [
  { label: 'Primary Income', poor: 'Salary only', middle: 'Salary + some passive', rich: 'Mostly passive' },
  { label: 'Assets vs Liabilities', poor: 'Neither', middle: 'More liabilities', rich: 'More assets' },
  { label: 'Financial Freedom', poor: 'None', middle: 'Limited', rich: 'Full freedom' },
  { label: 'Money Mindset', poor: 'Earn to spend', middle: 'Earn to buy assets', rich: 'Assets earn for me' },
];

type PatternKey = 'poor' | 'middle' | 'rich';

export default function CashFlowGuideScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PatternKey>('poor');

  const activePattern = patterns[activeTab];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Cash Flow Guide"
        onBack={() => router.back()}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pattern Tabs */}
        <View className="px-4 mb-4">
          <View className="flex-row bg-card rounded-2xl p-1">
            {(['poor', 'middle', 'rich'] as PatternKey[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => setActiveTab(key)}
                className={`flex-1 py-2 rounded-xl ${activeTab === key ? 'bg-primary' : ''}`}
              >
                <Text
                  className={`text-sm font-semibold text-center ${
                    activeTab === key ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {patterns[key].emoji} {patterns[key].label.split(' ')[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Animated Diagram Card */}
        <View className="px-4 mb-4">
          <Card className="items-center py-6">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">
              Cash Flow Pattern
            </Text>
            <View className="w-full flex-row items-center justify-center gap-2 mb-4">
              {activePattern.flow.map((step, index) => (
                <React.Fragment key={step}>
                  <View className="items-center">
                    <View
                      className={`w-12 h-12 rounded-xl ${activePattern.bgColor} border ${activePattern.borderColor} items-center justify-center mb-1`}
                    >
                      {index === 0 && <Banknote size={20} color={activePattern.color} />}
                      {index === 1 && <TrendingUp size={20} color={activePattern.color} />}
                      {index === 2 && <TrendingDown size={20} color={activePattern.color} />}
                      {index === 3 && <ArrowRight size={20} color={activePattern.color} />}
                    </View>
                    <Text className="text-xs text-foreground text-center">{step}</Text>
                  </View>
                  {index < activePattern.flow.length - 1 && (
                    <View className="flex-row items-center gap-1">
                      <View className="w-4 h-0.5" style={{ backgroundColor: activePattern.color }} />
                      <Text style={{ color: activePattern.color }}>→</Text>
                    </View>
                  )}
                </React.Fragment>
              ))}
            </View>
            <Text className="text-sm text-muted-foreground text-center px-4">
              {activeTab === 'poor' && 'You work hard, earn money, and it disappears on expenses'}
              {activeTab === 'middle' && 'You work harder but liabilities drain your income'}
              {activeTab === 'rich' && 'Your money works for you, creating wealth automatically'}
            </Text>
          </Card>
        </View>

        {/* Key Facts */}
        <View className="px-4 mb-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Key Facts
          </Text>
          <Card>
            {activePattern.keyFacts.map((fact, index) => (
              <View
                key={index}
                className={`flex-row items-center gap-3 py-2 ${index !== activePattern.keyFacts.length - 1 ? 'border-b border-border' : ''}`}
              >
                <View
                  className={`w-2 h-2 rounded-full`}
                  style={{ backgroundColor: activePattern.color }}
                />
                <Text className="text-sm text-foreground flex-1">{fact}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Rich Dad Quote */}
        <View className="px-4 mb-4">
          <Card className={`border ${activePattern.borderColor}`}>
            <Text className="text-lg text-primary italic mb-2">The rich acquire assets. The poor merely create expenses.</Text>
            <Text className="text-xs text-muted-foreground">— Robert Kiyosaki, Rich Dad Poor Dad</Text>
          </Card>
        </View>

        {/* Actionable Tip */}
        <View className="px-4 mb-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Your Action
          </Text>
          <View className={`bg-card border ${activePattern.borderColor} rounded-2xl p-4`}>
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-lg">💡</Text>
              <Text className="text-sm font-semibold text-foreground">Tip</Text>
            </View>
            <Text className="text-sm text-muted-foreground">{activePattern.tip}</Text>
          </View>
        </View>

        {/* Comparison Table */}
        <View className="px-4 mb-8">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Pattern Comparison
          </Text>
          <Card className="p-0">
            <View className="flex-row bg-card border-b border-border">
              <View className="flex-1 p-3">
                <Text className="text-xs font-semibold text-muted-foreground">Attribute</Text>
              </View>
              <View className="flex-1 p-3 border-l border-border">
                <Text className="text-xs font-semibold text-muted-foreground">Poor</Text>
              </View>
              <View className="flex-1 p-3 border-l border-border">
                <Text className="text-xs font-semibold text-muted-foreground">Middle</Text>
              </View>
              <View className="flex-1 p-3 border-l border-border">
                <Text className="text-xs font-semibold text-primary">Rich</Text>
              </View>
            </View>
            {comparisonData.map((row, index) => (
              <View
                key={index}
                className={`flex-row border-b ${index !== comparisonData.length - 1 ? 'border-border' : ''}`}
              >
                <View className="flex-1 p-3">
                  <Text className="text-xs text-foreground">{row.label}</Text>
                </View>
                <View className="flex-1 p-3 border-l border-border">
                  <Text className="text-xs text-expense">{row.poor}</Text>
                </View>
                <View className="flex-1 p-3 border-l border-border">
                  <Text className="text-xs text-yellow-500">{row.middle}</Text>
                </View>
                <View className="flex-1 p-3 border-l border-border">
                  <Text className="text-xs text-primary font-medium">{row.rich}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}