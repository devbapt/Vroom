import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type {
  CineDrivePostType,
  AnyHUD,
  TrackHUD,
  RoadTripHUD,
  MeetHUD,
  DailyHUD,
  BuildHUD,
  SpottedHUD,
} from '../../context/AppContext';

const C = {
  accent: '#E50914',
  white: '#FFFFFF',
  whiteFaint: 'rgba(255,255,255,0.25)',
  divider: 'rgba(255,255,255,0.15)',
};

const MONO = 'Courier';

interface HUDColumn {
  label: string;
  value: string;
  isAccent?: boolean;
}

function getColumns(type: CineDrivePostType, hud: AnyHUD): [HUDColumn, HUDColumn, HUDColumn] {
  switch (type) {
    case 'track': {
      const d = hud as TrackHUD;
      return [
        { label: 'POWER',  value: d.power },
        { label: '0–100',  value: d.acceleration },
        { label: 'LAP',    value: d.lapTime, isAccent: true },
      ];
    }
    case 'road_trip': {
      const d = hud as RoadTripHUD;
      return [
        { label: 'DIST.',  value: d.distance },
        { label: 'TIME',   value: d.duration },
        { label: 'CREW',   value: d.crew, isAccent: true },
      ];
    }
    case 'meet': {
      const d = hud as MeetHUD;
      return [
        { label: 'CITY',   value: d.city },
        { label: 'PEOPLE', value: d.people },
        { label: 'CARS',   value: d.cars, isAccent: true },
      ];
    }
    case 'daily': {
      const d = hud as DailyHUD;
      return [
        { label: 'POWER',  value: d.power },
        { label: '0–100',  value: d.acceleration },
        { label: 'TRANS.', value: d.transmission, isAccent: true },
      ];
    }
    case 'build': {
      const d = hud as BuildHUD;
      return [
        { label: 'MODS',   value: d.mods },
        { label: 'BUDGET', value: d.budget },
        { label: 'PHASE',  value: d.phase, isAccent: true },
      ];
    }
    case 'spotted': {
      const d = hud as SpottedHUD;
      const stars = '★'.repeat(d.rarity) + '☆'.repeat(5 - d.rarity);
      return [
        { label: 'CITY',   value: d.city },
        { label: 'MODEL',  value: d.model },
        { label: 'RARITY', value: stars, isAccent: true },
      ];
    }
  }
}

interface Props {
  type: CineDrivePostType;
  hud: AnyHUD;
}

function HUDStrip({ type, hud }: Props) {
  const [col1, col2, col3] = getColumns(type, hud);

  return (
    <LinearGradient
      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.92)']}
      locations={[0, 0.55]}
      style={styles.container}
    >
      <View style={styles.row}>
        <HUDCol col={col1} />
        <View style={styles.divider} />
        <HUDCol col={col2} />
        <View style={styles.divider} />
        <HUDCol col={col3} />
      </View>
    </LinearGradient>
  );
}

const HUDCol = memo(function HUDCol({ col }: { col: HUDColumn }) {
  return (
    <View style={styles.col}>
      <Text style={styles.colLabel}>{col.label}</Text>
      <Text style={[styles.colValue, col.isAccent && styles.colValueAccent]} numberOfLines={1}>
        {col.value}
      </Text>
    </View>
  );
});

export default memo(HUDStrip);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 32,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  colLabel: {
    fontFamily: MONO,
    fontSize: 8,
    letterSpacing: 1.5,
    color: C.whiteFaint,
    marginBottom: 4,
  },
  colValue: {
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: '500',
    color: C.white,
  },
  colValueAccent: {
    color: C.accent,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: C.divider,
    marginHorizontal: 8,
  },
});
