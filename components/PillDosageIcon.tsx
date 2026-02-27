import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Defs, ClipPath, G } from 'react-native-svg';

interface PillDosageIconProps {
  dosage: string;
  dosageAr: string;
  size?: number;
  color?: string;
}

type DosageType = 'full' | 'half' | null;

function detectDosageType(dosage: string, dosageAr: string): DosageType {
  const combined = `${dosage} ${dosageAr}`.toLowerCase();
  if (combined.includes('نصف حبة') || combined.includes('half pill') || combined.includes('half tablet') || combined.includes('½')) {
    return 'half';
  }
  if (combined.includes('حبة واحدة') || combined.includes('one pill') || combined.includes('one tablet') || combined.includes('1 pill') || combined.includes('1 tablet')) {
    return 'full';
  }
  return null;
}

function FullPillSvg({ size }: { size: number; color: string }) {
  const w = size;
  const h = size * 0.45;
  const r = h / 2;
  const pillColor = '#FFD600';
  const pillColorDark = '#F5C400';
  const strokeColor = '#E6B800';
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect x={0} y={0} width={w} height={h} rx={r} ry={r} fill={pillColor} />
      <Rect x={0} y={0} width={w} height={h} rx={r} ry={r} fill="none" stroke={strokeColor} strokeWidth={2.5} />
      <Rect x={w / 2 - 0.75} y={2} width={1.5} height={h - 4} fill={strokeColor} opacity={0.5} />
      <Defs>
        <ClipPath id="leftHalfFull">
          <Rect x={0} y={0} width={w / 2} height={h} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#leftHalfFull)">
        <Rect x={0} y={0} width={w} height={h} rx={r} ry={r} fill={pillColorDark} />
      </G>
      <Path
        d={`M ${w * 0.15} ${h * 0.35} Q ${w * 0.25} ${h * 0.2} ${w * 0.4} ${h * 0.3}`}
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
    </Svg>
  );
}

function HalfPillSvg({ size }: { size: number; color: string }) {
  const w = size * 0.55;
  const h = size * 0.45;
  const r = h / 2;
  const pillColor = '#FFD600';
  const strokeColor = '#E6B800';
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <ClipPath id="halfClipHalf">
          <Rect x={0} y={0} width={w} height={h} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#halfClipHalf)">
        <Rect x={0} y={0} width={w * 1.8} height={h} rx={r} ry={r} fill={pillColor} />
        <Rect x={0} y={0} width={w * 1.8} height={h} rx={r} ry={r} fill="none" stroke={strokeColor} strokeWidth={2.5} />
      </G>
      <Rect x={w - 1.5} y={1} width={2.5} height={h - 2} fill={strokeColor} opacity={0.7} />
      <Path
        d={`M ${w * 0.15} ${h * 0.35} Q ${w * 0.35} ${h * 0.18} ${w * 0.65} ${h * 0.3}`}
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
    </Svg>
  );
}

export function getDosageType(dosage: string, dosageAr: string): DosageType {
  return detectDosageType(dosage, dosageAr);
}

export default function PillDosageIcon({ dosage, dosageAr, size = 80, color = '#0D9488' }: PillDosageIconProps) {
  const type = detectDosageType(dosage, dosageAr);
  if (!type) return null;

  return (
    <View style={styles.container}>
      {type === 'full' ? (
        <FullPillSvg size={size} color={color} />
      ) : (
        <HalfPillSvg size={size} color={color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
