import BaseView from "@/components/base-view";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { CustomButton } from "@/components/ui/custom-button";
import { TextInput, View } from "react-native";
import { useRef, useState } from "react";
import { router } from "expo-router";
export default function LoginScreen() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);

  return (
    <BaseView>
      <View>
        <ThemedText type="default" style={{ padding: 5 }}>
          Login
        </ThemedText>
        <CustomInputField
          value={login}
          onChangeText={setLogin}
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        ></CustomInputField>
      </View>
      <View style={{ marginBottom: 20 }}>
        <ThemedText type="default" style={{ padding: 5 }}>
          Hasło
        </ThemedText>
        <CustomInputField
          ref={passwordRef}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        ></CustomInputField>
      </View>

      <CustomButton label="Zaloguj się" />
      <CustomButton
        onPress={() => router.push("/register")}
        style={{ backgroundColor: "transparent" }}
        label="Stwórz konto"
      />
    </BaseView>
  );
}
