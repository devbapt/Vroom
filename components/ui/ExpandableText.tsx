import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, TextStyle, StyleProp, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

interface Props {
  text: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  toggleStyle?: StyleProp<TextStyle>;
  expandLabel?: string;
  collapseLabel?: string;
}

export default function ExpandableText({
  text,
  numberOfLines = 2,
  style,
  toggleStyle,
  expandLabel = 'Voir plus',
  collapseLabel = 'Voir moins',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const onTextLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (!expanded && e.nativeEvent.lines.length > numberOfLines) {
      setTruncated(true);
    }
  }, [expanded, numberOfLines]);

  if (!text) return null;

  return (
    <>
      <Text
        style={style}
        numberOfLines={expanded ? undefined : numberOfLines}
        onTextLayout={onTextLayout}
      >
        {text}
      </Text>
      {truncated && (
        <Text
          style={[styles.toggle, toggleStyle]}
          onPress={() => setExpanded(e => !e)}
          suppressHighlighting
        >
          {expanded ? collapseLabel : expandLabel}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
