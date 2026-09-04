import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setLoading(true);
    setError("");
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (result.error) setError("E-mail ou senha incorretos.");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.card}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <View style={styles.lock}><Text style={styles.lockText}>◆</Text></View>
          <Text style={styles.title}>Área da administradora</Text>
          <Text style={styles.subtitle}>Entre uma vez para gerenciar a loja neste aparelho.</Text>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="seu@email.com"
          />
          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              placeholder="Sua senha"
            />
            <Pressable style={styles.show} onPress={() => setShowPassword((current) => !current)}>
              <Text style={styles.showText}>{showPassword ? "Ocultar" : "Ver"}</Text>
            </Pressable>
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={[styles.button, loading && styles.disabled]} onPress={signIn} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
          </Pressable>
          <Text style={styles.help}>A sessão continuará conectada até você tocar em “Sair”.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  page: { flex: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: colors.line },
  logo: { width: "100%", height: 104, marginBottom: 4 },
  lock: { alignSelf: "center", width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.coralSoft },
  lockText: { color: colors.coralDark, fontSize: 20 },
  title: { marginTop: 14, color: colors.ink, fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { marginTop: 7, marginBottom: 20, color: colors.muted, fontSize: 15, lineHeight: 21, textAlign: "center" },
  label: { color: colors.ink, fontSize: 15, fontWeight: "700", marginBottom: 7 },
  input: { height: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, fontSize: 17, marginBottom: 15, backgroundColor: colors.white },
  passwordRow: { flexDirection: "row", height: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 14, marginBottom: 15, overflow: "hidden" },
  passwordInput: { flex: 1, paddingHorizontal: 14, fontSize: 17 },
  show: { paddingHorizontal: 15, alignItems: "center", justifyContent: "center" },
  showText: { color: colors.coralDark, fontWeight: "800" },
  error: { color: colors.danger, backgroundColor: "#fff0f0", padding: 11, borderRadius: 12, marginBottom: 12 },
  button: { height: 54, borderRadius: 15, backgroundColor: colors.coral, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: "900" },
  disabled: { opacity: 0.65 },
  help: { marginTop: 14, color: colors.muted, fontSize: 12, textAlign: "center" },
});
