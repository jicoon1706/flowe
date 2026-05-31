import { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  children?: ReactNode;
}

/**
 * Renders a multi-segment donut where each segment's arc length is proportional
 * to its value relative to the total. Replaces the old border-trick approximation
 * so income/expense rings reflect the correct ratios.
 */
export function DonutChart({
  segments,
  size = 144,
  strokeWidth = 16,
  trackColor = '#1a1a1a',
  children,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  let accum = 0;
  const arcs = total > 0
    ? segments
        .filter((s) => s.value > 0)
        .map((s, i) => {
          const dash = (s.value / total) * circumference;
          const arc = {
            key: i,
            color: s.color,
            dashArray: `${dash} ${circumference - dash}`,
            dashOffset: -accum,
          };
          accum += dash;
          return arc;
        })
    : [];

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {arcs.map((arc) => (
          <Circle
            key={arc.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={arc.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={arc.dashArray}
            strokeDashoffset={arc.dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </Svg>
      {children}
    </View>
  );
}
