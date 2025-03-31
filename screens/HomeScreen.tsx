import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MemoContext } from "../context/MemoContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_HISTORY_KEY = "searchHistory";
const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const COLUMN_COUNT = 2;
const CARD_WIDTH =
  (width - 32 - (COLUMN_COUNT - 1) * CARD_MARGIN) / COLUMN_COUNT;

const MemoCard = ({ item, navigation, toggleFavorite, deleteMemo }) => {
  // 메모 내용 요약 생성
  const getSummary = () => {
    if (!item.items || item.items.length === 0) return "내용 없음";

    // 최대 3개 항목만 가져와 표시
    const summaryItems = item.items.slice(0, 3).map((i) => i.name);
    const summaryText = summaryItems.join(", ");

    // 더 많은 항목이 있을 경우 '...' 추가
    return item.items.length > 3
      ? `${summaryText} 외 ${item.items.length - 3}개`
      : summaryText;
  };

  return (
    <View style={styles.memoCard}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          style={styles.favoriteButton}
        >
          <Text style={styles.favoriteIcon}>{item.favorite ? "⭐" : "☆"}</Text>
        </TouchableOpacity>

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
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate("MemoList", { memoId: item.id })}
      >
        <View>
          <Text style={styles.memoTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text
            style={styles.memoSummary}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getSummary()}
          </Text>
        </View>

        <Text style={styles.memoDate}>
          {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

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

  const filteredMemos = memos
    .filter((memo) => {
      const searchLower = search.toLowerCase();
      const inTitle = memo.title.toLowerCase().includes(searchLower);
      const inItems = memo.items?.some((item) =>
        item.name.toLowerCase().includes(searchLower)
      );

      if (filter === "favorite") return memo.favorite && (inTitle || inItems);
      return inTitle || inItems;
    })
    .sort((a, b) => {
      // Date 객체를 timestamp로 변환하여 비교
      return (
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
      );
    });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 여보 뭐사야돼</Text>

      <View style={styles.filterRow}>
        {["all", "favorite"].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilter(type)}
            style={[
              styles.filterButtonContainer,
              filter === type && styles.activeFilterContainer,
            ]}
          >
            <Text
              style={[
                styles.filterButton,
                filter === type && styles.filterSelected,
              ]}
            >
              {type === "all" ? "전체" : "⭐ 즐겨찾기"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="메모 제목 또는 품목 검색"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => updateSearchHistory(search)}
          style={styles.searchInput}
        />
      </View>

      {searchHistory.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.historyContainer}
          contentContainerStyle={styles.historyContentContainer}
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

      <FlatList
        data={filteredMemos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MemoCard
            item={item}
            navigation={navigation}
            toggleFavorite={toggleFavorite}
            deleteMemo={deleteMemo}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>메모장을 추가해보세요!</Text>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />

      <TouchableOpacity style={styles.addButton} onPress={createMemo}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#212529",
    textAlign: "center",
    marginTop: 8,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  filterButtonContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
  },
  activeFilterContainer: {
    backgroundColor: "#dee2e6",
  },
  filterButton: {
    fontSize: 14,
    color: "#495057",
  },
  filterSelected: {
    fontWeight: "bold",
    color: "#000",
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  historyContainer: {
    marginBottom: 16,
  },
  historyContentContainer: {
    paddingRight: 12,
  },
  historyItem: {
    backgroundColor: "#e9ecef",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  historyText: {
    fontSize: 14,
    color: "#495057",
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: CARD_MARGIN,
  },
  memoCard: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  memoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  memoSummary: {
    fontSize: 13,
    color: "#6c757d",
    lineHeight: 18,
  },
  memoDate: {
    fontSize: 10,
    color: "#868e96",
    marginTop: 4,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 14,
    color: "#868e96",
    fontWeight: "bold",
  },
  favoriteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#868e96",
    textAlign: "center",
  },
  listContentContainer: {
    paddingBottom: 80,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#4dabf7",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 28,
  },
});
