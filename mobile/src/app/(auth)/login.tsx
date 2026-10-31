import BaseView from "@/components/base-view";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { CustomButton } from "@/components/ui/custom-button";
import { TextInput, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useStore } from "@/hooks/use-store";
import { LoginRequest, LoginResponse } from "@/lib/api-types";

export default function LoginScreen() {
  const params = useLocalSearchParams<{ login?: string }>();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);
  const setToken = useStore((state) => state.setToken);

  useEffect(() => {
    if (!params.login) return;
    setLogin(params.login);
    passwordRef.current?.focus();
  }, [params.login]);

  const loginMutation = useMutation({
    mutationFn: (dane: LoginRequest) =>
      apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(dane),
      }),
    onSuccess: (data) => setToken(data.token, data.wygasa),
  });
  const errorMessage = loginMutation.error?.message;
  return (
    <BaseView>
      {errorMessage && (
        <ThemedText type="label" style={{ padding: 5, color: "red" }}>
          {errorMessage}
        </ThemedText>
      )}
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
        style={{ margin: 18 }}
        onPress={() => loginMutation.mutate({ login, haslo: password })}
        label="Zaloguj się"
      />
      <CustomButton
        onPress={() => router.navigate("/register")}
        style={{ backgroundColor: "transparent" }}
        label="Stwórz konto"
      />
    </BaseView>
  );
}
