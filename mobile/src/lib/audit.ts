import { Alert } from "react-native";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase";

const INSTALLATION_KEY = "dedeia.installation-id";
const LOCATION_KEY = "dedeia.location-choice";
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || "https://loja-da-dedeia.vercel.app";

async function installationId() {
  let id = await SecureStore.getItemAsync(INSTALLATION_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(INSTALLATION_KEY, id);
  }
  return id;
}

async function devicePayload() {
  return {
    installation_id: await installationId(),
    platform: Device.osName || "Android",
    device_name: Device.deviceName,
    brand: Device.brand,
    model: Device.modelName,
    os_version: Device.osVersion,
    app_version: Application.nativeApplicationVersion,
  };
}

export async function writeAudit(
  action: string,
  details: Record<string, unknown> = {},
  location?: { latitude: number; longitude: number; accuracy: number | null },
) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch(`${siteUrl}/api/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...(await devicePayload()), action, details, location }),
  }).catch(() => undefined);
}

async function registerWithLocation() {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      await SecureStore.setItemAsync(LOCATION_KEY, "denied");
      await writeAudit("app_opened", { location_permission: "denied" });
      return;
    }
    await SecureStore.setItemAsync(LOCATION_KEY, "allowed");
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await writeAudit("app_opened", { location_permission: "allowed" }, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });
  } catch {
    await writeAudit("app_opened", { location_permission: "unavailable" });
  }
}

export async function registerAdminDevice() {
  const choice = await SecureStore.getItemAsync(LOCATION_KEY);
  if (choice === "allowed") return registerWithLocation();
  if (choice === "denied") return writeAudit("app_opened", { location_permission: "denied" });

  Alert.alert(
    "Registrar este aparelho?",
    "O app pode guardar a localização aproximada somente quando for aberto. Isso ajuda a identificar os acessos administrativos. Não há rastreamento em segundo plano.",
    [
      {
        text: "Agora não",
        style: "cancel",
        onPress: async () => {
          await SecureStore.setItemAsync(LOCATION_KEY, "denied");
          await writeAudit("app_opened", { location_permission: "denied" });
        },
      },
      { text: "Permitir", onPress: () => void registerWithLocation() },
    ],
  );
}
