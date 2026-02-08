
import { Ionicons } from '@expo/vector-icons';
import { MaterialTopTabBar, createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { BlurView } from 'expo-blur';
import { withLayoutContext } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// Create the Material Top Tab Navigator
const { Navigator } = createMaterialTopTabNavigator();

// Wrap it with expo-router context
export const MaterialTopTabs = withLayoutContext(Navigator);

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  style?: any;
}) {
  return <Ionicons size={24} style={[{ marginBottom: 0 }, props.style]} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const primaryColor = Colors[colorScheme ?? 'light'].primary;

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      initialRouteName="home"
      tabBar={(props) => (
        <View style={styles.floatingTabBarContainer}>
          <BlurView intensity={Platform.OS === 'ios' ? 100 : 50} tint="light" style={StyleSheet.absoluteFill} />
          {/* Liquid Glass Layer - More Transparent */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
          <MaterialTopTabBar
            {...props}
          />
        </View>
      )}
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50', // Zenit Green
        tabBarInactiveTintColor: '#666', // Softer Grey for Glass
        tabBarShowLabel: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'capitalize',
          marginTop: -5,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1, // Ensure each tab takes equal space
          // Removed paddingBottom here as it was causing issues
        },
        tabBarContentContainerStyle: {
          flex: 1, // Ensure container fills the width
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center', // Center content nicely
          height: 70,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          width: '100%', // Ensure bar takes full width of container
        },
        tabBarIndicatorStyle: {
          height: 0, // Remove the underline indicator
          backgroundColor: 'transparent',
        },
        swipeEnabled: false, // Disable swipe to ensure static centered tabs
        animationEnabled: true,
      }}
    >
      <MaterialTopTabs.Screen
        name="chat"
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabBarIcon name={focused ? "chatbox" : "chatbox-outline"} color={color} style={{ top: -15 }} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabBarIcon name={focused ? "home" : "home-outline"} color={color} style={{ top: -15 }} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabBarIcon name={focused ? "person" : "person-outline"} color={color} style={{ top: -15 }} />,
        }}
      />
    </MaterialTopTabs >
  );
}

const styles = StyleSheet.create({
  floatingTabBarContainer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderRadius: 40,
    overflow: 'hidden',
    height: 70,
    // Glass Border
    borderWidth: 2, // Thicker border for more definition
    borderColor: 'rgba(255,255,255,0.9)', // Almost white border
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12, // Deeper shadow
    },
    shadowOpacity: 0.4, // Much darker shadow for max pop
    shadowRadius: 20, // Wider spread
    elevation: 12,
  },
});
