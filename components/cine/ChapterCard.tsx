import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CineDrivePostType } from '../../context/AppContext';

const C = {
  accent: '#E50914',
  white: '#FFFFFF',
  whiteFaint: 'rgba(255,255,255,0.25)',
};

const MONO = 'Courier';

function getSessionLabel(type: CineDrivePostType, buildPhase?: string): string {
  switch (type) {
    case 'track':     return 'TRACK DAY';
    case 'road_trip': return 'ROAD TRIP';
    case 'meet':      return 'MEET';
    case 'daily':     return 'DAILY';
    case 'build':     return buildPhase ? `BUILD · PHASE ${buildPhase}` : 'BUILD';
    case 'spotted':   return 'SPOTTED';
  }
}

interface Props {
  type: CineDrivePostType;
  index: number;
  location?: string;
  buildPhase?: string;
  topOffset?: number;
}

function ChapterCard({ type, index, location, buildPhase, topOffset }: Props) {
  const chNum = String(index + 1).padStart(2, '0');
  const sessionLabel = getSessionLabel(type, buildPhase);
  const subtitle = location ? `${sessionLabel} · ${location.toUpperCase()}` : sessionLabel;

  return (
    <View style={[styles.container, topOffset !== undefined && { top: topOffset }]}>
      <View style={styles.bar} />
      <View style={styles.textBadge}>
        <Text style={styles.sessionLine} numberOfLines={1}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default memo(ChapterCard);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    width: 3,
    height: 28,
    borderRadius: 1.5,
    backgroundColor: C.accent,
    marginRight: 8,
  },
  textBadge: {
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chLine: {
    fontFamily: MONO,
    fontSize: 5,
    letterSpacing: 1.5,
    color: C.whiteFaint,
  },
  sessionLine: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.white,
    fontWeight: '500',
    maxWidth: 200,
  },
});
