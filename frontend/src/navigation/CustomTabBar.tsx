import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TabBarButton = ({ options, route, isFocused, onPress, onLongPress }: any) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, {
      damping: 22,
      stiffness: 90,
    });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -25 * progress.value }],
    };
  });

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: 40 * (1 - progress.value) },
        { scale: progress.value }
      ],
      opacity: progress.value,
    };
  });

  const IconComponent = options.tabBarIcon
    ? options.tabBarIcon({ focused: isFocused, color: isFocused ? '#fff' : '#a0a0a0', size: 28 })
    : null;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      activeOpacity={1}
    >
      <Animated.View style={[styles.slidingContainer, { width: '100%' }, animatedIndicatorStyle]}>
        <View style={styles.cutoutHole} />
        <View style={styles.floatingButton} />
      </Animated.View>
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        {IconComponent}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;

  return (
    <View style={[styles.container, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.key}
            options={options}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  slidingContainer: {
    position: 'absolute',
    top: -35,
    height: 105,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 0,
  },
  cutoutHole: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 5,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#042d1f',
    position: 'absolute',
    top: 15,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
  },
});
