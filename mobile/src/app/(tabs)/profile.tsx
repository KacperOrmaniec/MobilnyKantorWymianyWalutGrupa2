import { ThemedText } from "@/components/ui/themed-text";

import BaseView from "@/components/base-view";
import { CustomContainer } from "@/components/ui/custom-container";
import { CustomButton } from "@/components/ui/custom-button";
import { useStore } from "@/hooks/use-store";

export default function ProfileScreen() {
  const logout = useStore((state) => state.logout);
  return (
    <BaseView>
      <CustomContainer>
        <ThemedText type="title">Profile/Settings screen</ThemedText>
        <CustomButton
          label="Wyloguj"
          onPress={() => {
            logout();
          }}
        />
      </CustomContainer>
    </BaseView>
  );
}
