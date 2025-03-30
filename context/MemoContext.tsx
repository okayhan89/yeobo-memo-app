import React, { createContext, useState, useEffect } from "react";
import uuid from "react-native-uuid";
import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";

export const MemoContext = createContext();

export const MemoProvider = ({ children }) => {
  const [memos, setMemos] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  // ⏱ 자동 고정 해제 (3일 이상 지난 메모)
  useEffect(() => {
    const now = new Date();
    setMemos((prev) =>
      prev.map((memo) => {
        if (
          memo.pinned &&
          memo.updatedAt &&
          new Date(memo.updatedAt) <
            new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        ) {
          return { ...memo, pinned: false };
        }
        return memo;
      })
    );
  }, []);

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
        return [itemName, ...prev];
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
