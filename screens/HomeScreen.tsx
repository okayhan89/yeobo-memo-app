// screens/HomeScreen.tsx
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MemoContext } from "../context/MemoContext";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { memos, createMemo } = useContext(MemoContext);
  const [search, setSearch] = useState("");

  const sortedMemos = [...memos]
    .filter((memo) => memo.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (b.pinned === a.pinned) {
        if (b.favorite === a.favorite) {
          return (
            new Date(b.updatedAt || b.createdAt) -
            new Date(a.updatedAt || a.createdAt)
          );
        }
        return b.favorite ? 1 : -1;
      }
      return b.pinned ? 1 : -1;
    });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 여보 뭐사야돼</Text>

      <TextInput
        placeholder="메모 제목 검색"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      <FlatList
        data={sortedMemos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.memoCard}
            onPress={() => navigation.navigate("MemoList", { memoId: item.id })}
          >
            <View style={styles.memoRow}>
              <Text style={styles.memoTitle}>{item.title}</Text>
              <View style={styles.badgeRow}>
                {item.favorite && (
                  <View style={styles.favoriteContainer}>
                    <Text style={styles.favoriteText}>⭐ 즐겨찾기</Text>
                  </View>
                )}
                {item.pinned && (
                  <View style={styles.pinnedContainer}>
                    <Text style={styles.pinnedText}>📌 고정됨</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>메모장을 추가해보세요!</Text>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={createMemo}>
        <Text style={styles.addButtonText}>+ 새 메모장</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  memoCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#fdfdfd",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  memoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
  },
  memoTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  pinnedContainer: {
    backgroundColor: "#fff2e5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
  },
  pinnedText: {
    fontSize: 14,
    color: "#ff8c00",
    fontWeight: "600",
  },
  favoriteContainer: {
    backgroundColor: "#e5f0ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  favoriteText: {
    fontSize: 14,
    color: "#007aff",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#999",
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
