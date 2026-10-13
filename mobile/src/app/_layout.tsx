import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { PlatformPressable } from "expo-router/build/react-navigation/elements/PlatformPressable";

// Used javascript tabs because of custom styling

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "unspecified" ? "light" : colorScheme];
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveBackgroundColor: colors.background,
          tabBarActiveTintColor: colors.text,
          tabBarStyle: {
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            bottom: 64,
            marginHorizontal: 60,
            height: 60,
            borderRadius: 24,
            borderColor: colors.backgroundSelected,
            backgroundColor: colors.backgroundElement,
            borderTopWidth: 2,
            borderWidth: 2,
            paddingBottom: 0,
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
              <Ionicons
                name="swap-horizontal-sharp"
                color={color}
                size={size}
              />
            ),
          }}
        ></Tabs.Screen>
      </Tabs>
    </ThemeProvider>
  );
}
