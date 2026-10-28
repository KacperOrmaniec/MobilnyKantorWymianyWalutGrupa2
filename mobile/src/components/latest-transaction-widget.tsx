import { View } from "react-native";
import { CustomContainer } from "@/components/ui/custom-container";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomButton } from "@/components/ui/custom-button";

export function LatestTransactionWidget() {
  return (
    <View style={{ flex: 1 }}>
      <CustomContainer
        style={{
          flex: 2,
          justifyContent: "space-between",
          borderBottomWidth: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <View
          style={{
            padding: 2,
          }}
        >
          <ThemedText type="default">Ostatnie transakcje</ThemedText>
        </View>
      </CustomContainer>
      <CustomButton
        label="Zobacz więcej"
        style={{
          borderTopRightRadius: 0,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 25,
          borderBottomRightRadius: 25,
          width: "100%",
        }}
      />
    </View>
  );
}
