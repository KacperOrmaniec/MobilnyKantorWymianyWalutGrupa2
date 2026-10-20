import { StyleSheet, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ui/themed-view";

import { BottomTabInset } from "@/constants/theme";

export default function BaseView({ children, style, ...rest }: ViewProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} {...rest}>
        {children}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 17,
    gap: 18,
    paddingBottom: BottomTabInset,
  },
});
