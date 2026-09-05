import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { Category, ProductDraft, ProductDraftImage } from "../types";
import { colors } from "../theme";

type Props = {
  value: ProductDraft;
  categories: Category[];
  saving: boolean;
  onChange: (draft: ProductDraft) => void;
  onClose: () => void;
  onSave: () => void;
};

const money = (value: string) => Number(value.replace(",", ".") || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ProductEditor({ value, categories, saving, onChange, onClose, onSave }: Props) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const image = value.images[0]?.uri;
  const previewName = value.name.trim() || "Nome do produto";
  const hasValidForm = useMemo(
    () => value.name.trim().length >= 2 && !!value.category && value.price.trim() !== "" && Number.isFinite(Number(value.price.replace(",", "."))) && Number(value.price.replace(",", ".")) >= 0 && value.images.length > 0,
    [value],
  );

  async function pickImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const remaining = 8 - value.images.length;
    if (remaining <= 0) {
      Alert.alert("Limite de fotos", "Cada produto pode ter até 8 fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (!result.canceled) {
      const selected: ProductDraftImage[] = result.assets.slice(0, remaining).map((asset) => ({
        uri: asset.uri,
        local: true,
        mime_type: asset.mimeType || "image/jpeg",
      }));
      onChange({ ...value, images: [...value.images, ...selected] });
    }
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const images = [...value.images];
    const [selected] = images.splice(index, 1);
    images.unshift(selected);
    onChange({ ...value, images });
  }

  function removeImage(index: number) {
    onChange({ ...value, images: value.images.filter((_, imageIndex) => imageIndex !== index) });
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}><Text style={styles.cancel}>Cancelar</Text></Pressable>
          <Text style={styles.headerTitle}>{value.id ? "Editar produto" : "Novo produto"}</Text>
          <Pressable onPress={onSave} disabled={saving || !hasValidForm} hitSlop={10}>
            <Text style={[styles.save, (saving || !hasValidForm) && styles.saveDisabled]}>{saving ? "..." : "Salvar"}</Text>
          </Pressable>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
          <Text style={styles.sectionTitle}>Prévia ao vivo</Text>
          <View style={styles.preview}>
            <Pressable style={styles.previewImage} onPress={pickImages}>
              {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" /> : <Text style={styles.bigPlus}>＋</Text>}
              <View style={styles.photoBadge}><Text style={styles.photoBadgeText}>{image ? "Adicionar fotos" : "Escolher fotos"}</Text></View>
            </Pressable>
            <View style={styles.previewBody}>
              <Text style={styles.previewCategory}>{value.category || "Categoria"}</Text>
              <Text style={styles.previewName} numberOfLines={2}>{previewName}</Text>
              <Text style={styles.previewPrice}>{money(value.price)}</Text>
              <Text style={[styles.stock, Number(value.stock_quantity || 0) <= 0 && styles.out]}>
                {Number(value.stock_quantity || 0) > 0 ? "Disponível" : "Fora de estoque • Sob encomenda"}
              </Text>
            </View>
          </View>

          <View style={styles.galleryHeader}>
            <View><Text style={styles.label}>Fotos do produto</Text><Text style={styles.galleryHelp}>Toque numa foto para torná-la capa.</Text></View>
            <Text style={styles.galleryCount}>{value.images.length}/8</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {value.images.map((item, index) => (
              <View key={`${item.uri}-${index}`} style={[styles.thumbnailWrap, index === 0 && styles.coverWrap]}>
                <Pressable onPress={() => makeCover(index)}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} resizeMode="cover" />
                  {index === 0 && <Text style={styles.coverBadge}>CAPA</Text>}
                </Pressable>
                <Pressable style={styles.removePhoto} onPress={() => removeImage(index)} hitSlop={8}><Text style={styles.removePhotoText}>×</Text></Pressable>
              </View>
            ))}
            {value.images.length < 8 && <Pressable style={styles.addPhoto} onPress={pickImages}><Text style={styles.addPhotoPlus}>＋</Text><Text style={styles.addPhotoText}>Fotos</Text></Pressable>}
          </ScrollView>

          <Text style={styles.label}>Nome do produto</Text>
          <TextInput style={styles.input} value={value.name} onChangeText={(name) => onChange({ ...value, name })} placeholder="Ex.: Perfume feminino" />
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.description]}
            value={value.description}
            onChangeText={(description) => onChange({ ...value, description })}
            placeholder="Conte os detalhes do produto"
            multiline
            textAlignVertical="top"
            maxLength={600}
          />
          <Text style={styles.label}>Categoria</Text>
          <Pressable style={styles.select} onPress={() => setCategoryOpen((current) => !current)}>
            <Text style={styles.selectText}>{value.category || "Escolher categoria"}</Text><Text>⌄</Text>
          </Pressable>
          {categoryOpen && <View style={styles.categoryList}>{categories.map((item) => (
            <Pressable key={item.id} style={styles.categoryOption} onPress={() => { onChange({ ...value, category: item.name }); setCategoryOpen(false); }}>
              <Text style={item.name === value.category ? styles.categorySelected : undefined}>{item.name}</Text>
            </Pressable>
          ))}</View>}
          <View style={styles.row}>
            <View style={styles.half}><Text style={styles.label}>Preço (R$)</Text><TextInput style={styles.input} value={value.price} onChangeText={(price) => onChange({ ...value, price })} keyboardType="decimal-pad" placeholder="0,00" /></View>
            <View style={styles.half}><Text style={styles.label}>Preço anterior</Text><TextInput style={styles.input} value={value.old_price} onChangeText={(old_price) => onChange({ ...value, old_price })} keyboardType="decimal-pad" placeholder="Opcional" /></View>
          </View>
          <Text style={styles.label}>Quantidade em estoque</Text>
          <TextInput style={styles.input} value={value.stock_quantity} onChangeText={(stock_quantity) => onChange({ ...value, stock_quantity: stock_quantity.replace(/\D/g, "") })} keyboardType="number-pad" placeholder="0" />
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}><Text style={styles.switchTitle}>Produto visível na loja</Text><Text style={styles.switchHelp}>Desative para esconder temporariamente.</Text></View>
            <Switch value={value.active} onValueChange={(active) => onChange({ ...value, active })} trackColor={{ true: colors.coral }} />
          </View>
          <Pressable style={[styles.bottomSave, (!hasValidForm || saving) && styles.disabled]} onPress={onSave} disabled={!hasValidForm || saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.bottomSaveText}>Salvar produto</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  header: { height: 64, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.white },
  headerTitle: { fontSize: 18, fontWeight: "900", color: colors.ink },
  cancel: { color: colors.muted, fontWeight: "700" }, save: { color: colors.coralDark, fontWeight: "900" }, saveDisabled: { opacity: 0.4 },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 80 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: colors.coralDark, letterSpacing: 1, marginBottom: 10 },
  preview: { flexDirection: "row", height: 132, borderRadius: 20, overflow: "hidden", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, marginBottom: 18 },
  previewImage: { width: 132, height: 132, backgroundColor: colors.coralSoft, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" }, bigPlus: { color: colors.coral, fontSize: 64, fontWeight: "200" },
  photoBadge: { position: "absolute", left: 7, right: 7, bottom: 7, backgroundColor: "#28242bd9", paddingHorizontal: 6, paddingVertical: 5, borderRadius: 9 },
  photoBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", textAlign: "center" },
  previewBody: { flex: 1, padding: 14, justifyContent: "center" }, previewCategory: { color: colors.coralDark, fontWeight: "900", fontSize: 11, textTransform: "uppercase" },
  previewName: { color: colors.ink, fontSize: 17, fontWeight: "800", marginVertical: 7 }, previewPrice: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  stock: { color: colors.green, fontSize: 11, fontWeight: "800", marginTop: 7 }, out: { color: colors.coralDark },
  galleryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  galleryHelp: { color: colors.muted, fontSize: 11, marginTop: -3 }, galleryCount: { color: colors.coralDark, fontWeight: "900" },
  gallery: { gap: 10, paddingVertical: 12, paddingRight: 5, marginBottom: 8 },
  thumbnailWrap: { width: 78, height: 78, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.white },
  coverWrap: { borderColor: colors.coral }, thumbnail: { width: "100%", height: "100%", borderRadius: 12 },
  coverBadge: { position: "absolute", left: 4, bottom: 4, color: colors.white, backgroundColor: colors.coral, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, fontSize: 8, fontWeight: "900", overflow: "hidden" },
  removePhoto: { position: "absolute", right: -6, top: -7, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  removePhotoText: { color: colors.white, fontSize: 18, lineHeight: 20, fontWeight: "800" },
  addPhoto: { width: 78, height: 78, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: "#e9a897", backgroundColor: colors.coralSoft, alignItems: "center", justifyContent: "center" },
  addPhotoPlus: { color: colors.coral, fontSize: 30, lineHeight: 30 }, addPhotoText: { color: colors.coralDark, fontSize: 10, fontWeight: "900" },
  label: { color: colors.ink, fontSize: 14, fontWeight: "800", marginBottom: 7 },
  input: { minHeight: 52, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, fontSize: 16, marginBottom: 16 },
  description: { height: 96, paddingTop: 13, paddingBottom: 13 },
  select: { height: 52, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14, marginBottom: 10 },
  selectText: { fontSize: 16, color: colors.ink }, categoryList: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 7, marginBottom: 16 },
  categoryOption: { padding: 13, borderRadius: 9 }, categorySelected: { color: colors.coralDark, fontWeight: "900" },
  row: { flexDirection: "row", gap: 10 }, half: { flex: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.line },
  switchCopy: { flex: 1, paddingRight: 10 }, switchTitle: { color: colors.ink, fontWeight: "800" }, switchHelp: { color: colors.muted, fontSize: 11, marginTop: 3 },
  bottomSave: { height: 55, backgroundColor: colors.coral, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 22 },
  bottomSaveText: { color: colors.white, fontSize: 17, fontWeight: "900" }, disabled: { opacity: 0.5 },
});
