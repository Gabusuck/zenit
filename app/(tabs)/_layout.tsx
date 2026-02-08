
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { BlurView } from 'expo-blur';
import { withLayoutContext } from 'expo-router';
import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';

// Create the Material Top Tab Navigator
const { Navigator } = createMaterialTopTabNavigator();

// Wrap it with expo-router context
export const MaterialTopTabs = withLayoutContext(Navigator);

// Create animated component outside to avoid recreation
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

function CustomTabBar({ state, descriptors, navigation, position }: any) {
  return (
    <View style={styles.floatingTabBarContainer}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />

      <View style={styles.tabContentContainer}>
        {state.routes.map((route: any, index: number) => {
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

          // Animations
          const inputRange = state.routes.map((_: any, i: number) => i);

          // Active State Opacity (0 -> 1 -> 0)
          const activeOpacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map((i: number) => (i === index ? 1 : 0)),
          });

          // Inactive State Opacity (1 -> 0 -> 1)
          const inactiveOpacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map((i: number) => (i === index ? 0 : 1)),
          });

          // Define Icon Names for Animation Layers
          let outlineIcon: React.ComponentProps<typeof Ionicons>['name'] = 'help-outline';
          let filledIcon: React.ComponentProps<typeof Ionicons>['name'] = 'help-circle';

          if (route.name === 'chat') {
            outlineIcon = 'chatbox-outline';
            filledIcon = 'chatbox';
          } else if (route.name === 'home') {
            outlineIcon = 'home-outline';
            filledIcon = 'home';
          } else if (route.name === 'profile') {
            outlineIcon = 'person-outline';
            filledIcon = 'person';
          }

          return (
            <Pressable
              key={index}
              onPress={onPress}
              style={styles.tabItem}
            >
              {/* Animated Bubble Background */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 25,
                    opacity: activeOpacity, // Smooth fade in/out
                  },
                ]}
              />

              {/* Icon Container for Cross-Fade */}
              <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                {/* Grey Outline Icon (Fades Out) */}
                <Animated.View style={{ position: 'absolute', opacity: inactiveOpacity }}>
                  <Ionicons name={outlineIcon} size={26} color="#8E8E93" />
                </Animated.View>

                {/* Green Filled Icon (Fades In) */}
                <Animated.View style={{ position: 'absolute', opacity: activeOpacity }}>
                  <Ionicons name={filledIcon} size={26} color="#4CAF50" />
                </Animated.View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      initialRouteName="home"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarScrollEnabled: false,
        swipeEnabled: true,
        animationEnabled: true,
      }}
    >
      <MaterialTopTabs.Screen name="chat" options={{ tabBarLabel: 'Chat' }} />
      <MaterialTopTabs.Screen name="home" options={{ tabBarLabel: 'Início' }} />
      <MaterialTopTabs.Screen name="profile" options={{ tabBarLabel: 'Perfil' }} />
    </MaterialTopTabs >
  );
}

const styles = StyleSheet.create({
  floatingTabBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    // High Transparency
    backgroundColor: 'transparent', // Let BlurView handle the background
    borderWidth: 1.5, // Slightly thicker
    borderColor: 'rgba(255, 255, 255, 0.9)', // Very Bright White Glow
    // Deep Shadow for "Pop"
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  tabContentContainer: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    height: 50,
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light Grey Bubble as requested
  },
});
