import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Polygon, G } from 'react-native-svg';
import { Star } from 'lucide-react-native';

interface BaseVisProps {
  progress: number;
  color: string;
  trackColor: string;
  targetValue: number;
}

// 1. Segmented Steps
export function SegmentedSteps({ progress, color, trackColor, targetValue }: BaseVisProps) {
  // Cap the visual segments between 2 and 20 to avoid tiny unrenderable slivers
  const steps = Math.min(Math.max(targetValue, 2), 20);
  const completedSteps = Math.floor(progress * steps);
  
  return (
    <View style={styles.segmentedContainer}>
      {Array.from({ length: steps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { backgroundColor: i < completedSteps ? color : trackColor }
          ]}
        />
      ))}
    </View>
  );
}

// 2. Step Journey (Nodes connected by lines)
export function StepJourney({ progress, color, trackColor, targetValue }: BaseVisProps) {
  // Cap nodes between 2 and 15
  const nodes = Math.min(Math.max(targetValue, 2), 15);
  const completedNodes = Math.floor(progress * (nodes - 1)); // 0 to nodes-1 lines
  
  return (
    <View style={styles.journeyContainer}>
      {Array.from({ length: nodes }).map((_, i) => (
        <React.Fragment key={`node-${i}`}>
          <View style={[
            styles.node, 
            { backgroundColor: i <= Math.ceil(progress * (nodes - 1)) ? color : trackColor }
          ]} />
          {i < nodes - 1 && (
            <View style={[
              styles.journeyLine, 
              { backgroundColor: i < completedNodes ? color : trackColor }
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// 3. Star Rating (5 Stars filling proportionally)
export function StarRating({ progress, color, trackColor }: BaseVisProps) {
  const stars = 5;
  const filledStars = progress * stars;

  return (
    <View style={styles.starContainer}>
      {Array.from({ length: stars }).map((_, i) => {
        const fillAmount = Math.max(0, Math.min(1, filledStars - i));
        
        return (
          <View key={`star-${i}`} style={styles.starWrapper}>
            {/* Background Star */}
            <Star color={trackColor} fill={trackColor} size={40} />
            
            {/* Foreground (Filled) Star clipped by width */}
            <View style={[StyleSheet.absoluteFill, { width: `${fillAmount * 100}%`, overflow: 'hidden' }]}>
              <Star color={color} fill={color} size={40} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// 4. Color Circle (Shifts from red to green as progress nears 1)
export function ColorCircle({ progress }: BaseVisProps) {
  // Simple hue interpolation: 0 = red (0deg), 1 = green (120deg)
  const hue = Math.min(Math.max(progress * 120, 0), 120);
  const color = `hsl(${hue}, 80%, 50%)`;
  const radius = 48;

  return (
    <View style={styles.colorCircleContainer}>
      <Svg height={radius * 2} width={radius * 2}>
        <Circle cx={radius} cy={radius} r={radius} fill={color} />
      </Svg>
    </View>
  );
}

// 5. Speedometer (Half-circle gauge)
export function Speedometer({ progress, color, trackColor }: BaseVisProps) {
  const radius = 64;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth;
  const circumference = normalizedRadius * Math.PI; // Half circle
  
  // Progress clamping
  const p = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - p * circumference;

  // Needle rotation: -90deg (0) to 90deg (1)
  const rotation = -90 + (p * 180);

  return (
    <View style={[styles.speedometerContainer, { height: radius + 15 }]}>
      <Svg height={radius * 2} width={radius * 2}>
        <G rotation="180" origin={`${radius}, ${radius}`}>
          {/* Track Arc */}
          <Circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Progress Arc */}
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
        </G>
        
        {/* Needle */}
        <G rotation={rotation} origin={`${radius}, ${radius}`}>
          <Polygon points={`${radius - 6},${radius} ${radius + 6},${radius} ${radius},${strokeWidth + 8}`} fill={color} />
          <Circle cx={radius} cy={radius} r={8} fill={color} />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedContainer: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    maxWidth: 280, // Fill available horizontal space cleanly
    height: 24,
  },
  segment: {
    flex: 1,
    borderRadius: 6,
  },
  journeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
  },
  node: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  journeyLine: {
    flex: 1,
    height: 6,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  colorCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedometerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  }
});
