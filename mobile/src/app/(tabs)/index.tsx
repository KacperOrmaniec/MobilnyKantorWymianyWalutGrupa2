import { CustomContainer } from "@/components/custom-container";
import BaseView from "@/components/base-view";
import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";
import { CustomButton } from "@/components/custom-button";

export default function HomeScreen() {
  return (
    <BaseView>
      <View style={{ flex: 2 }}>
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
              flexDirection: "column",
              alignItems: "flex-start",
              padding: 16,
            }}
          >
            <ThemedText type="default">Stan portfela</ThemedText>
            <ThemedText type="title">1 234,56 PLN</ThemedText>
          </View>
        </CustomContainer>
        <View style={{ flexDirection: "row" }}>
          <CustomButton
            label="Wpłata"
            style={{
              borderTopRightRadius: 0,
              borderTopLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderRightWidth: 1,
              width: "50%",
            }}
          />
          <CustomButton
            label="Wypłata"
            style={{
              borderTopRightRadius: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeftWidth: 1,
              width: "50%",
            }}
          />
        </View>
      </View>

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
          <ThemedText type="default">Ostatnie transakcje</ThemedText>
        </CustomContainer>
        <CustomButton
          label="Zobacz więcej"
          style={{
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,

            width: "100%",
          }}
        />
      </View>
    </BaseView>
  );
}
