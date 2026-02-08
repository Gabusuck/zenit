
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// Create the Material Top Tab Navigator
const { Navigator } = createMaterialTopTabNavigator();

// Wrap it with expo-router context
export const MaterialTopTabs = withLayoutContext(Navigator);

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: 0 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const primaryColor = Colors[colorScheme ?? 'light'].primary;

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 50,
          right: 50,
          elevation: 5,
          backgroundColor: primaryColor,
          borderRadius: 30,
          height: 60,
          // Remove default padding/border of top tabs if any
          paddingBottom: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          // Ensure content is centered
          justifyContent: 'center',
        },
        tabBarIndicatorStyle: {
          // Hide the indicator line since we want icon buttons
          height: 0,
          backgroundColor: 'transparent',
        },
        tabBarShowLabel: false,
        tabBarIconStyle: {
          height: 30,
          width: 30,
          alignItems: 'center',
          justifyContent: 'center',
        },
        // Ensure the content container fills the bar nicely
        tabBarContentContainerStyle: {
          alignItems: 'center',
        },
        swipeEnabled: true,
        animationEnabled: true,
      }}
    >
      <MaterialTopTabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? "chatbox" : "chatbox-outline"} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? "home" : "home-outline"} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? "person" : "person-outline"} color={color} />,
        }}
      />
    </MaterialTopTabs>
  );
}
