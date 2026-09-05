import { AppState, Platform } from "react-native";
import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://rryuiyxlfzanfauuwapf.supabase.co";
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_srr3QzSgPWq2xNUp1Inyjw_Mos-BSUk";

export const supabase = createClient(url, key, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
