import { CustomContainer } from "@/components/ui/custom-container";
import BaseView from "@/components/base-view";
import { ThemedText } from "@/components/ui/themed-text";
import { View } from "react-native";
import { CustomButton } from "@/components/ui/custom-button";
import { WalletCurrencyRow } from "@/components/ui/wallet-currency-row";
import { CustomInputField } from "@/components/ui/custom-input-field";

export default function HomeScreen() {
  return (
    <BaseView>
      <View style={{ flex: 2 }}>
        <CustomContainer
          style={{
            flex: 2,
            borderBottomWidth: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <View
            style={{
              padding: 8,
            }}
          >
            <ThemedText type="default">Stan portfela</ThemedText>
            <ThemedText type="title">1 234,56 PLN</ThemedText>
          </View>
          <WalletCurrencyRow
            currency="USD"
            amount={100.0}
            amountInMainCurrency={400.0}
          ></WalletCurrencyRow>
        </CustomContainer>
        <View style={{ flexDirection: "row" }}>
          <CustomButton
            label="Wpłata"
            style={{
              borderBottomLeftRadius: 25,
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
              borderBottomRightRadius: 25,
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
    </BaseView>
  );
}
