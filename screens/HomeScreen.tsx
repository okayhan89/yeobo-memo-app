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

const SEARCH_HISTORY_KEY = "searchHistory";
const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const COLUMN_COUNT = 2;
const CARD_WIDTH =
  (width - 32 - (COLUMN_COUNT - 1) * CARD_MARGIN) / COLUMN_COUNT;

const MemoCard = ({ item, navigation, toggleFavorite, deleteMemo }) => {
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
          onPress={deleteMemo}
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
            {item.title || "제목 없음"}
          </Text>
          
          {item.items && item.items.length > 0 ? (
            <View style={styles.memoContentContainer}>
              <View style={styles.itemsPreview}>
                {item.items.slice(0, 3).map((listItem, index) => (
                  <Text 
                    key={index}
                    style={[
                      styles.previewItem, 
                      listItem.checked && styles.checkedItem
                    ]}
                    numberOfLines={1}
                  >
                    • {listItem.name}
                  </Text>
                ))}
                {item.items.length > 3 && (
                  <Text style={styles.moreItems}>
                    외 {item.items.length - 3}개 항목...
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.memoSummary}>내용 없음</Text>
          )}
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
    // 삭제된 메모 구조를 더 명확하게 저장합니다
    const memoToStore = {
      ...memo,
      // 삭제하기 전의 원래 제목을 보존합니다
      originalTitle: typeof memo.title === 'string' ? memo.title : "",
      // 삭제된 메모 표시는 새로운 삭제 타이틀로 설정합니다
      deletedTitle: `삭제된 메모 (${new Date().toLocaleTimeString()})`,
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
      // Restore only the most recently deleted memo
      const memoToRestore = {
        ...deletedMemos[0],
        // 원래 제목으로 복원
        title: deletedMemos[0].originalTitle || ""
      };
      restoreMemo(memoToRestore);
      
      // Remove it from the deleted memos array
      setDeletedMemos(prev => prev.slice(1));
      setShowUndo(false);
    }
  };

  // Full undo from action menu - can restore any deleted memo
  const handleRestoreMemo = (index) => {
    if (deletedMemos.length > index) {
      // Restore the selected memo
      const memoToRestore = {
        ...deletedMemos[index],
        // 원래 제목으로 복원
        title: deletedMemos[index].originalTitle || ""
      };
      restoreMemo(memoToRestore);
      
      // Remove it from the deleted memos array
      setDeletedMemos(prev => prev.filter((_, i) => i !== index));
      
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
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="메모 검색"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => updateSearchHistory(search)}
          style={styles.searchInput}
        />
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={[
              styles.segmentButton,
              filter === "all" && styles.activeSegment
            ]}
          >
            <Text style={[
              styles.segmentText,
              filter === "all" && styles.activeSegmentText
            ]}>전체</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("favorite")}
            style={[
              styles.segmentButton,
              filter === "favorite" && styles.activeSegment
            ]}
          >
            <Text style={[
              styles.segmentText,
              filter === "favorite" && styles.activeSegmentText
            ]}>⭐</Text>
          </TouchableOpacity>
        </View>
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
            deleteMemo={() => handleDeleteMemo(item)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {filter === "favorite" ? (
              <>
                <Text style={styles.emptyIcon}>⭐</Text>
                <Text style={styles.emptyText}>
                  즐겨찾기된 메모가 없습니다
                </Text>
                <Text style={styles.emptySubtext}>
                  메모의 ⭐ 버튼을 눌러 즐겨찾기를 추가해보세요
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>메모장을 추가해보세요!</Text>
              </>
            )}
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />

      {/* Undo Toast Notification - only for most recent deletion */}
      {showUndo && (
        <Animated.View 
          style={[
            styles.undoContainer,
            { opacity: undoOpacity }
          ]}
        >
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
                  <Text style={styles.actionSectionTitle}>최근 삭제된 메모</Text>
                  <Text style={styles.actionSectionCount}>
                    {deletedMemos.length}/10
                  </Text>
                </View>
                <Text style={styles.actionSectionDescription}>
                  최대 10개까지 복구 가능합니다
                </Text>
                <ScrollView 
                  style={[styles.deletedMemosScrollBase, deletedMemos.length > 3 ? styles.deletedMemosScroll : null]}
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
                            (!memo.originalTitle || memo.originalTitle.trim() === '') && {fontStyle: 'italic', color: '#adb5bd'}
                          ]} 
                          numberOfLines={1}
                        >
                          {memo.originalTitle ? memo.originalTitle : "(제목 없음)"}
                        </Text>
                        <Text style={styles.actionButtonSubtext}>
                          {new Date(memo.updatedAt || memo.createdAt).toLocaleTimeString()}
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
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  searchContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    fontSize: 16,
    zIndex: 1,
    color: '#adb5bd',
  },
  searchInput: {
    flex: 1,
    padding: 15,
    paddingLeft: 42,
    fontSize: 15,
    borderRightWidth: 1,
    borderRightColor: '#f1f3f5',
  },
  segmentedControl: {
    flexDirection: 'row',
    paddingLeft: 8,
    paddingRight: 8,
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  activeSegment: {
    borderBottomWidth: 2,
    borderBottomColor: '#4dabf7',
  },
  segmentText: {
    fontSize: 13,
    color: '#868e96',
  },
  activeSegmentText: {
    fontWeight: '600',
    color: '#343a40',
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
    lineHeight: 32,
    textAlign: "center",
    marginTop: -2,
  },
  memoContentContainer: {
    marginTop: 4,
  },
  itemsPreview: {
    marginTop: 2,
  },
  previewItem: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 1,
  },
  checkedItem: {
    textDecorationLine: 'line-through',
    color: '#adb5bd',
  },
  moreItems: {
    fontSize: 11,
    color: '#adb5bd',
    fontStyle: 'italic',
    marginTop: 2,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
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
    fontSize: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#868e96",
    textAlign: "center",
  },
});

