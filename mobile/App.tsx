import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerAdminDevice } from "./src/lib/audit";
import { supabase } from "./src/lib/supabase";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { colors } from "./src/theme";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user.id) { setAdmin(false); return; }
    setAdmin(null);
    supabase.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle().then(({ data }) => {
      setAdmin(!!data);
      if (data) void registerAdminDevice();
    });
  }, [session?.user.id]);

  return <SafeAreaProvider>
    <StatusBar style="dark" />
    {admin === null ? <View style={styles.center}><ActivityIndicator size="large" color={colors.coral} /></View>
      : !session ? <LoginScreen />
      : !admin ? <View style={styles.center}><Text style={styles.title}>Acesso não autorizado</Text><Text style={styles.text}>Esta conta ainda não foi adicionada como administradora.</Text><Text style={styles.exit} onPress={() => void supabase.auth.signOut()}>Sair e tentar outra conta</Text></View>
      : <DashboardScreen />}
  </SafeAreaProvider>;
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: 28, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  title: { color: colors.ink, fontSize: 22, fontWeight: "900", textAlign: "center" },
  text: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 8, textAlign: "center" },
  exit: { color: colors.coralDark, fontSize: 15, fontWeight: "900", marginTop: 22 },
});
