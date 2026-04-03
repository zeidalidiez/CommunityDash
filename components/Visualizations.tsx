import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Polygon, G, Path, Defs, ClipPath, LinearGradient, Stop, Rect } from 'react-native-svg';

interface BaseVisProps {
  progress: number;
  color: string;
  trackColor: string;
  targetValue: number;
}

// 1. Liquid Wave (Circle filling up with a wave)
export function LiquidWave({ progress, color, trackColor }: BaseVisProps) {
  const radius = 48;
  const fillHeight = Math.min(Math.max(progress, 0), 1) * (radius * 2);
  
  // Create a stylized wave path that aligns with the fill height
  const y = radius * 2 - fillHeight;
  // If empty or full, flatten the wave to avoid visual glitches
  const waveAmplitude = (progress <= 0 || progress >= 1) ? 0 : 8;
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
      </Svg>
    </View>
  );
}

// 2. Neon Glow Ring (Layered rings for a glowing effect)
export function NeonGlowRing({ progress, color, trackColor }: BaseVisProps) {
  const radius = 48;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const p = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - p * circumference;

  return (
    <View style={styles.centerContainer}>
      <Svg height={radius * 2} width={radius * 2}>
        <Circle cx={radius} cy={radius} r={normalizedRadius} stroke={trackColor} strokeWidth={strokeWidth} fill="transparent" opacity={0.5} />
        
        {/* Glow Layers (Only visible on the active portion) */}
        {p > 0 && (
          <>
            <Circle
              cx={radius} cy={radius} r={normalizedRadius}
              stroke={color} strokeWidth={strokeWidth + 8} fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              opacity={0.2}
            />
            <Circle
              cx={radius} cy={radius} r={normalizedRadius}
              stroke={color} strokeWidth={strokeWidth + 4} fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              opacity={0.4}
            />
          </>
        )}
        
        {/* Core Ring */}
        <Circle
          cx={radius} cy={radius} r={normalizedRadius}
          stroke={color} strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset} strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// 3. Battery Core
export function BatteryCore({ progress, color, trackColor, targetValue }: BaseVisProps) {
  const blocks = Math.min(Math.max(targetValue, 2), 10);
  const completedBlocks = Math.floor(progress * blocks);

  return (
    <View style={styles.batteryWrapper}>
      <View style={[styles.batteryShell, { borderColor: trackColor }]}>
        {Array.from({ length: blocks }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.batteryBlock,
              { backgroundColor: i < completedBlocks ? color : trackColor },
              i >= completedBlocks && { opacity: 0.3 } // Dim the uncompleted blocks
            ]}
          />
        ))}
      </View>
      <View style={[styles.batteryTip, { backgroundColor: trackColor }]} />
    </View>
  );
}

// 4. Gradient Bar
export function GradientBar({ progress, color, trackColor }: BaseVisProps) {
  const width = 240;
  const height = 28;
  const p = Math.min(Math.max(progress, 0), 1);
  const fillWidth = p * width;

  return (
    <View style={{ width, height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: trackColor, opacity: progress === 0 ? 0.5 : 1 }}>
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
  );
}

// 5. Pizza Slices (Circular pie chart sliced up)
export function PizzaSlices({ progress, color, trackColor, targetValue }: BaseVisProps) {
  const radius = 48;
  const slices = Math.min(Math.max(targetValue, 2), 12);
  const completedSlices = Math.floor(progress * slices);

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
      </Svg>
    </View>
  );
}

// 6. Sun Horizon (Sun rising and setting)
export function SunHorizon({ progress, color, trackColor }: BaseVisProps) {
  const width = 160;
  const height = 80;
  const r = 60;
  const cx = width / 2;
  const cy = height - 10;
  
  const p = Math.min(Math.max(progress, 0), 1);
  const angle = Math.PI - (p * Math.PI);
  const sunX = cx + r * Math.cos(angle);
  const sunY = cy - r * Math.sin(angle);

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Svg width={width} height={height}>
        {/* Horizon */}
        <Path d={`M 0 ${cy} L ${width} ${cy}`} stroke={trackColor} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
        {/* Arc Path */}
        <Path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke={trackColor} strokeWidth={2} strokeDasharray="4 6" fill="transparent" opacity={0.4} />
        {/* Sun */}
        <Circle cx={sunX} cy={sunY} r={16} fill={color} />
      </Svg>
    </View>
  );
}

// 7. Hourglass (Sand draining from top to bottom)
export function Hourglass({ progress, color, trackColor }: BaseVisProps) {
  const width = 64;
  const height = 96;
  const p = Math.min(Math.max(progress, 0), 1);
  
  const glassPath = `M 12 12 L 52 12 L 36 48 L 52 84 L 12 84 L 28 48 Z`;
  
  const topSandHeight = 36 * (1 - p);
  const bottomSandHeight = 36 * p;

  return (
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
        
        {/* Glass Frame */}
        <Path d={glassPath} stroke={trackColor} strokeWidth={4} fill="transparent" strokeLinejoin="round" opacity={0.5} />
        
        {/* Sand */}
        <Path d={glassPath} fill={color} clipPath="url(#topSand)" opacity={0.8} />
        <Path d={glassPath} fill={color} clipPath="url(#bottomSand)" />
        
        {/* Falling Sand Stream */}
        {p > 0 && p < 1 && (
          <Rect x={width / 2 - 1} y={48} width={2} height={36} fill={color} opacity={0.6} />
        )}
      </Svg>
    </View>
  );
}

// 8. Radar Scope (Concentric rings that light up from center outwards)
export function RadarScope({ progress, color, trackColor }: BaseVisProps) {
  const radius = 48;
  const rings = 4;
  const completedRings = Math.floor(progress * rings);

  return (
    <View style={styles.centerContainer}>
      <Svg width={radius * 2} height={radius * 2}>
        {Array.from({ length: rings }).map((_, i) => {
          // Rings spread from radius down to 12
          const r = radius - (i * 12);
          // Innermost ring lights up first (index matches reverse iteration)
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
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  }
});
