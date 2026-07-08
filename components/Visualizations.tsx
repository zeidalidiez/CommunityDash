import React, { useEffect, useId, useRef, useState } from 'react';
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
  Line,
  Ellipse,
} from 'react-native-svg';

export interface BaseVisProps {
  progress: number;
  color: string;
  trackColor: string;
  targetValue: number;
  currentValue?: number;
  overflow?: boolean;
}

/** Ease progress toward the latest value for satisfying +/- feedback. */
function useSmoothedProgress(target: number, durationMs = 420): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = valueRef.current;
    const end = target;
    if (Math.abs(end - start) < 0.0001) {
      valueRef.current = end;
      setValue(end);
      return;
    }
    const t0 =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + (end - start) * eased;
      valueRef.current = next;
      setValue(next);
      if (t < 1) {
        frameRef.current =
          typeof requestAnimationFrame !== 'undefined'
            ? requestAnimationFrame(tick)
            : null;
      }
    };
    frameRef.current =
      typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame(tick)
        : null;
    // fallback if no rAF (tests)
    if (frameRef.current == null) {
      valueRef.current = end;
      setValue(end);
    }
    return () => {
      if (frameRef.current != null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, durationMs]);

  return value;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function lighten(hex: string, amount = 0.35): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function OverflowBadge({ overflow, progress }: { overflow?: boolean; progress: number }) {
  if (!overflow || progress <= 1) return null;
  const pct = Math.round((progress - 1) * 100);
  return (
    <View style={styles.overflowBadge}>
      <Text style={styles.overflowBadgeText}>+{pct}% over</Text>
    </View>
  );
}

function CenterLabel({
  text,
  color,
  sub,
}: {
  text: string;
  color: string;
  sub?: string;
}) {
  return (
    <View style={styles.centerLabel} pointerEvents="none">
      <Text style={[styles.centerLabelText, { color }]} numberOfLines={1}>
        {text}
      </Text>
      {sub ? (
        <Text style={[styles.centerLabelSub, { color }]} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

/** Discrete beads — great for water glasses, sets, small countable goals. */
function UnitBeads({
  current,
  target,
  color,
  trackColor,
  overflow,
}: {
  current: number;
  target: number;
  color: string;
  trackColor: string;
  overflow?: boolean;
}) {
  const beads = Math.min(Math.max(Math.round(target), 1), 16);
  const fullCount = Math.floor(Math.min(current, beads));
  const frac = Math.min(current, beads) - fullCount;

  return (
    <View style={styles.beadsRow}>
      {Array.from({ length: beads }).map((_, i) => {
        const isFull = i < fullCount;
        const isPartial = i === fullCount && frac > 0.02;
        return (
          <View
            key={i}
            style={[
              styles.bead,
              {
                borderColor: overflow && i < fullCount ? color : trackColor,
                backgroundColor: isFull ? color : trackColor,
                opacity: isFull ? 1 : isPartial ? 0.35 + frac * 0.65 : 0.25,
                transform: [{ scale: isFull || isPartial ? 1 : 0.92 }],
              },
            ]}
          >
            {isPartial && (
              <View
                style={[
                  styles.beadFill,
                  {
                    backgroundColor: color,
                    width: `${Math.round(frac * 100)}%` as any,
                  },
                ]}
              />
            )}
          </View>
        );
      })}
      {overflow && current > target && (
        <Text style={[styles.beadExtra, { color }]}>+{Math.round(current - target)}</Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// 1. Liquid Wave — dual-wave fill + center %
// ─────────────────────────────────────────────
export function LiquidWave({ progress, color, trackColor, overflow, currentValue, targetValue }: BaseVisProps) {
  const p = useSmoothedProgress(progress);
  const id = useId().replace(/:/g, '');
  const size = 112;
  const radius = size / 2;
  const fill = clamp(p, 0, 1);
  const y = size - fill * size;
  const amp = fill <= 0.02 || fill >= 0.98 ? 0 : 6 + fill * 4;
  // Two phase-offset waves for depth
  const wave1 = `M 0 ${y} Q ${radius * 0.5} ${y - amp}, ${radius} ${y} T ${size} ${y} L ${size} ${size} L 0 ${size} Z`;
  const wave2 = `M 0 ${y + 3} Q ${radius * 0.5} ${y + amp * 0.7}, ${radius} ${y + 3} T ${size} ${y + 3} L ${size} ${size} L 0 ${size} Z`;
  const pct = Math.round(p * 100);
  const label =
    currentValue != null
      ? String(Math.round(currentValue * 10) / 10)
      : `${pct}%`;

  return (
    <View style={styles.centerContainer}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            <ClipPath id={`lw-clip-${id}`}>
              <Circle cx={radius} cy={radius} r={radius - 3} />
            </ClipPath>
            <LinearGradient id={`lw-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lighten(color, 0.45)} stopOpacity="1" />
              <Stop offset="1" stopColor={color} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 1}
            fill={trackColor}
            opacity={0.45}
          />
          <G clipPath={`url(#lw-clip-${id})`}>
            <Path d={wave2} fill={color} opacity={0.45} />
            <Path d={wave1} fill={`url(#lw-grad-${id})`} />
            {/* surface highlight */}
            {fill > 0.05 && fill < 0.98 && (
              <Ellipse
                cx={radius}
                cy={y + 2}
                rx={radius * 0.55}
                ry={3}
                fill="#ffffff"
                opacity={0.25}
              />
            )}
          </G>
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 2}
            stroke={overflow ? color : trackColor}
            strokeWidth={overflow ? 4 : 2}
            fill="transparent"
            opacity={overflow ? 0.9 : 0.5}
          />
          {overflow && (
            <Circle
              cx={radius}
              cy={radius}
              r={radius - 8}
              stroke={color}
              strokeWidth={2}
              fill="transparent"
              strokeDasharray="5 4"
              opacity={0.7}
            />
          )}
        </Svg>
        <CenterLabel
          text={label}
          sub={targetValue ? `/ ${targetValue}` : undefined}
          color={fill > 0.55 ? '#fff' : color}
        />
      </View>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// ─────────────────────────────────────────────
// 2. Neon Glow Ring — dual arc; overflow = second lap
// ─────────────────────────────────────────────
export function NeonGlowRing({ progress, color, trackColor, overflow, currentValue, targetValue }: BaseVisProps) {
  const p = useSmoothedProgress(progress);
  const size = 112;
  const radius = size / 2;
  const strokeWidth = 10;
  const r = radius - strokeWidth - 4;
  const circumference = 2 * Math.PI * r;
  const base = clamp(p, 0, 1);
  const over = clamp(p - 1, 0, 1);
  const offsetBase = circumference * (1 - base);
  const offsetOver = circumference * (1 - over);
  const pct = Math.round(p * 100);

  return (
    <View style={styles.centerContainer}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={radius}
            cy={radius}
            r={r}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.4}
          />
          {/* Soft glow */}
          {base > 0 && (
            <Circle
              cx={radius}
              cy={radius}
              r={r}
              stroke={color}
              strokeWidth={strokeWidth + 10}
              fill="transparent"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={offsetBase}
              strokeLinecap="round"
              opacity={0.18}
              rotation={-90}
              origin={`${radius}, ${radius}`}
            />
          )}
          <Circle
            cx={radius}
            cy={radius}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offsetBase}
            strokeLinecap="round"
            rotation={-90}
            origin={`${radius}, ${radius}`}
          />
          {/* Overflow second lap */}
          {over > 0.01 && (
            <Circle
              cx={radius}
              cy={radius}
              r={r - strokeWidth - 2}
              stroke={lighten(color, 0.25)}
              strokeWidth={5}
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * (r - strokeWidth - 2)}`}
              strokeDashoffset={
                2 * Math.PI * (r - strokeWidth - 2) * (1 - over)
              }
              strokeLinecap="round"
              rotation={-90}
              origin={`${radius}, ${radius}`}
              opacity={0.95}
            />
          )}
        </Svg>
        <CenterLabel
          text={
            currentValue != null
              ? String(Math.round(currentValue * 10) / 10)
              : `${pct}%`
          }
          sub={targetValue ? `of ${targetValue}` : undefined}
          color={color}
        />
      </View>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// ─────────────────────────────────────────────
// 3. Battery — cells with fractional last cell
// ─────────────────────────────────────────────
export function BatteryCore({
  progress,
  color,
  trackColor,
  targetValue,
  overflow,
  currentValue,
}: BaseVisProps) {
  const p = useSmoothedProgress(progress);
  const cells = Math.min(Math.max(Math.round(targetValue) || 4, 2), 10);
  const filledExact = clamp(p, 0, 1) * cells;
  const fullCells = Math.floor(filledExact);
  const frac = filledExact - fullCells;

  return (
    <View style={styles.centerContainer}>
      <View style={styles.batteryWrapper}>
        <View
          style={[
            styles.batteryShell,
            {
              borderColor: overflow ? color : trackColor,
              shadowColor: overflow ? color : 'transparent',
            },
          ]}
        >
          {Array.from({ length: cells }).map((_, i) => {
            let fillPct = 0;
            if (i < fullCells) fillPct = 1;
            else if (i === fullCells) fillPct = frac;
            return (
              <View
                key={i}
                style={[styles.batteryBlock, { backgroundColor: trackColor, opacity: 0.35 }]}
              >
                <View
                  style={[
                    styles.batteryBlockFill,
                    {
                      backgroundColor: color,
                      width: `${Math.round(fillPct * 100)}%` as any,
                      opacity: fillPct > 0 ? 1 : 0,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View
          style={[
            styles.batteryTip,
            { backgroundColor: overflow ? color : trackColor },
          ]}
        />
      </View>
      <Text style={[styles.metaLabel, { color }]}>
        {currentValue != null
          ? `${Math.round(currentValue * 10) / 10} / ${targetValue}`
          : `${Math.round(p * 100)}%`}
      </Text>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// ─────────────────────────────────────────────
// 4. Gradient Bar — continuous + unit ticks for small targets
// ─────────────────────────────────────────────
export function GradientBar({
  progress,
  color,
  trackColor,
  overflow,
  targetValue,
  currentValue,
}: BaseVisProps) {
  const p = useSmoothedProgress(progress);
  const id = useId().replace(/:/g, '');
  const width = 260;
  const height = 22;
  const fill = clamp(p, 0, 1) * width;
  const showTicks = targetValue > 1 && targetValue <= 20;

  return (
    <View style={styles.centerContainer}>
      {targetValue > 0 && targetValue <= 16 && currentValue != null ? (
        <UnitBeads
          current={currentValue}
          target={targetValue}
          color={color}
          trackColor={trackColor}
          overflow={overflow}
        />
      ) : null}

      <View
        style={[
          styles.barTrack,
          {
            width,
            height,
            backgroundColor: trackColor,
            borderColor: overflow ? color : 'transparent',
            borderWidth: overflow ? 2 : 0,
          },
        ]}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={`bar-${id}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={lighten(color, 0.4)} stopOpacity="1" />
              <Stop offset="1" stopColor={color} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={Math.max(0, fill)}
            height={height}
            fill={`url(#bar-${id})`}
            rx={height / 2}
          />
          {showTicks &&
            Array.from({ length: targetValue - 1 }).map((_, i) => {
              const x = ((i + 1) / targetValue) * width;
              return (
                <Line
                  key={i}
                  x1={x}
                  y1={3}
                  x2={x}
                  y2={height - 3}
                  stroke="rgba(0,0,0,0.15)"
                  strokeWidth={1}
                />
              );
            })}
        </Svg>
        {/* Cap glow at tip */}
        {p > 0.02 && (
          <View
            style={[
              styles.barCap,
              {
                left: Math.min(width - 10, Math.max(0, fill - 8)),
                backgroundColor: lighten(color, 0.5),
              },
            ]}
          />
        )}
      </View>

      <Text style={[styles.metaLabel, { color }]}>
        {currentValue != null
          ? `${Math.round(currentValue * 10) / 10} / ${targetValue}`
          : `${Math.round(p * 100)}%`}
      </Text>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// ─────────────────────────────────────────────
// 5. Segment pie — discrete slices with partial current slice
// ─────────────────────────────────────────────
export function PizzaSlices({
  progress,
  color,
  trackColor,
  targetValue,
  overflow,
  currentValue,
}: BaseVisProps) {
  const p = useSmoothedProgress(progress);
  const size = 112;
  const radius = size / 2;
  const slices = Math.min(Math.max(Math.round(targetValue) || 4, 2), 12);
  const filledExact = clamp(p, 0, 1) * slices;
  const fullSlices = Math.floor(filledExact);
  const frac = filledExact - fullSlices;

  const polar = (angleDeg: number, r: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: radius + r * Math.cos(a),
      y: radius + r * Math.sin(a),
    };
  };

  const slicePath = (index: number, total: number, fraction = 1) => {
    const span = 360 / total;
    const start = index * span;
    const end = start + span * clamp(fraction, 0.001, 1);
    const s = polar(start, radius - 2);
    const e = polar(end, radius - 2);
    const large = end - start > 180 ? 1 : 0;
    return `M ${radius} ${radius} L ${s.x} ${s.y} A ${radius - 2} ${radius - 2} 0 ${large} 1 ${e.x} ${e.y} Z`;
  };

  return (
    <View style={styles.centerContainer}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={radius} cy={radius} r={radius - 2} fill={trackColor} opacity={0.25} />
          {Array.from({ length: slices }).map((_, i) => {
            if (i < fullSlices) {
              return (
                <Path
                  key={i}
                  d={slicePath(i, slices, 1)}
                  fill={color}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={1.5}
                />
              );
            }
            if (i === fullSlices && frac > 0.01) {
              return (
                <Path
                  key={i}
                  d={slicePath(i, slices, frac)}
                  fill={color}
                  opacity={0.85}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1}
                />
              );
            }
            // empty outline tick
            const mid = (i + 0.5) * (360 / slices);
            const outer = polar(mid, radius - 6);
            const inner = polar(mid, radius * 0.55);
            return (
              <Line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={trackColor}
                strokeWidth={2}
                opacity={0.5}
              />
            );
          })}
          <Circle cx={radius} cy={radius} r={radius * 0.28} fill="#fff" opacity={0.9} />
          {overflow && (
            <Circle
              cx={radius}
              cy={radius}
              r={radius - 3}
              stroke={color}
              strokeWidth={3}
              fill="transparent"
              strokeDasharray="5 3"
            />
          )}
        </Svg>
        <CenterLabel
          text={
            currentValue != null
              ? String(Math.round(currentValue * 10) / 10)
              : `${Math.round(p * 100)}%`
          }
          color={color}
        />
      </View>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// ─────────────────────────────────────────────
// 6. Sun Horizon — sun climbs arc; glow grows with progress
// ─────────────────────────────────────────────
export function SunHorizon({ progress, color, trackColor, overflow }: BaseVisProps) {
  const p = useSmoothedProgress(progress);
  const id = useId().replace(/:/g, '');
  const width = 180;
  const height = 100;
  const r = 68;
  const cx = width / 2;
  const cy = height - 8;
  const t = clamp(p, 0, 1);
  const angle = Math.PI - t * Math.PI;
  const sunX = cx + r * Math.cos(angle);
  const sunY = cy - r * Math.sin(angle);
  const sunR = 12 + t * 6 + (overflow ? 4 : 0);

  // Rays when high progress
  const rays =
    t > 0.2
      ? Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const inner = sunR + 2;
          const outer = sunR + 6 + t * 8;
          return {
            x1: sunX + Math.cos(a) * inner,
            y1: sunY + Math.sin(a) * inner,
            x2: sunX + Math.cos(a) * outer,
            y2: sunY + Math.sin(a) * outer,
          };
        })
      : [];

  return (
    <View style={styles.centerContainer}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={color}
              stopOpacity={0.12 + t * 0.35}
            />
            <Stop offset="1" stopColor={trackColor} stopOpacity="0.15" />
          </LinearGradient>
          <ClipPath id={`sky-clip-${id}`}>
            <Rect x={0} y={0} width={width} height={cy} />
          </ClipPath>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#sky-${id})`} rx={12} />
        {/* Arc guide */}
        <Path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke={trackColor}
          strokeWidth={2}
          strokeDasharray="4 5"
          fill="transparent"
          opacity={0.55}
        />
        {/* Progress trail on arc: west (270°) → east (90°) over the top */}
        {t > 0.01 && (
          <Path
            d={describeArc(cx, cy, r, 270, 270 + t * 180)}
            stroke={color}
            strokeWidth={3}
            fill="transparent"
            strokeLinecap="round"
            opacity={0.85}
          />
        )}
        <G clipPath={`url(#sky-clip-${id})`}>
          {rays.map((ray, i) => (
            <Line
              key={i}
              x1={ray.x1}
              y1={ray.y1}
              x2={ray.x2}
              y2={ray.y2}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.55}
            />
          ))}
          <Circle cx={sunX} cy={sunY} r={sunR + 6} fill={color} opacity={0.2} />
          <Circle cx={sunX} cy={sunY} r={sunR} fill={color} />
          <Circle
            cx={sunX - sunR * 0.25}
            cy={sunY - sunR * 0.25}
            r={sunR * 0.3}
            fill="#fff"
            opacity={0.35}
          />
        </G>
        <Line
          x1={12}
          y1={cy}
          x2={width - 12}
          y2={cy}
          stroke={trackColor}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={[styles.metaLabel, { color }]}>{Math.round(t * 100)}%</Text>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const delta = Math.abs(endAngle - startAngle);
  const large = delta > 180 ? 1 : 0;
  // SVG sweep=1 is clockwise (matches our polarToCartesian angle growth)
  const sweep = endAngle >= startAngle ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} ${sweep} ${e.x} ${e.y}`;
}

// ─────────────────────────────────────────────
// 7. Hourglass — sand drains top → bottom
// ─────────────────────────────────────────────
export function Hourglass({ progress, color, trackColor, overflow }: BaseVisProps) {
  const p = useSmoothedProgress(progress);
  const id = useId().replace(/:/g, '');
  const width = 72;
  const height = 108;
  const t = clamp(p, 0, 1);

  // Classic hourglass outline
  const glass = `M 14 8 L 58 8 L 58 14 L 42 48 L 58 82 L 58 100 L 14 100 L 14 82 L 30 48 L 14 14 Z`;
  const topY = 14;
  const neckY = 48;
  const bottomY = 100;
  const topH = (neckY - topY) * (1 - t);
  const botH = (bottomY - neckY) * t;

  return (
    <View style={styles.centerContainer}>
      <Svg width={width} height={height}>
        <Defs>
          <ClipPath id={`hg-top-${id}`}>
            <Rect x={0} y={neckY - topH} width={width} height={topH} />
          </ClipPath>
          <ClipPath id={`hg-bot-${id}`}>
            <Rect x={0} y={bottomY - botH} width={width} height={botH} />
          </ClipPath>
          <ClipPath id={`hg-glass-${id}`}>
            <Path d={glass} />
          </ClipPath>
          <LinearGradient id={`hg-sand-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lighten(color, 0.35)} />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        {/* Frame */}
        <Path
          d={glass}
          stroke={overflow ? color : trackColor}
          strokeWidth={3}
          fill="transparent"
          strokeLinejoin="round"
          opacity={0.7}
        />
        <G clipPath={`url(#hg-glass-${id})`}>
          <Path d={glass} fill={`url(#hg-sand-${id})`} clipPath={`url(#hg-top-${id})`} opacity={0.9} />
          <Path d={glass} fill={`url(#hg-sand-${id})`} clipPath={`url(#hg-bot-${id})`} />
        </G>
        {/* Falling stream */}
        {t > 0.04 && t < 0.96 && (
          <Rect
            x={width / 2 - 1.5}
            y={neckY - 2}
            width={3}
            height={18}
            fill={color}
            opacity={0.75}
            rx={1}
          />
        )}
        {/* Caps */}
        <Rect x={12} y={4} width={48} height={6} rx={2} fill={trackColor} opacity={0.6} />
        <Rect x={12} y={98} width={48} height={6} rx={2} fill={trackColor} opacity={0.6} />
      </Svg>
      <Text style={[styles.metaLabel, { color }]}>{Math.round(t * 100)}%</Text>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

// ─────────────────────────────────────────────
// 8. Radar — wedge sweep + concentric rings + blip
// ─────────────────────────────────────────────
export function RadarScope({ progress, color, trackColor, overflow, currentValue, targetValue }: BaseVisProps) {
  const p = useSmoothedProgress(progress);
  const id = useId().replace(/:/g, '');
  const size = 112;
  const radius = size / 2;
  const t = clamp(p, 0, 1);
  const sweepDeg = t * 360;
  const rings = 4;

  const wedge =
    t <= 0
      ? ''
      : t >= 0.999
        ? `M ${radius} ${radius} m ${-radius + 4},0 a ${radius - 4},${radius - 4} 0 1,1 ${
            (radius - 4) * 2
          },0 a ${radius - 4},${radius - 4} 0 1,1 ${-(radius - 4) * 2},0`
        : (() => {
            const end = polarToCartesian(radius, radius, radius - 4, sweepDeg);
            const large = sweepDeg > 180 ? 1 : 0;
            return `M ${radius} ${radius} L ${radius} ${4} A ${radius - 4} ${
              radius - 4
            } 0 ${large} 1 ${end.x} ${end.y} Z`;
          })();

  // Blip at sweep edge
  const blip = polarToCartesian(radius, radius, (radius - 4) * (0.55 + t * 0.35), sweepDeg);

  return (
    <View style={styles.centerContainer}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id={`radar-${id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.55" />
              <Stop offset="1" stopColor={color} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          <Circle cx={radius} cy={radius} r={radius - 2} fill={trackColor} opacity={0.2} />
          {Array.from({ length: rings }).map((_, i) => {
            const rr = ((i + 1) / rings) * (radius - 6);
            return (
              <Circle
                key={i}
                cx={radius}
                cy={radius}
                r={rr}
                stroke={trackColor}
                strokeWidth={1}
                fill="transparent"
                opacity={0.45}
              />
            );
          })}
          {/* Crosshairs */}
          <Line
            x1={radius}
            y1={6}
            x2={radius}
            y2={size - 6}
            stroke={trackColor}
            strokeWidth={1}
            opacity={0.35}
          />
          <Line
            x1={6}
            y1={radius}
            x2={size - 6}
            y2={radius}
            stroke={trackColor}
            strokeWidth={1}
            opacity={0.35}
          />
          {wedge ? <Path d={wedge} fill={`url(#radar-${id})`} /> : null}
          {/* Sweep edge */}
          {t > 0.01 && (
            <Line
              x1={radius}
              y1={radius}
              x2={blip.x}
              y2={blip.y}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.9}
            />
          )}
          {t > 0.05 && (
            <Circle cx={blip.x} cy={blip.y} r={4} fill={color} />
          )}
          {overflow && (
            <Circle
              cx={radius}
              cy={radius}
              r={radius - 3}
              stroke={color}
              strokeWidth={2}
              fill="transparent"
              strokeDasharray="4 3"
            />
          )}
        </Svg>
        <CenterLabel
          text={
            currentValue != null
              ? String(Math.round(currentValue * 10) / 10)
              : `${Math.round(t * 100)}%`
          }
          sub={targetValue ? `of ${targetValue}` : undefined}
          color={color}
        />
      </View>
      <OverflowBadge overflow={overflow} progress={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    gap: 6,
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerLabelSub: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.75,
    marginTop: 1,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  overflowBadge: {
    marginTop: 2,
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
    borderWidth: 3,
    padding: 5,
    borderRadius: 12,
    width: 230,
    height: 52,
  },
  batteryBlock: {
    flex: 1,
    borderRadius: 5,
    overflow: 'hidden',
  },
  batteryBlockFill: {
    height: '100%',
    borderRadius: 5,
  },
  batteryTip: {
    width: 8,
    height: 22,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    marginLeft: 2,
  },
  barTrack: {
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barCap: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 5,
    opacity: 0.9,
  },
  beadsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    maxWidth: 280,
    marginBottom: 8,
  },
  bead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  beadFill: {
    height: '100%',
  },
  beadExtra: {
    fontSize: 12,
    fontWeight: '800',
    alignSelf: 'center',
    marginLeft: 4,
  },
});
