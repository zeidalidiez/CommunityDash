import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, {
  Circle,
  G,
  Path,
  Defs,
  ClipPath,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';

interface BaseVisProps {
  progress: number;
  color: string;
  trackColor: string;
  targetValue: number;
  overflow?: boolean;
}

function OverflowBadge({ overflow, progress }: { overflow?: boolean; progress: number }) {
  if (!overflow || progress <= 1) return null;
  const pct = Math.round((progress - 1) * 100);
  return (
    <View style={styles.overflowBadge}>
      <Text style={styles.overflowBadgeText}>+{pct}%</Text>
    </View>
  );
}

// 1. Liquid Wave
export function LiquidWave({ progress, color, trackColor, overflow }: BaseVisProps) {
  const radius = 48;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const fillHeight = clamped * (radius * 2);
  const y = radius * 2 - fillHeight;
  const waveAmplitude = clamped <= 0 || clamped >= 1 ? 0 : 8;
  const wavePath = `M 0 ${y} Q ${radius / 2} ${y - waveAmplitude}, ${radius} ${y} T ${radius * 2} ${y} L ${radius * 2} ${radius * 2} L 0 ${radius * 2} Z`;

  return (
    <View style={styles.centerContainer}>
      <Svg height={radius * 2} width={radius * 2}>
        <Defs>
          <ClipPath id="circleClip">
            <Circle cx={radius} cy={radius} r={radius} />
          </ClipPath>
        </Defs>
        <Circle cx={radius} cy={radius} r={radius} fill={trackColor} opacity={0.5} />
        <G clipPath="url(#circleClip)">
          <Path d={wavePath} fill={color} />
        </G>
        {overflow && progress > 1 && (
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 2}
            stroke={color}
            strokeWidth={4}
            fill="transparent"
            opacity={0.85}
          />
        )}
      </Svg>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// 2. Neon Glow Ring
export function NeonGlowRing({ progress, color, trackColor, overflow }: BaseVisProps) {
  const radius = 48;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Allow visual arc past full circle for overflow (wrap once)
  const p = Math.min(Math.max(progress, 0), 2);
  const displayP = Math.min(p, 1);
  const strokeDashoffset = circumference - displayP * circumference;

  return (
    <View style={styles.centerContainer}>
      <Svg height={radius * 2} width={radius * 2}>
        <Circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.5}
        />
        {displayP > 0 && (
          <>
            <Circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              stroke={color}
              strokeWidth={strokeWidth + 8}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              opacity={0.2}
            />
            <Circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </>
        )}
        {overflow && progress > 1 && (
          <Circle
            cx={radius}
            cy={radius}
            r={normalizedRadius + 10}
            stroke={color}
            strokeWidth={3}
            fill="transparent"
            opacity={0.5}
            strokeDasharray="4 4"
          />
        )}
      </Svg>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// 3. Battery Core
export function BatteryCore({ progress, color, trackColor, targetValue, overflow }: BaseVisProps) {
  const blocks = Math.min(Math.max(targetValue, 2), 10);
  const completedBlocks = Math.min(Math.floor(Math.min(progress, 1) * blocks), blocks);

  return (
    <View style={styles.centerContainer}>
      <View style={styles.batteryWrapper}>
        <View
          style={[
            styles.batteryShell,
            { borderColor: overflow ? color : trackColor },
          ]}
        >
          {Array.from({ length: blocks }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.batteryBlock,
                { backgroundColor: i < completedBlocks ? color : trackColor },
                i >= completedBlocks && { opacity: 0.3 },
              ]}
            />
          ))}
        </View>
        <View style={[styles.batteryTip, { backgroundColor: overflow ? color : trackColor }]} />
      </View>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// 4. Gradient Bar
export function GradientBar({ progress, color, trackColor, overflow }: BaseVisProps) {
  const width = 240;
  const height = 28;
  const p = Math.min(Math.max(progress, 0), 1);
  const fillWidth = p * width;

  return (
    <View style={styles.centerContainer}>
      <View
        style={{
          width,
          height,
          borderRadius: height / 2,
          overflow: 'hidden',
          backgroundColor: trackColor,
          opacity: progress === 0 ? 0.5 : 1,
          borderWidth: overflow ? 2 : 0,
          borderColor: color,
        }}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={color} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={fillWidth} height={height} fill="url(#gradBar)" rx={height / 2} />
        </Svg>
      </View>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// 5. Pizza Slices
export function PizzaSlices({ progress, color, trackColor, targetValue, overflow }: BaseVisProps) {
  const radius = 48;
  const slices = Math.min(Math.max(targetValue, 2), 12);
  const completedSlices = Math.min(Math.floor(Math.min(progress, 1) * slices), slices);

  const getSlicePath = (index: number, total: number) => {
    const startAngle = (index * 360) / total - 90;
    const endAngle = ((index + 1) * 360) / total - 90;
    const startX = radius + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = radius + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = radius + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = radius + radius * Math.sin((endAngle * Math.PI) / 180);
    const largeArcFlag = 360 / total > 180 ? 1 : 0;
    return `M ${radius} ${radius} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };

  return (
    <View style={styles.centerContainer}>
      <Svg height={radius * 2} width={radius * 2}>
        <Circle cx={radius} cy={radius} r={radius} fill={trackColor} opacity={0.3} />
        {Array.from({ length: slices }).map((_, i) => (
          <Path
            key={`slice-${i}`}
            d={getSlicePath(i, slices)}
            fill={i < completedSlices ? color : 'transparent'}
            stroke={trackColor}
            strokeWidth={1}
          />
        ))}
        {overflow && (
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 2}
            stroke={color}
            strokeWidth={3}
            fill="transparent"
            strokeDasharray="6 4"
          />
        )}
      </Svg>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// 6. Sun Horizon
export function SunHorizon({ progress, color, trackColor, overflow }: BaseVisProps) {
  const width = 160;
  const height = 80;
  const r = 60;
  const cx = width / 2;
  const cy = height - 10;
  const p = Math.min(Math.max(progress, 0), 1);
  const angle = Math.PI - p * Math.PI;
  const sunX = cx + r * Math.cos(angle);
  const sunY = cy - r * Math.sin(angle);

  return (
    <View style={styles.centerContainer}>
      <View style={{ width, height, alignItems: 'center', justifyContent: 'flex-end' }}>
        <Svg width={width} height={height}>
          <Path
            d={`M 0 ${cy} L ${width} ${cy}`}
            stroke={trackColor}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.5}
          />
          <Path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            stroke={trackColor}
            strokeWidth={2}
            strokeDasharray="4 6"
            fill="transparent"
            opacity={0.4}
          />
          <Circle cx={sunX} cy={sunY} r={overflow ? 20 : 16} fill={color} />
        </Svg>
      </View>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// 7. Hourglass
export function Hourglass({ progress, color, trackColor, overflow }: BaseVisProps) {
  const width = 64;
  const height = 96;
  const p = Math.min(Math.max(progress, 0), 1);
  const glassPath = `M 12 12 L 52 12 L 36 48 L 52 84 L 12 84 L 28 48 Z`;
  const topSandHeight = 36 * (1 - p);
  const bottomSandHeight = 36 * p;

  return (
    <View style={styles.centerContainer}>
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={width} height={height}>
          <Defs>
            <ClipPath id="topSand">
              <Rect x={0} y={48 - topSandHeight} width={width} height={topSandHeight} />
            </ClipPath>
            <ClipPath id="bottomSand">
              <Rect x={0} y={84 - bottomSandHeight} width={width} height={bottomSandHeight} />
            </ClipPath>
          </Defs>
          <Path
            d={glassPath}
            stroke={overflow ? color : trackColor}
            strokeWidth={4}
            fill="transparent"
            strokeLinejoin="round"
            opacity={0.5}
          />
          <Path d={glassPath} fill={color} clipPath="url(#topSand)" opacity={0.8} />
          <Path d={glassPath} fill={color} clipPath="url(#bottomSand)" />
          {p > 0 && p < 1 && (
            <Rect x={width / 2 - 1} y={48} width={2} height={36} fill={color} opacity={0.6} />
          )}
        </Svg>
      </View>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// 8. Radar Scope
export function RadarScope({ progress, color, trackColor, overflow }: BaseVisProps) {
  const radius = 48;
  const rings = 4;
  const completedRings = Math.min(Math.floor(Math.min(progress, 1) * rings), rings);

  return (
    <View style={styles.centerContainer}>
      <Svg width={radius * 2} height={radius * 2}>
        {Array.from({ length: rings }).map((_, i) => {
          const r = radius - i * 12;
          const ringLevel = rings - i - 1;
          return (
            <Circle
              key={`ring-${i}`}
              cx={radius}
              cy={radius}
              r={r - 4}
              stroke={ringLevel < completedRings ? color : trackColor}
              strokeWidth={6}
              fill="transparent"
              opacity={ringLevel < completedRings ? 1 : 0.3}
            />
          );
        })}
        {overflow && (
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 2}
            stroke={color}
            strokeWidth={2}
            fill="transparent"
            strokeDasharray="3 3"
          />
        )}
      </Svg>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowBadge: {
    marginTop: 8,
    backgroundColor: '#f39c1233',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  overflowBadgeText: {
    color: '#e67e22',
    fontSize: 12,
    fontWeight: '800',
  },
  batteryWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batteryShell: {
    flexDirection: 'row',
    gap: 4,
    borderWidth: 4,
    padding: 4,
    borderRadius: 12,
    width: 220,
    height: 48,
  },
  batteryBlock: {
    flex: 1,
    borderRadius: 4,
  },
  batteryTip: {
    width: 8,
    height: 20,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});
