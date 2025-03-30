import React, { createContext, useState, useEffect } from "react";
import uuid from "react-native-uuid";
import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const MemoContext = createContext();

export const MemoProvider = ({ children }) => {
  const [memos, setMemos] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  // 🔄 메모 불러오기
  useEffect(() => {
    const loadMemos = async () => {
      const saved = await AsyncStorage.getItem("memos");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setMemos(parsed);
        } catch (e) {
          console.error("메모 불러오기 실패", e);
        }
      }
    };
    loadMemos();
  }, []);

  // 🔄 최근 항목 불러오기
  useEffect(() => {
    const loadRecentItems = async () => {
      const saved = await AsyncStorage.getItem("recentItems");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setRecentItems(parsed);
        } catch (e) {
          console.error("최근 항목 불러오기 실패", e);
        }
      }
    };
    loadRecentItems();
  }, []);

  // 💾 저장
  useEffect(() => {
    AsyncStorage.setItem("memos", JSON.stringify(memos));
  }, [memos]);

  useEffect(() => {
    AsyncStorage.setItem("recentItems", JSON.stringify(recentItems));
  }, [recentItems]);

  const createMemo = () => {
    const newMemo = {
      id: uuid.v4(),
      title: `새 메모장 ${memos.length + 1}`,
      items: [],
      pinned: false,
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMemos([...memos, newMemo]);
  };

  const deleteMemo = (memoId) => {
    setMemos((prev) => prev.filter((memo) => memo.id !== memoId));
  };

  const addItemToMemo = (memoId, itemName) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) =>
        memo.id === memoId
          ? {
              ...memo,
              items: [
                ...memo.items,
                { id: uuid.v4(), name: itemName, checked: false },
              ],
              updatedAt: new Date().toISOString(),
            }
          : memo
      )
    );
    setRecentItems((prev) => {
      if (!prev.includes(itemName)) {
        return [itemName, ...prev.slice(0, 19)];
      }
      return prev;
    });
  };

  const toggleItemChecked = (memoId, itemId) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) => {
        if (memo.id !== memoId) return memo;
        return {
          ...memo,
          items: memo.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteItemFromMemo = (memoId, itemId) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) =>
        memo.id === memoId
          ? {
              ...memo,
              items: memo.items.filter((item) => item.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          : memo
      )
    );
  };

  const renameItemInMemo = (memoId, itemId, newName) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) => {
        if (memo.id !== memoId) return memo;
        return {
          ...memo,
          items: memo.items.map((item) =>
            item.id === itemId ? { ...item, name: newName } : item
          ),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const renameMemo = (memoId, newTitle) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) =>
        memo.id === memoId
          ? { ...memo, title: newTitle, updatedAt: new Date().toISOString() }
          : memo
      )
    );
  };

  const pinMemo = (memoId, pinned) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) =>
        memo.id === memoId
          ? { ...memo, pinned, updatedAt: new Date().toISOString() }
          : memo
      )
    );
  };

  const toggleFavorite = (memoId) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) =>
        memo.id === memoId
          ? {
              ...memo,
              favorite: !memo.favorite,
              updatedAt: new Date().toISOString(),
            }
          : memo
      )
    );
  };

  const getMemoText = (memoId) => {
    const memo = memos.find((m) => m.id === memoId);
    if (!memo) return "";

    const header = `📝 ${memo.title}\n`;
    const itemLines = memo.items.map((item) => {
      const check = item.checked ? "[x]" : "[ ]";
      return `${check} ${item.name}`;
    });
    return header + itemLines.join("\n");
  };

  const shareMemo = (memoId) => {
    const fullText = getMemoText(memoId);
    if (!fullText) return;

    Clipboard.setStringAsync(fullText);
    Alert.alert("복사됨", "메모가 클립보드에 복사되었어요!");
  };

  return (
    <MemoContext.Provider
      value={{
        memos,
        createMemo,
        deleteMemo,
        addItemToMemo,
        toggleItemChecked,
        deleteItemFromMemo,
        renameItemInMemo,
        renameMemo,
        pinMemo,
        toggleFavorite,
        recentItems,
        shareMemo,
        getMemoText,
      }}
    >
      {children}
    </MemoContext.Provider>
  );
};
