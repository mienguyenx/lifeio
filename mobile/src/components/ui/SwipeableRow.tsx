import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';

interface SwipeAction {
  label: string;
  color: string;
  icon?: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeableOpen?: (direction: 'left' | 'right') => void;
}

export function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeableOpen,
}: SwipeableRowProps) {
  const swipeableRef = React.useRef<Swipeable>(null);

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (leftActions.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {leftActions.map((action, index) => {
          const scale = dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [0.5, 1],
            extrapolate: 'clamp',
          });

          return (
            <RectButton
              key={index}
              style={[styles.actionBtn, { backgroundColor: action.color }]}
              onPress={() => {
                action.onPress();
                swipeableRef.current?.close();
              }}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                {action.icon && <Text style={styles.actionIcon}>{action.icon}</Text>}
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Animated.View>
            </RectButton>
          );
        })}
      </View>
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (rightActions.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {rightActions.map((action, index) => {
          const scale = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [1, 0.5],
            extrapolate: 'clamp',
          });

          return (
            <RectButton
              key={index}
              style={[styles.actionBtn, { backgroundColor: action.color }]}
              onPress={() => {
                action.onPress();
                swipeableRef.current?.close();
              }}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                {action.icon && <Text style={styles.actionIcon}>{action.icon}</Text>}
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Animated.View>
            </RectButton>
          );
        })}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={leftActions.length > 0 ? renderLeftActions : undefined}
      renderRightActions={rightActions.length > 0 ? renderRightActions : undefined}
      onSwipeableOpen={(direction) => onSwipeableOpen?.(direction)}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: { flexDirection: 'row' },
  actionBtn: {
    justifyContent: 'center', alignItems: 'center',
    width: 72, paddingHorizontal: 8,
  },
  actionIcon: { fontSize: 20, marginBottom: 2 },
  actionLabel: { color: 'white', fontSize: 11, fontWeight: '600' },
});
