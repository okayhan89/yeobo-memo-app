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
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MemoContext } from "../context/MemoContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// 네비게이션 타입 정의
type RootStackParamList = {
  Home: undefined;
  MemoList: { memoId: string };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

const SEARCH_HISTORY_KEY = "searchHistory";
const { width } = Dimensions.get("window");

const MemoCard = ({ item, navigation, toggleFavorite, deleteMemo }) => {
  return (
    <TouchableOpacity
      style={styles.memoCard}
      onPress={() => navigation.navigate("MemoList", { memoId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.textContent}>
          <Text style={styles.memoTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.title || "제목 없음"}
          </Text>

          {item.items && item.items.length > 0 ? (
            <View style={styles.memoContentContainer}>
              <View style={styles.itemsPreview}>
                {item.items.slice(0, 4).map((listItem, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.previewItem,
                      listItem.checked && styles.checkedItem,
                    ]}
                    numberOfLines={1}
                  >
                    • {listItem.name}
                  </Text>
                ))}
                {item.items.length > 4 && (
                  <Text style={styles.moreItems}>
                    +{item.items.length - 4}개 더...
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.memoSummary}>내용 없음</Text>
          )}

          <Text style={styles.memoDate}>
            {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            style={[
              styles.favoriteButton,
              item.favorite && styles.favoriteActiveButton
            ]}
          >
            <Text style={[styles.favoriteIcon, item.favorite && styles.favoriteActiveIcon]}>{item.favorite ? "★" : "☆"}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              deleteMemo();
            }} 
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { memos, createMemo, toggleFavorite, deleteMemo, restoreMemo } =
    useContext(MemoContext);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchHistory, setSearchHistory] = useState([]);
  const [deletedMemos, setDeletedMemos] = useState([]);
  const [showUndo, setShowUndo] = useState(false);
  const [undoOpacity] = useState(new Animated.Value(0));
  const [showActionMenu, setShowActionMenu] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SEARCH_HISTORY_KEY).then((saved) => {
      if (saved) setSearchHistory(JSON.parse(saved));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Separate function to show toast with proper animation
  const showUndoToast = () => {
    // Reset and show immediately
    undoOpacity.setValue(0);
    setShowUndo(true);

    // Fade in quickly
    Animated.timing(undoOpacity, {
      toValue: 1,
      duration: 200, // Quick fade in
      useNativeDriver: true,
    }).start();

    // Set up fade out timer
    return setTimeout(() => {
      Animated.timing(undoOpacity, {
        toValue: 0,
        duration: 800, // Fade out
        useNativeDriver: true,
      }).start(() => {
        setShowUndo(false);
      });
    }, 2000); // Show for 2 seconds before fade starts
  };

  // Add timeout to auto-hide the undo notification with animation
  useEffect(() => {
    let timer;
    if (showUndo) {
      timer = showUndoToast();
    }
    return () => clearTimeout(timer);
  }, [showUndo]);

  // Clear deleted memo history after 30 minutes
  useEffect(() => {
    if (deletedMemos.length > 0) {
      const timer = setTimeout(() => {
        setDeletedMemos([]);
      }, 1800000); // 30 minutes
      return () => clearTimeout(timer);
    }
  }, [deletedMemos]);

  const handleDeleteMemo = (memo) => {
    // 삭제된 메모 원본 그대로 보존합니다
    const memoToStore = {
      ...memo,
      // 삭제 시간 정보만 추가합니다
      deletedAt: new Date().toISOString(),
    };

    // First update the UI state to show the toast immediately
    setShowUndo(true);

    // Then update the data state
    const newDeletedMemos = [...deletedMemos, memoToStore];
    setDeletedMemos(newDeletedMemos.slice(0, 10)); // Keep only the 10 most recent deletions

    // Finally delete the memo
    deleteMemo(memo.id);
  };

  // Quick undo from toast - only restores the most recent memo
  const handleQuickUndo = () => {
    if (deletedMemos.length > 0) {
      // 가장 최근에 삭제된 메모
      const memoToRestore = deletedMemos[0];

      // 삭제 시 추가된 속성을 제외하고 원본 메모 구조 그대로 복원
      const { deletedAt, ...originalMemo } = memoToRestore;

      restoreMemo(originalMemo);

      // Remove it from the deleted memos array
      setDeletedMemos((prev) => prev.slice(1));
      setShowUndo(false);
    }
  };

  // Full undo from action menu - can restore any deleted memo
  const handleRestoreMemo = (index) => {
    if (deletedMemos.length > index) {
      // 선택한 메모
      const memoToRestore = deletedMemos[index];

      // 삭제 시 추가된 속성을 제외하고 원본 메모 구조 그대로 복원
      const { deletedAt, ...originalMemo } = memoToRestore;

      restoreMemo(originalMemo);

      // Remove it from the deleted memos array
      setDeletedMemos((prev) => prev.filter((_, i) => i !== index));

      // Close menu if no more items
      if (deletedMemos.length <= 1) {
        setShowActionMenu(false);
      }
    }
  };

  const toggleActionMenu = () => {
    setShowActionMenu(!showActionMenu);
  };

  const handleCreateMemo = () => {
    const newMemoId = createMemo();
    navigation.navigate("MemoList", { memoId: newMemoId });
  };

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
      const inTitle = memo.title?.toLowerCase().includes(searchLower);
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
      {/* 헤더 영역 */}
      <View style={styles.headerSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="search"
            placeholderTextColor="#adb5bd"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => updateSearchHistory(search)}
            selectTextOnFocus={true}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              style={styles.searchClearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* 필터 탭 */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={[
              styles.segmentButton,
              filter === "all" && styles.activeSegment,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                filter === "all" && styles.activeSegmentText,
              ]}
            >
              전체
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("favorite")}
            style={[
              styles.segmentButton,
              filter === "favorite" && styles.activeSegment,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                filter === "favorite" && styles.activeSegmentText,
                filter === "favorite" && styles.favoriteSegmentActive,
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 검색 히스토리 */}
      {searchHistory.length > 0 && (
        <View style={styles.historySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.historyContainer}
            contentContainerStyle={styles.historyContentContainer}
          >
            {searchHistory.map((term, index) => (
              <View key={index} style={styles.historyItemContainer}>
                <TouchableOpacity
                  onPress={() => setSearch(term)}
                  style={styles.historyItem}
                >
                  <Text style={styles.historyText}>{term}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const newHistory = searchHistory.filter((_, i) => i !== index);
                    setSearchHistory(newHistory);
                    AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
                  }}
                  style={styles.historyDeleteButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.historyDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 메모 리스트 */}
      <View style={styles.contentSection}>
        <FlatList
          data={filteredMemos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemoCard
              item={item}
              navigation={navigation}
              toggleFavorite={toggleFavorite}
              deleteMemo={() => handleDeleteMemo(item)}
            />
          )}
          numColumns={1}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {filter === "favorite" ? (
                <>
                  <Text style={styles.emptyIcon}>★</Text>
                  <Text style={styles.emptyText}>즐겨찾기된 메모가 없습니다</Text>
                  <Text style={styles.emptySubtext}>
                    메모의 ★ 버튼을 눌러 즐겨찾기를 추가해보세요
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyIcon}>✏</Text>
                  <Text style={styles.emptyText}>메모장을 추가해보세요!</Text>
                </>
              )}
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Undo Toast Notification - only for most recent deletion */}
      {showUndo && (
        <Animated.View style={[styles.undoContainer, { opacity: undoOpacity }]}>
          <Text style={styles.undoText}>메모가 삭제되었습니다</Text>
          <TouchableOpacity onPress={handleQuickUndo} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>되돌리기</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Action Menu - includes multi-item undo functionality */}
      {showActionMenu && (
        <>
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowActionMenu(false)}
          />
          <View style={styles.actionMenuContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                handleCreateMemo();
                setShowActionMenu(false);
              }}
            >
              <Text style={styles.actionButtonIcon}>➕</Text>
              <Text style={styles.actionButtonText}>새 메모</Text>
            </TouchableOpacity>

            {/* Only show deleted memos section if there are any */}
            {deletedMemos.length > 0 && (
              <>
                <View style={styles.actionDivider} />
                <View style={styles.actionHeaderContainer}>
                  <Text style={styles.actionSectionTitle}>
                    최근 삭제된 메모
                  </Text>
                  <Text style={styles.actionSectionCount}>
                    {deletedMemos.length}/10
                  </Text>
                </View>
                <Text style={styles.actionSectionDescription}>
                  최대 10개까지 복구 가능합니다
                </Text>
                <ScrollView
                  style={[
                    styles.deletedMemosScrollBase,
                    deletedMemos.length > 3 ? styles.deletedMemosScroll : null,
                  ]}
                  showsVerticalScrollIndicator={false}
                >
                  {deletedMemos.map((memo, index) => {
                    return (
                      <TouchableOpacity
                        key={memo.id}
                        style={styles.actionButton}
                        onPress={() => handleRestoreMemo(index)}
                      >
                        <Text style={styles.actionButtonIcon}>🔄</Text>
                        <View style={styles.actionButtonContent}>
                          <Text
                            style={[
                              styles.actionButtonText,
                              (!memo.title || memo.title.trim() === "") && {
                                fontStyle: "italic",
                                color: "#adb5bd",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {memo.title ? memo.title : "(제목 없음)"}
                          </Text>
                          <Text style={styles.actionButtonSubtext}>
                            {memo.deletedAt
                              ? new Date(memo.deletedAt).toLocaleTimeString()
                              : new Date().toLocaleTimeString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </>
      )}

      {/* Main Action Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleCreateMemo}
        onLongPress={toggleActionMenu}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: "#f8f9fa",
  },
  headerSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    fontSize: 20,
    zIndex: 1,
    color: "#6c757d",
    fontWeight: "400",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 44,
    paddingRight: 44,
    fontSize: 16,
    color: "#212529",
  },
  searchClearButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  searchClearText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "700",
    lineHeight: 14,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeSegment: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    color: "#6c757d",
    fontWeight: "500",
  },
  activeSegmentText: {
    fontWeight: "700",
    color: "#339af0",
  },
  favoriteSegmentActive: {
    color: "#ff8f00",
  },
  historySection: {
    marginBottom: 20,
  },
  historyContainer: {
    marginBottom: 4,
  },
  historyContentContainer: {
    paddingRight: 12,
  },
  historyItemContainer: {
    position: "relative",
    marginRight: 10,
  },
  historyItem: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f3f5",
  },
  historyDeleteButton: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6c757d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  historyDeleteText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
    lineHeight: 14,
  },
  historyText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  contentSection: {
    flex: 1,
  },
  memoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  memoTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  memoSummary: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
    marginBottom: 4,
  },
  memoDate: {
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#868e96",
    fontWeight: "600",
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  favoriteIcon: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
  },
  favoriteActiveIcon: {
    color: "#ff8f00",
  },
  favoriteActiveButton: {
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  emptyContainer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyText: {
    fontSize: 17,
    color: "#6c757d",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 4,
  },
  listContentContainer: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#339af0",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#339af0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 28,
    lineHeight: 32,
    textAlign: "center",
    marginTop: -2,
  },
  memoContentContainer: {
    marginTop: 4,
  },
  itemsPreview: {
    marginTop: 4,
    marginBottom: 6,
  },
  previewItem: {
    fontSize: 13,
    color: "#495057",
    marginBottom: 2,
    lineHeight: 18,
  },
  checkedItem: {
    textDecorationLine: "line-through",
    color: "#adb5bd",
  },
  moreItems: {
    fontSize: 12,
    color: "#adb5bd",
    fontWeight: "500",
    marginTop: 2,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  actionMenuContainer: {
    position: "absolute",
    bottom: 100,
    right: 24,
    backgroundColor: "rgba(33, 37, 41, 0.9)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "column",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    minWidth: 240,
    maxWidth: 280,
    zIndex: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    width: "100%",
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    flex: 1,
  },
  actionButtonContent: {
    flex: 1,
    flexDirection: "column",
  },
  actionButtonSubtext: {
    fontSize: 10,
    color: "#adb5bd",
    marginTop: 2,
  },
  undoContainer: {
    position: "absolute",
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  undoText: {
    color: "#fff",
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  undoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#4dabf7",
  },
  undoButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  actionDivider: {
    height: 1,
    backgroundColor: "rgba(222, 226, 230, 0.3)",
    marginVertical: 12,
    width: "100%",
  },
  actionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 8,
  },
  actionSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#adb5bd",
  },
  actionSectionCount: {
    fontSize: 12,
    color: "#adb5bd",
    fontWeight: "500",
  },
  actionSectionDescription: {
    fontSize: 11,
    color: "#adb5bd",
    marginBottom: 12,
    paddingHorizontal: 8,
    fontStyle: "italic",
  },
  deletedMemosScrollBase: {
    width: "100%",
  },
  deletedMemosScroll: {
    maxHeight: 200,
    width: "100%",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
    color: "#dee2e6",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
});
