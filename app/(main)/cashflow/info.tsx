import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { CashFlowPatternDiagram } from '../../../components/cashflow/CashFlowPatternDiagram';

type PatternKey = 'poor' | 'middle' | 'rich';

const patterns: Record<PatternKey, {
  emoji: string;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  title: string;
  flowPath: string;
  description: string;
  image: any;
  keyFacts: string[];
  richDadQuote: string;
  actionLabel: string;
  action: string;
  comparisonFlow: string;
}> = {
  poor: {
    emoji: '😟',
    label: 'Poor',
    shortLabel: 'Poor',
    color: '#ff6b6b',
    bgColor: 'bg-expense/10',
    borderColor: 'border-expense/30',
    title: 'The Poor Cash Flow Pattern',
    flowPath: 'Income → Expenses',
    description:
      "A poor person's entire income flows directly into expenses — rent, food, transport, clothes. There are no assets being built and no liabilities. Every ringgit earned is spent. The balance sheet stays empty.",
    image: require('../../../assets/images/cashflow/poor.png'),
    keyFacts: [
      'All income comes from a job (active income)',
      'Every ringgit goes straight to daily expenses',
      'No assets accumulating in the balance sheet',
      'No investment or savings habit',
      'Financial stress increases when job is lost',
    ],
    richDadQuote:
      '"The poor and the middle class work for money. The rich have money work for them."',
    actionLabel: 'First Step',
    action:
      'Start by saving 10% of every paycheck before spending. Open an ASB or fixed deposit account. Even RM 50/month builds the asset habit.',
    comparisonFlow: 'Job → Income → Expenses',
  },
  middle: {
    emoji: '😐',
    label: 'Middle',
    shortLabel: 'Middle',
    color: '#ffd93d',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    title: 'The Middle Class Cash Flow Pattern',
    flowPath: 'Income → Liabilities → Expenses',
    description:
      'The middle class earns more but also borrows more. Their income goes to expenses AND to monthly liability payments (mortgage, car loan, credit cards). Liabilities drain income back out — creating a treadmill that keeps them trapped.',
    image: require('../../../assets/images/cashflow/middle.png'),
    keyFacts: [
      'Income mainly from salary (still active income)',
      'Liabilities (loans) create monthly payment obligations',
      'Payments on liabilities drain income like expenses',
      'The more they earn, the more liabilities they take on',
      'Assets column exists but mostly lifestyle assets (car, house)',
    ],
    richDadQuote:
      '"The middle class buys liabilities that they think are assets — a house, a new car, appliances."',
    actionLabel: 'Key Rule',
    action:
      'Before taking any new loan, ask: "Does this asset generate income or drain it?" Focus on building income-generating assets, not lifestyle upgrades.',
    comparisonFlow: 'Job → Income → Liabilities → Expenses',
  },
  rich: {
    emoji: '💎',
    label: 'Rich',
    shortLabel: 'Rich',
    color: '#C5FF00',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    title: 'The Rich Cash Flow Pattern',
    flowPath: 'Assets → Income → Assets',
    description:
      'The rich build an asset column first — real estate, stocks, business interests. These assets generate passive income (rental, dividends, royalties). That income covers expenses and the surplus is reinvested into more assets. The cycle self-compounds.',
    image: require('../../../assets/images/cashflow/rich.png'),
    keyFacts: [
      'Income comes FROM assets, not from a job',
      'Rental income, dividends, royalties flow into income',
      'Expenses are paid by passive income — not active work',
      'Surplus income is reinvested into more assets',
      'The asset column grows continuously and automatically',
    ],
    richDadQuote:
      '"Rich people acquire assets. The poor and middle class acquire liabilities they think are assets."',
    actionLabel: 'Start Here',
    action:
      'Start by acquiring ONE income-generating asset: a unit trust, ASB, or rental property. When it generates RM 1 passively, you\'ve started the rich pattern.',
    comparisonFlow: 'Assets → Income → Expenses + More Assets',
  },
};

const comparisonData = [
  { label: 'Primary Income', poor: 'Salary only', middle: 'Salary + some passive', rich: 'Mostly passive' },
  { label: 'Assets vs Liabilities', poor: 'Neither', middle: 'More liabilities', rich: 'More assets' },
  { label: 'Financial Freedom', poor: 'None', middle: 'Limited', rich: 'Full freedom' },
  { label: 'Money Mindset', poor: 'Earn to spend', middle: 'Earn to buy assets', rich: 'Assets earn for me' },
];

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
        {/* Kiyosaki Wisdom Quote */}
        <View className="px-4 mb-4">
          <Card>
            <Text className="text-sm text-muted-foreground italic mb-2">
              {'"The cash flow pattern of an asset puts money in your pocket. The cash flow pattern of a liability takes money from your pocket."'}
            </Text>
            <Text className="text-xs text-primary font-semibold">
              — Robert Kiyosaki, Rich Dad Poor Dad
            </Text>
          </Card>
        </View>

        {/* Pattern Tabs */}
        <View className="px-4 mb-4">
          <View className="flex-row bg-card rounded-2xl p-1">
            {(['poor', 'middle', 'rich'] as PatternKey[]).map((key) => {
              const isActive = activeTab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setActiveTab(key)}
                  className={`flex-1 py-2 rounded-xl ${isActive ? `${patterns[key].bgColor} border ${patterns[key].borderColor}` : ''}`}
                >
                  <Text
                    className="text-sm font-semibold text-center"
                    style={{ color: isActive ? patterns[key].color : '#9ca3af' }}
                  >
                    {patterns[key].emoji} {patterns[key].shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Pattern Description */}
        <View className="px-4 mb-4">
          <Card className={`${activePattern.bgColor} border ${activePattern.borderColor}`}>
            <View className="flex-row items-start gap-3 mb-2">
              <Text className="text-2xl">{activePattern.emoji}</Text>
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: activePattern.color }}>
                  {activePattern.title}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {activePattern.flowPath}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-foreground leading-5">
              {activePattern.description}
            </Text>
          </Card>
        </View>

        {/* Cash Flow Pattern Image */}
        <View className="px-4 mb-4">
          <Card className="items-center py-6">
            <Text className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: activePattern.color }}>
              — Cash Flow Pattern —
            </Text>
            <CashFlowPatternDiagram pattern={activeTab} />
            <Text className="text-xs text-muted-foreground mt-4">
              Watch the money flow ↑
            </Text>
          </Card>
        </View>

        {/* Key Characteristics */}
        <View className="px-4 mb-4">
          <Card>
            <Text className="text-sm font-bold text-foreground mb-3">
              Key Characteristics
            </Text>
            {activePattern.keyFacts.map((fact, index) => (
              <View key={index} className="flex-row items-start gap-3 py-1.5">
                <View
                  className="w-1.5 h-1.5 rounded-full mt-2"
                  style={{ backgroundColor: activePattern.color }}
                />
                <Text className="text-sm text-foreground flex-1 leading-5">{fact}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Rich Dad Says */}
        <View className="px-4 mb-4">
          <Card className={`border ${activePattern.borderColor}`}>
            <View className="flex-row items-center gap-2 mb-2">
              <MessageCircle size={14} color={activePattern.color} />
              <Text className="text-xs font-semibold" style={{ color: activePattern.color }}>
                Rich Dad Says
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground italic">
              {activePattern.richDadQuote}
            </Text>
          </Card>
        </View>

        {/* Action for you */}
        <View className="px-4 mb-4">
          <View className={`bg-card border ${activePattern.borderColor} rounded-2xl p-4`}>
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: `${activePattern.color}26` }}
              >
                <Text className="text-xs font-semibold" style={{ color: activePattern.color }}>
                  {activePattern.actionLabel}
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">Action for you</Text>
            </View>
            <Text className="text-sm text-foreground leading-5">{activePattern.action}</Text>
          </View>
        </View>

        {/* Pattern Comparison (flow paths) */}
        <View className="px-4 mb-4">
          <Card>
            <Text className="text-sm font-bold text-foreground mb-3">Pattern Comparison</Text>
            {(['poor', 'middle', 'rich'] as PatternKey[]).map((key, index) => {
              const p = patterns[key];
              return (
                <View
                  key={key}
                  className={`flex-row items-center gap-3 py-3 ${index !== 2 ? 'border-b border-border' : ''}`}
                >
                  <Text className="text-xl">{p.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: p.color }}>
                      {p.label}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {p.comparisonFlow}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Detailed Comparison Table */}
        <View className="px-4 mb-8">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-4">
            Detailed Comparison
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
