// screens/HomeScreen.tsx
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MemoContext } from "../context/MemoContext";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { memos, createMemo, toggleFavorite, deleteMemo } =
    useContext(MemoContext);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | pinned | favorite

  const filteredMemos = memos.filter((memo) => {
    if (filter === "pinned") return memo.pinned;
    if (filter === "favorite") return memo.favorite;
    return true;
  });

  const sortedMemos = [...filteredMemos]
    .filter((memo) => memo.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (b.pinned === a.pinned) {
        if (b.favorite === a.favorite) {
          return (
            new Date(b.updatedAt || b.createdAt) -
            new Date(a.updatedAt || a.createdAt)
          );
        } else {
          return b.favorite ? 1 : -1;
        }
      } else {
        return b.pinned ? 1 : -1;
      }
    });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 여보 뭐사야돼</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity onPress={() => setFilter("all")}>
          <Text
            style={[
              styles.filterButton,
              filter === "all" && styles.filterSelected,
            ]}
          >
            전체
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("pinned")}>
          <Text
            style={[
              styles.filterButton,
              filter === "pinned" && styles.filterSelected,
            ]}
          >
            📌 고정
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("favorite")}>
          <Text
            style={[
              styles.filterButton,
              filter === "favorite" && styles.filterSelected,
            ]}
          >
            ⭐ 즐겨찾기
          </Text>
        </TouchableOpacity>
      </View>

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
          <View style={styles.memoCard}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("MemoList", { memoId: item.id })
              }
              style={styles.memoTitleWrapper}
            >
              <Text style={styles.memoTitle}>{item.title}</Text>
            </TouchableOpacity>
            <View style={styles.memoRow}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("삭제 확인", "정말 삭제하시겠어요?", [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: () => deleteMemo(item.id),
                    },
                  ]);
                }}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
              <View style={styles.badgeRow}>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Text style={styles.favoriteIcon}>
                    {item.favorite ? "⭐" : "☆"}
                  </Text>
                </TouchableOpacity>
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
          </View>
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
  memoTitleWrapper: {
    marginBottom: 8,
  },
  memoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  filterButton: {
    fontSize: 14,
    color: "#666",
    padding: 6,
  },
  filterSelected: {
    fontWeight: "bold",
    color: "#000",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
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
  favoriteIcon: {
    fontSize: 20,
    marginRight: 4,
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
  deleteIcon: {
    fontSize: 18,
    marginLeft: 8,
    color: "#ff3b30",
  },
});
