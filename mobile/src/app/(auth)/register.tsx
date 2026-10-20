import BaseView from "@/components/base-view";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { CustomButton } from "@/components/ui/custom-button";
import { TextInput, View } from "react-native";
import { useRef, useState } from "react";
import { router } from "expo-router";

export default function RegisterScreen() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");

  const surnameRef = useRef<TextInput>(null);
  const loginRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  return (
    <BaseView>
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

      <CustomButton label="Stwórz konto" />
      <CustomButton
        onPress={() => router.push("/login")}
        style={{ backgroundColor: "transparent" }}
        label="Mam już konto"
      />
    </BaseView>
  );
}
