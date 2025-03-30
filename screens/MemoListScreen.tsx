// screens/MemoListScreen.tsx
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { MemoContext } from "../context/MemoContext";

const MemoFooter = ({
  input,
  setInput,
  handleAddItem,
  filteredSuggestions,
  shareMemo,
  memoId,
  getMemoText,
}) => (
  <>
    {filteredSuggestions.length > 0 && (
      <View style={styles.suggestionBox}>
        {filteredSuggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            onPress={() => setInput(suggestion)}
          >
            <Text style={styles.suggestionItem}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}

    <View style={styles.inputContainer}>
      <TextInput
        placeholder="품목을 입력하세요"
        value={input}
        onChangeText={setInput}
        style={styles.input}
      />
      <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
        <Text style={styles.addButtonText}>추가</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={styles.shareButton}
      onPress={() => shareMemo(memoId)}
    >
      <Text style={styles.shareButtonText}>📤 메모 공유하기</Text>
    </TouchableOpacity>

    <Text style={styles.previewTitle}>📋 미리보기</Text>
    <View style={styles.previewBox}>
      <Text style={styles.previewText}>{getMemoText(memoId)}</Text>
    </View>
  </>
);

const MemoListScreen = () => {
  const route = useRoute();
  const { memoId } = route.params;
  const {
    memos,
    addItemToMemo,
    toggleItemChecked,
    deleteItemFromMemo,
    renameItemInMemo,
    recentItems,
    shareMemo,
    getMemoText,
    renameMemo,
    pinMemo,
  } = useContext(MemoContext);

  const [input, setInput] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemInput, setItemInput] = useState("");

  const currentMemo = memos.find((memo) => memo.id === memoId);
  const [isPinned, setIsPinned] = useState(currentMemo?.pinned || false);

  const checkedCount = currentMemo?.items.filter((i) => i.checked).length || 0;
  const totalCount = currentMemo?.items.length || 0;
  const percentage =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const togglePin = () => {
    setIsPinned(!isPinned);
    pinMemo(memoId, !isPinned);
  };

  const handleAddItem = () => {
    if (input.trim()) {
      addItemToMemo(memoId, input.trim());
      setInput("");
    }
  };

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      renameMemo(memoId, titleInput.trim());
      setEditingTitle(false);
    }
  };

  const handleItemRename = (itemId) => {
    if (itemInput.trim()) {
      renameItemInMemo(memoId, itemId, itemInput.trim());
      setEditingItemId(null);
      setItemInput("");
    }
  };

  const filteredSuggestions = recentItems.filter(
    (item) =>
      input &&
      item.toLowerCase().includes(input.toLowerCase()) &&
      !currentMemo.items.some((i) => i.name === item)
  );

  return (
    <View style={styles.container}>
      {editingTitle ? (
        <TextInput
          value={titleInput}
          onChangeText={setTitleInput}
          onSubmitEditing={handleTitleSubmit}
          onBlur={() => setEditingTitle(false)}
          style={styles.titleInput}
          placeholder="메모 제목 입력"
          autoFocus
        />
      ) : (
        <View style={styles.titleRow}>
          <TouchableOpacity
            onLongPress={() => {
              setTitleInput(currentMemo?.title || "");
              setEditingTitle(true);
            }}
            style={{ flex: 1 }}
          >
            <Text style={styles.title}>{currentMemo?.title}</Text>
            <Text style={styles.progressText}>
              ✅ 완료율: {percentage}% ({checkedCount}/{totalCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePin} style={styles.pinButton}>
            <Text style={styles.pinText}>{isPinned ? "📌" : "📍"}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={currentMemo?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            {editingItemId === item.id ? (
              <TextInput
                value={itemInput}
                onChangeText={setItemInput}
                onSubmitEditing={() => handleItemRename(item.id)}
                onBlur={() => setEditingItemId(null)}
                style={styles.itemEditInput}
                autoFocus
              />
            ) : (
              <TouchableOpacity
                onLongPress={() => {
                  setEditingItemId(item.id);
                  setItemInput(item.name);
                }}
                onPress={() => toggleItemChecked(memoId, item.id)}
                style={{ flex: 1 }}
              >
                <Text
                  style={[styles.itemText, item.checked && styles.checkedText]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => deleteItemFromMemo(memoId, item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>쇼핑 목록을 추가해보세요.</Text>
        }
        ListFooterComponent={
          <MemoFooter
            input={input}
            setInput={setInput}
            handleAddItem={handleAddItem}
            filteredSuggestions={filteredSuggestions}
            shareMemo={shareMemo}
            memoId={memoId}
            getMemoText={getMemoText}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

export default MemoListScreen;

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  pinButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinText: {
    fontSize: 20,
  },
  progressText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    paddingBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  itemText: {
    fontSize: 18,
  },
  itemEditInput: {
    flex: 1,
    fontSize: 18,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 4,
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  suggestionBox: {
    backgroundColor: "#f4f4f4",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  suggestionItem: {
    paddingVertical: 6,
    fontSize: 16,
    color: "#555",
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  shareButton: {
    backgroundColor: "#34C759",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  previewTitle: {
    marginTop: 30,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  previewBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
  deleteText: {
    fontSize: 16,
    color: "#ff3b30",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButton: {
    backgroundColor: "#ffecec",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
