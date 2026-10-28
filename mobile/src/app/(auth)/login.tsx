import BaseView from "@/components/base-view";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { CustomButton } from "@/components/ui/custom-button";
import { TextInput, View } from "react-native";
import { useRef, useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useStore } from "@/hooks/use-store";
import { LoginRequest, LoginResponse } from "@/lib/api-types";

export default function LoginScreen() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);
  const setToken = useStore((state) => state.setToken);

  const loginMutation = useMutation({
    mutationFn: (dane: LoginRequest) =>
      apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(dane),
      }),
    onSuccess: (data) => setToken(data.token, data.wygasa),
  });

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

      <CustomButton
        onPress={() => loginMutation.mutate({ login, haslo: password })}
        label="Zaloguj się"
      />
      <CustomButton
        onPress={() => router.push("/register")}
        style={{ backgroundColor: "transparent" }}
        label="Stwórz konto"
      />
    </BaseView>
  );
}
