import { useState } from "react";
import { View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/hooks/use-theme";

export function ExchangeRateChart({ data }: { data: { value: number; label: string }[] }) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  if (data.length === 0) {
    return (
      <ThemedText type="label" themeColor="textSecondary">
        Brak danych historycznych
      </ThemedText>
    );
  }

  const min = Math.min(...data.map((point) => point.value));
  const max = Math.max(...data.map((point) => point.value));
  const pad = (max - min) / 10 || min / 100;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ width: "100%" }}
    >
      <LineChart
        data={data}
        xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
        yAxisTextStyle={{ color: theme.text }}
        showFractionalValues
        color={theme.text}
        yAxisColor={theme.text}
        xAxisThickness={0}
        thickness={3}
        hideDataPoints
        xAxisColor="white"
        yAxisOffset={min - pad}
        yAxisLabelWidth={60}
        roundToDigits={4}
        noOfSections={7}
        adjustToWidth={true}
        parentWidth={Math.max(width - 16, 0)}
        initialSpacing={0}
        height={160}
      />
    </View>
  );
}
