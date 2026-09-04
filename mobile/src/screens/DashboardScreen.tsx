import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Crypto from "expo-crypto";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryManager } from "../components/CategoryManager";
import { ProductEditor } from "../components/ProductEditor";
import { writeAudit } from "../lib/audit";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";
import type { Category, Product, ProductDraft } from "../types";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function draftFrom(product?: Product, category = ""): ProductDraft {
  return product ? {
    id: product.id,
    name: product.name,
    category: product.category,
    price: String(product.price).replace(".", ","),
    old_price: product.old_price === null ? "" : String(product.old_price).replace(".", ","),
    image_url: product.image_url,
    stock_quantity: String(product.stock_quantity),
    active: product.active,
    archived: product.archived,
  } : {
    name: "",
    category,
    price: "",
    old_price: "",
    image_url: "",
    stock_quantity: "0",
    active: true,
    archived: false,
  };
}

export function DashboardScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [editor, setEditor] = useState<ProductDraft | null>(null);
  const [categoryManager, setCategoryManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    const [categoryResult, productResult] = await Promise.all([
      supabase.from("categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ]);
    if (categoryResult.error || productResult.error) {
      Alert.alert("Não foi possível carregar", categoryResult.error?.message || productResult.error?.message || "Tente novamente.");
    } else {
      setCategories(categoryResult.data as Category[]);
      setProducts(productResult.data as Product[]);
    }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleProducts = useMemo(() => products.filter((product) =>
    product.archived === archived &&
    (category === "Todos" || product.category === category) &&
    product.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")),
  ), [archived, category, products, query]);

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function closeSelection() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  async function uploadImage(draft: ProductDraft) {
    if (!draft.local_image_uri) return draft.image_url;
    const response = await fetch(draft.local_image_uri);
    const bytes = await response.arrayBuffer();
    const mime = draft.image_mime_type || "image/jpeg";
    const extension = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `${Crypto.randomUUID()}.${extension}`;
    const result = await supabase.storage.from("product-images").upload(path, bytes, { contentType: mime });
    if (result.error) throw result.error;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  async function saveProduct() {
    if (!editor) return;
    setSaving(true);
    try {
      const image_url = await uploadImage(editor);
      const payload = {
        name: editor.name.trim(),
        category: editor.category,
        price: Number(editor.price.replace(",", ".")),
        old_price: editor.old_price ? Number(editor.old_price.replace(",", ".")) : null,
        image_url,
        stock_quantity: Number(editor.stock_quantity || 0),
        active: editor.active,
        archived: false,
      };
      if (editor.id) {
        const result = await supabase.from("products").update(payload).eq("id", editor.id).select().single();
        if (result.error) throw result.error;
        setProducts((current) => current.map((product) => product.id === editor.id ? result.data as Product : product));
        await writeAudit("product_updated", { product_id: editor.id, product_name: payload.name });
      } else {
        const result = await supabase.from("products").insert(payload).select().single();
        if (result.error) throw result.error;
        setProducts((current) => [result.data as Product, ...current]);
        await writeAudit("product_created", { product_id: result.data.id, product_name: payload.name });
      }
      setEditor(null);
    } catch (error) {
      Alert.alert("Não foi possível salvar", error instanceof Error ? error.message : "Tente novamente.");
    } finally { setSaving(false); }
  }

  async function runBulk(action: "archive" | "restore" | "delete") {
    const ids = [...selected];
    if (!ids.length) return;
    try {
      if (action === "delete") {
        const result = await supabase.from("products").delete().in("id", ids);
        if (result.error) throw result.error;
        setProducts((current) => current.filter((product) => !selected.has(product.id)));
        await writeAudit("products_deleted", { product_ids: ids, count: ids.length });
      } else {
        const values = action === "archive" ? { archived: true, active: false } : { archived: false };
        const result = await supabase.from("products").update(values).in("id", ids).select();
        if (result.error) throw result.error;
        const updated = new Map((result.data as Product[]).map((product) => [product.id, product]));
        setProducts((current) => current.map((product) => updated.get(product.id) || product));
        await writeAudit(action === "archive" ? "products_archived" : "products_restored", { product_ids: ids, count: ids.length });
      }
      closeSelection();
    } catch (error) { Alert.alert("Não foi possível concluir", error instanceof Error ? error.message : "Tente novamente."); }
  }

  function confirmBulk(action: "archive" | "restore" | "delete") {
    const title = action === "delete" ? "Excluir produtos?" : action === "archive" ? "Arquivar produtos?" : "Restaurar produtos?";
    const text = action === "delete" ? "Essa ação exclui definitivamente os produtos selecionados." : `${selected.size} produto(s) selecionado(s).`;
    Alert.alert(title, text, [{ text: "Cancelar", style: "cancel" }, { text: "Confirmar", style: action === "delete" ? "destructive" : "default", onPress: () => void runBulk(action) }]);
  }

  async function addCategory(name: string) {
    const result = await supabase.from("categories").insert({ name, sort_order: categories.length + 1 }).select().single();
    if (result.error) return Alert.alert("Não foi possível adicionar", result.error.message);
    setCategories((current) => [...current, result.data as Category]);
    await writeAudit("category_created", { category_name: name });
  }

  async function renameCategory(item: Category, name: string) {
    const productUpdate = await supabase.from("products").update({ category: name }).eq("category", item.name);
    if (productUpdate.error) return Alert.alert("Não foi possível renomear", productUpdate.error.message);
    const result = await supabase.from("categories").update({ name }).eq("id", item.id).select().single();
    if (result.error) return Alert.alert("Não foi possível renomear", result.error.message);
    setCategories((current) => current.map((value) => value.id === item.id ? result.data as Category : value));
    setProducts((current) => current.map((product) => product.category === item.name ? { ...product, category: name } : product));
    if (category === item.name) setCategory(name);
    await writeAudit("category_renamed", { old_name: item.name, new_name: name });
  }

  async function deleteCategory(item: Category) {
    const productResult = await supabase.from("products").update({ archived: true, active: false }).eq("category", item.name);
    if (productResult.error) return Alert.alert("Não foi possível arquivar os produtos", productResult.error.message);
    const result = await supabase.from("categories").delete().eq("id", item.id);
    if (result.error) return Alert.alert("Não foi possível excluir", result.error.message);
    setCategories((current) => current.filter((value) => value.id !== item.id));
    setProducts((current) => current.map((product) => product.category === item.name ? { ...product, archived: true, active: false } : product));
    if (category === item.name) setCategory("Todos");
    await writeAudit("category_deleted", { category_name: item.name });
  }

  const Header = <>
    <View style={styles.top}>
      {selectionMode ? <>
        <Pressable onPress={closeSelection}><Text style={styles.topLink}>Cancelar</Text></Pressable>
        <Text style={styles.topTitle}>{selected.size} selecionado(s)</Text>
        <Pressable onPress={() => setSelected(new Set(visibleProducts.map((product) => product.id)))}><Text style={styles.topLink}>Todos</Text></Pressable>
      </> : <>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Pressable style={styles.logout} onPress={() => void supabase.auth.signOut()}><Text style={styles.logoutText}>Sair</Text></Pressable>
      </>}
    </View>
    {selectionMode ? <View style={styles.bulk}>
      <Pressable style={styles.bulkButton} onPress={() => confirmBulk(archived ? "restore" : "archive")}><Text style={styles.bulkText}>{archived ? "Restaurar" : "Arquivar"}</Text></Pressable>
      <Pressable style={styles.deleteButton} onPress={() => confirmBulk("delete")}><Text style={styles.deleteText}>Excluir</Text></Pressable>
    </View> : <View style={styles.tools}>
      <Pressable style={styles.toolButton} onPress={() => setSelectionMode(true)}><Text style={styles.toolText}>Selecionar</Text></Pressable>
      <Pressable style={[styles.toolButton, archived && styles.toolActive]} onPress={() => { setArchived((current) => !current); closeSelection(); }}><Text style={[styles.toolText, archived && styles.toolActiveText]}>{archived ? "Produtos" : "Arquivados"}</Text></Pressable>
      <Pressable style={styles.categoryButton} onPress={() => setCategoryManager(true)}><Text style={styles.categoryButtonText}>Categorias</Text></Pressable>
    </View>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      {["Todos", ...categories.map((item) => item.name)].map((item) => <Pressable key={item} style={[styles.tab, category === item && styles.tabActive]} onPress={() => setCategory(item)}><Text style={[styles.tabText, category === item && styles.tabTextActive]}>{item}</Text></Pressable>)}
    </ScrollView>
    <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Buscar produto" /><Pressable onPress={() => setQuery("")}><Text style={styles.clear}>{query ? "×" : ""}</Text></Pressable></View>
    <View style={styles.heading}><View><Text style={styles.eyebrow}>{archived ? "ARQUIVO" : "CATÁLOGO"}</Text><Text style={styles.headingTitle}>{category === "Todos" ? (archived ? "Produtos arquivados" : "Todos os produtos") : category}</Text></View><Text style={styles.count}>{visibleProducts.length} itens</Text></View>
  </>;

  if (loading) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color={colors.coral} /><Text style={styles.loadingText}>Carregando sua loja...</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <FlatList
      data={archived ? visibleProducts : [{ id: "__add" } as Product, ...visibleProducts]}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.columns}
      contentContainerStyle={styles.list}
      ListHeaderComponent={Header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={[colors.coral]} />}
      ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>□</Text><Text style={styles.emptyTitle}>Nenhum produto aqui</Text><Text style={styles.emptyText}>Altere a categoria ou restaure um produto.</Text></View>}
      renderItem={({ item }) => {
        if (item.id === "__add") return <Pressable style={styles.addCard} onPress={() => setEditor(draftFrom(undefined, category === "Todos" ? categories[0]?.name || "" : category))}><View style={styles.addImage}><Text style={styles.addPlus}>＋</Text></View><View style={styles.addBody}><Text style={styles.addTitle}>Adicionar produto</Text><Text style={styles.addHelp}>Toque para criar</Text></View></Pressable>;
        const isSelected = selected.has(item.id);
        return <Pressable style={[styles.card, isSelected && styles.cardSelected]} onPress={() => selectionMode ? toggleSelected(item.id) : setEditor(draftFrom(item))} onLongPress={() => { setSelectionMode(true); toggleSelected(item.id); }}>
          <View style={styles.cardImageWrap}><Image source={{ uri: item.image_url }} style={styles.cardImage} />{selectionMode && <View style={[styles.check, isSelected && styles.checkActive]}><Text style={styles.checkText}>{isSelected ? "✓" : ""}</Text></View>}</View>
          <View style={styles.cardBody}><Text style={styles.cardCategory}>{item.category}</Text><Text style={styles.cardName} numberOfLines={2}>{item.name}</Text><Text style={styles.cardPrice}>{money(item.price)}</Text><Text style={[styles.cardStock, item.stock_quantity <= 0 && styles.cardOut]}>{item.stock_quantity > 0 ? `${item.stock_quantity} em estoque` : "Fora de estoque"}</Text></View>
        </Pressable>;
      }}
    />
    {editor && <ProductEditor value={editor} categories={categories} saving={saving} onChange={setEditor} onClose={() => setEditor(null)} onSave={() => void saveProduct()} />}
    <CategoryManager visible={categoryManager} categories={categories} onClose={() => setCategoryManager(false)} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }, loadingText: { color: colors.muted, marginTop: 12 },
  list: { paddingBottom: 45 }, top: { height: 70, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line },
  logo: { width: 176, height: 62 }, logout: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#f2eeee", borderRadius: 12 }, logoutText: { color: colors.ink, fontWeight: "800" },
  topTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" }, topLink: { color: colors.coralDark, fontWeight: "900", padding: 6 },
  tools: { flexDirection: "row", gap: 8, padding: 12, paddingBottom: 6 }, toolButton: { flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  toolText: { color: colors.ink, fontSize: 13, fontWeight: "800" }, toolActive: { backgroundColor: colors.ink }, toolActiveText: { color: colors.white }, categoryButton: { flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: colors.coral, alignItems: "center", justifyContent: "center" }, categoryButtonText: { color: colors.white, fontSize: 13, fontWeight: "900" },
  bulk: { flexDirection: "row", gap: 9, padding: 12, paddingBottom: 6 }, bulkButton: { flex: 1, minHeight: 47, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink, borderRadius: 14 }, bulkText: { color: colors.white, fontWeight: "900" }, deleteButton: { flex: 1, minHeight: 47, alignItems: "center", justifyContent: "center", backgroundColor: "#fff0f0", borderRadius: 14 }, deleteText: { color: colors.danger, fontWeight: "900" },
  tabs: { gap: 8, paddingHorizontal: 12, paddingVertical: 12 }, tab: { backgroundColor: colors.coralSoft, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1, borderColor: "#f6c9bd" }, tabActive: { backgroundColor: colors.coral, borderColor: colors.coral }, tabText: { color: colors.coralDark, fontWeight: "800" }, tabTextActive: { color: colors.white },
  search: { height: 51, marginHorizontal: 12, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13 }, searchIcon: { color: colors.muted, fontSize: 24 }, searchInput: { flex: 1, paddingHorizontal: 9, fontSize: 16 }, clear: { color: colors.muted, fontSize: 24, minWidth: 20 },
  heading: { margin: 20, marginBottom: 13, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }, eyebrow: { color: colors.coralDark, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, headingTitle: { color: colors.ink, fontSize: 22, fontWeight: "900", marginTop: 3 }, count: { color: colors.muted, fontSize: 12 },
  columns: { gap: 11, paddingHorizontal: 12, marginBottom: 11 }, card: { flex: 1, maxWidth: "50%", backgroundColor: colors.white, borderRadius: 19, overflow: "hidden", borderWidth: 1, borderColor: colors.line }, cardSelected: { borderColor: colors.coral, borderWidth: 3 },
  cardImageWrap: { aspectRatio: 1, backgroundColor: "#eee", position: "relative" }, cardImage: { width: "100%", height: "100%" }, check: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: colors.white, backgroundColor: "#28242b99", alignItems: "center", justifyContent: "center" }, checkActive: { backgroundColor: colors.coral }, checkText: { color: colors.white, fontWeight: "900" },
  cardBody: { minHeight: 132, padding: 12 }, cardCategory: { color: colors.coralDark, fontSize: 10, fontWeight: "900", textTransform: "uppercase" }, cardName: { color: colors.ink, fontSize: 15, lineHeight: 19, fontWeight: "800", marginVertical: 6 }, cardPrice: { color: colors.ink, fontSize: 17, fontWeight: "900" }, cardStock: { color: colors.green, fontSize: 11, fontWeight: "800", marginTop: 6 }, cardOut: { color: colors.coralDark },
  addCard: { flex: 1, maxWidth: "50%", backgroundColor: colors.white, borderRadius: 19, overflow: "hidden", borderWidth: 2, borderStyle: "dashed", borderColor: "#e9a897" }, addImage: { aspectRatio: 1, backgroundColor: colors.coralSoft, alignItems: "center", justifyContent: "center" }, addPlus: { color: colors.coral, fontSize: 72, fontWeight: "200" }, addBody: { minHeight: 132, padding: 12, justifyContent: "center" }, addTitle: { color: colors.coralDark, fontSize: 15, fontWeight: "900" }, addHelp: { color: colors.muted, fontSize: 12, marginTop: 5 },
  empty: { alignItems: "center", paddingVertical: 70, paddingHorizontal: 25 }, emptyIcon: { color: colors.coral, fontSize: 50 }, emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: "900", marginTop: 8 }, emptyText: { color: colors.muted, marginTop: 5, textAlign: "center" },
});
