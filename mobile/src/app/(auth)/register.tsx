import BaseView from "@/components/base-view";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { CustomButton } from "@/components/ui/custom-button";
import { TextInput, View } from "react-native";
import { useRef, useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { RegisterRequest, RegisterResponse } from "@/lib/api-types";

export default function RegisterScreen() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");

  const surnameRef = useRef<TextInput>(null);
  const loginRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const registerMutation = useMutation({
    mutationFn: (dane: RegisterRequest) =>
      apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(dane),
      }),
    onSuccess: () => router.navigate({ pathname: "/login", params: { login } }),
  });
  const errorMessage = registerMutation.error?.message;

  return (
    <BaseView>
      {errorMessage && (
        <ThemedText type="label" style={{ paddingLeft: 5, color: "red" }}>
          {errorMessage}
        </ThemedText>
      )}
      <View>
        <ThemedText type="default" style={{ padding: 5 }}>
          Imię
        </ThemedText>
        <CustomInputField
          value={name}
          onChangeText={setName}
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => surnameRef.current?.focus()}
        ></CustomInputField>
      </View>
      <View>
        <ThemedText type="default" style={{ padding: 5 }}>
          Nazwisko
        </ThemedText>
        <CustomInputField
          ref={surnameRef}
          value={surname}
          onChangeText={setSurname}
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => loginRef.current?.focus()}
        ></CustomInputField>
      </View>
      <View>
        <ThemedText type="default" style={{ padding: 5 }}>
          Login
        </ThemedText>
        <CustomInputField
          ref={loginRef}
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
        onPress={() =>
          registerMutation.mutate({
            login,
            haslo: password,
            imie: name,
            nazwisko: surname,
          })
        }
        label="Stwórz konto"
      />
      <CustomButton
        onPress={() => router.navigate("/login")}
        style={{ backgroundColor: "transparent" }}
        label="Mam już konto"
      />
    </BaseView>
  );
}
