import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressRingProps {
  radius: number;
  strokeWidth: number;
  progress: number;
  color: string;
  trackColor?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressRing({ radius, strokeWidth, progress, color, trackColor = '#e6e6e6' }: ProgressRingProps) {
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = new Animated.Value(circumference);

  useEffect(() => {
    const toValue = circumference - (Math.min(Math.max(progress, 0), 1) * circumference);
    Animated.timing(strokeDashoffset, {
      toValue,
      duration: 500,
      useNativeDriver: false, // Must be false for Web SVG animations
    }).start();
  }, [progress, circumference, strokeDashoffset]);

  return (
    <View style={styles.container}>
      <Svg height={radius * 2} width={radius * 2}>
        <Circle
          stroke={trackColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <AnimatedCircle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
