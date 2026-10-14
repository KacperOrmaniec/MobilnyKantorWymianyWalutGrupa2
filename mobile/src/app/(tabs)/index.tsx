import { CustomContainer } from "@/components/custom-container";
import BaseView from "@/components/base-view";
import { ThemedText } from "@/components/themed-text";

export default function HomeScreen() {
  return (
    <BaseView>
      <CustomContainer>
        <ThemedText type="default">Stan portfela</ThemedText>
      </CustomContainer>
      <CustomContainer>
        <ThemedText type="default">Ostatnie transakcje</ThemedText>
      </CustomContainer>
    </BaseView>
  );
}
