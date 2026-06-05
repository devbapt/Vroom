import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type BadgeVariant = 'certified' | 'pending';

interface Props {
  variant: BadgeVariant;
  size?: 'sm' | 'md';
}

function VerifiedBadge({ variant, size = 'sm' }: Props) {
  const isSm = size === 'sm';

  if (variant === 'certified') {
    return (
      <View style={[styles.badge, styles.certifiedBadge, isSm && styles.badgeSm]}>
        <Ionicons name="shield-checkmark" size={isSm ? 10 : 13} color="#FFFFFF" />
        {!isSm && <Text style={styles.certifiedText}>Certifié</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.pendingBadge, isSm && styles.badgeSm]}>
      <Ionicons name="time-outline" size={isSm ? 10 : 13} color="#FF9F0A" />
      {!isSm && <Text style={styles.pendingText}>En attente</Text>}
    </View>
  );
}

export default memo(VerifiedBadge);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeSm: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
  },
  certifiedBadge: {
    backgroundColor: '#34C759',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255,159,10,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.4)',
  },
  certifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9F0A',
  },
});
