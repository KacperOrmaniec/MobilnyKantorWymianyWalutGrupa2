import { Tabs } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { PlatformPressable } from "expo-router/build/react-navigation/elements/PlatformPressable";
import { useTheme } from "@/hooks/use-theme";

// Used javascript tabs because of custom styling

export default function TabLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveBackgroundColor: theme.background,
        tabBarActiveTintColor: theme.text,
        tabBarStyle: {
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          bottom: 64,
          marginHorizontal: 60,
          height: 60,
          borderRadius: 24,
          borderColor: theme.stroke,
          backgroundColor: theme.elementDefault,
          borderTopWidth: 2,
          borderWidth: 2,
          paddingBottom: 0,
          elevation: 0,
        },

        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            style={[
              props.style,
              { justifyContent: "center", borderRadius: 24 },
            ]}
            android_ripple={{ ...props.android_ripple, color: "transparent" }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-sharp" color={color} size={size} />
          ),
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="exchange"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal-sharp" color={color} size={size} />
          ),
        }}
      ></Tabs.Screen>
    </Tabs>
  );
}
