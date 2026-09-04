import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Category } from "../types";
import { colors } from "../theme";

type Props = {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  onRename: (category: Category, name: string) => Promise<void>;
  onDelete: (category: Category) => Promise<void>;
};

export function CategoryManager({ visible, categories, onClose, onAdd, onRename, onDelete }: Props) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (newName.trim().length < 2) return;
    setBusy(true); await onAdd(newName.trim()); setNewName(""); setBusy(false);
  }

  async function rename() {
    if (!editing || editingName.trim().length < 2) return;
    setBusy(true); await onRename(editing, editingName.trim()); setEditing(null); setBusy(false);
  }

  function confirmDelete(category: Category) {
    Alert.alert("Excluir categoria?", "Os produtos desta categoria serão arquivados e não aparecerão na loja.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { setBusy(true); await onDelete(category); setBusy(false); } },
    ]);
  }

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={styles.page}>
      <View style={styles.header}><Text style={styles.title}>Categorias</Text><Pressable onPress={onClose}><Text style={styles.close}>Concluir</Text></Pressable></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.help}>Adicione, renomeie ou exclua os menus que aparecem no app e no site.</Text>
        <View style={styles.addRow}><TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Nova categoria" /><Pressable style={styles.addButton} onPress={add} disabled={busy}><Text style={styles.addText}>＋</Text></Pressable></View>
        {categories.map((category) => <View key={category.id} style={styles.item}>
          {editing?.id === category.id ? <>
            <TextInput style={styles.editInput} value={editingName} onChangeText={setEditingName} autoFocus />
            <Pressable style={styles.smallPrimary} onPress={rename} disabled={busy}><Text style={styles.smallPrimaryText}>Salvar</Text></Pressable>
          </> : <>
            <Text style={styles.name}>{category.name}</Text>
            <Pressable style={styles.small} onPress={() => { setEditing(category); setEditingName(category.name); }}><Text>Renomear</Text></Pressable>
            <Pressable style={styles.delete} onPress={() => confirmDelete(category)}><Text style={styles.deleteText}>Excluir</Text></Pressable>
          </>}
        </View>)}
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, header: { height: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 23, fontWeight: "900", color: colors.ink }, close: { color: colors.coralDark, fontSize: 16, fontWeight: "900" }, content: { padding: 18, paddingBottom: 40 },
  help: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 17 }, addRow: { flexDirection: "row", gap: 9, marginBottom: 20 },
  input: { flex: 1, height: 52, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 15, paddingHorizontal: 14, fontSize: 16 },
  addButton: { width: 54, height: 52, borderRadius: 15, backgroundColor: colors.coral, alignItems: "center", justifyContent: "center" }, addText: { color: colors.white, fontSize: 30, lineHeight: 32 },
  item: { minHeight: 68, flexDirection: "row", gap: 7, alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 10, marginBottom: 9 },
  name: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: "800", paddingLeft: 5 }, small: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, backgroundColor: "#f2eeee" },
  delete: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, backgroundColor: "#fff0f0" }, deleteText: { color: colors.danger, fontWeight: "700" },
  editInput: { flex: 1, height: 45, borderWidth: 1, borderColor: colors.coral, borderRadius: 11, paddingHorizontal: 10, fontSize: 16 },
  smallPrimary: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.coral }, smallPrimaryText: { color: colors.white, fontWeight: "800" },
});
