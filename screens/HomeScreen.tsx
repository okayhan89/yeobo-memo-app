import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MemoContext } from "../context/MemoContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_HISTORY_KEY = "searchHistory";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { memos, createMemo, toggleFavorite, deleteMemo } =
    useContext(MemoContext);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(SEARCH_HISTORY_KEY).then((saved) => {
      if (saved) setSearchHistory(JSON.parse(saved));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  const updateSearchHistory = (keyword) => {
    if (!keyword.trim()) return;
    setSearchHistory((prev) => {
      const next = [keyword, ...prev.filter((k) => k !== keyword)];
      return next.slice(0, 10); // 최대 10개
    });
  };

  const handleSearch = (text) => {
    setSearch(text);
    updateSearchHistory(text);
  };

  const filteredMemos = memos.filter((memo) => {
    const searchLower = search.toLowerCase();
    const inTitle = memo.title.toLowerCase().includes(searchLower);
    const inItems = memo.items?.some((item) =>
      item.name.toLowerCase().includes(searchLower)
    );

    if (filter === "pinned") return memo.pinned && (inTitle || inItems);
    if (filter === "favorite") return memo.favorite && (inTitle || inItems);
    return inTitle || inItems;
  });

  const pinnedMemos = filteredMemos.filter((memo) => memo.pinned);
  const otherMemos = filteredMemos
    .filter((memo) => !memo.pinned)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
    );

  const sections = [];
  if (pinnedMemos.length > 0) {
    sections.push({ title: "📌 고정된 메모", data: pinnedMemos });
  }
  if (otherMemos.length > 0) {
    sections.push({ title: "📚 전체 메모", data: otherMemos });
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 여보 뭐사야돼</Text>

      <View style={styles.filterRow}>
        {["all", "pinned", "favorite"].map((type) => (
          <TouchableOpacity key={type} onPress={() => setFilter(type)}>
            <Text
              style={[
                styles.filterButton,
                filter === type && styles.filterSelected,
              ]}
            >
              {type === "all"
                ? "전체"
                : type === "pinned"
                ? "📌 고정"
                : "⭐ 즐겨찾기"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder="메모 제목 또는 품목 검색"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => updateSearchHistory(search)}
        style={styles.searchInput}
      />

      {searchHistory.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.historyContainer}
        >
          {searchHistory.map((term, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSearch(term)}
              style={styles.historyItem}
            >
              <Text style={styles.historyText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <SectionList
        sections={sections}
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
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
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
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  historyContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: "#eee",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  historyText: {
    fontSize: 14,
    color: "#333",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
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
  memoTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  memoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
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
  deleteIcon: {
    fontSize: 18,
    marginLeft: 8,
    color: "#ff3b30",
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
