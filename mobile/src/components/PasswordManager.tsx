import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function PasswordManager({ visible, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  function close() {
    setPassword("");
    setConfirmation("");
    onClose();
  }

  async function save() {
    if (password.length < 8) {
      Alert.alert("Senha muito curta", "Use pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      Alert.alert("Senhas diferentes", "Digite a mesma senha nos dois campos.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      Alert.alert("Não foi possível alterar", error.message);
      return;
    }

    Alert.alert("Senha alterada", "A nova senha já pode ser usada no app e no site.");
    close();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.page}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Alterar senha</Text>
            <Pressable onPress={close} hitSlop={10}>
              <Text style={styles.close}>Cancelar</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.help}>
              Esta será a nova senha do aplicativo e do painel no site.
            </Text>

            <Text style={styles.label}>Nova senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              autoFocus
            />

            <Text style={styles.label}>Confirmar nova senha</Text>
            <TextInput
              style={styles.input}
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={() => void save()}
            />

            <Pressable
              style={[styles.button, saving && styles.disabled]}
              onPress={() => void save()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Salvar nova senha</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  page: { flex: 1 },
  header: {
    height: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  close: { color: colors.coralDark, fontSize: 16, fontWeight: "900" },
  content: { padding: 22 },
  help: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 18,
  },
  button: {
    height: 58,
    marginTop: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.coral,
  },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
