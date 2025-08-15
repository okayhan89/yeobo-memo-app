import React, { createContext, useState, useEffect } from "react";
import uuid from "react-native-uuid";
import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WidgetManager from "../utils/WidgetManager";

export interface MemoItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface Memo {
  id: string;
  title: string;
  items: MemoItem[];
  pinned: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoContextType {
  memos: Memo[];
  createMemo: () => string;
  deleteMemo: (memoId: string) => void;
  addItemToMemo: (memoId: string, itemName: string) => void;
  toggleItemChecked: (memoId: string, itemId: string) => void;
  deleteItemFromMemo: (memoId: string, itemId: string) => void;
  renameItemInMemo: (memoId: string, itemId: string, newName: string) => void;
  renameMemo: (memoId: string, newTitle: string) => void;
  pinMemo: (memoId: string, pinned: boolean) => void;
  toggleFavorite: (memoId: string) => void;
  recentItems: string[];
  shareMemo: (memoId: string) => void;
  getMemoText: (memoId: string) => string;
  restoreMemo: (memo: Memo) => void;
  // 위젯 관련 기능
  createWidgetForMemo: (memoId: string) => Promise<boolean>;
  getWidgetCountForMemo: (memoId: string) => Promise<number>;
  refreshAllWidgets: () => Promise<void>;
}

export const MemoContext = createContext<MemoContextType>(
  {} as MemoContextType
);

export const MemoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [recentItems, setRecentItems] = useState<string[]>([]);

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
    const newId = uuid.v4();
    const newMemo = {
      id: newId,
      title: ``,
      items: [],
      pinned: false,
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMemos([...memos, newMemo]);
    return newId;
  };

  const deleteMemo = (memoId) => {
    setMemos((prev) => prev.filter((memo) => memo.id !== memoId));
  };

  const restoreMemo = (memo) => {
    setMemos((prev) => [...prev, memo]);
  };

  // 🔗 위젯 관련 함수들
  const createWidgetForMemo = async (memoId: string): Promise<boolean> => {
    const memo = memos.find(m => m.id === memoId);
    if (!memo) {
      Alert.alert("오류", "메모를 찾을 수 없습니다.");
      return false;
    }

    try {
      const widgetId = await WidgetManager.createWidgetForMemo(memo);
      if (widgetId) {
        Alert.alert(
          "위젯 생성 완료", 
          `"${memo.title || '제목 없음'}" 메모의 위젯이 생성되었습니다.\n\n홈 화면에서 위젯을 추가해보세요!`,
          [{ text: "확인" }]
        );
        return true;
      } else {
        Alert.alert("오류", "위젯 생성에 실패했습니다.");
        return false;
      }
    } catch (error) {
      console.error("위젯 생성 오류:", error);
      Alert.alert("오류", "위젯 생성 중 오류가 발생했습니다.");
      return false;
    }
  };

  const getWidgetCountForMemo = async (memoId: string): Promise<number> => {
    try {
      return await WidgetManager.getWidgetCountForMemo(memoId);
    } catch (error) {
      console.error("위젯 개수 확인 오류:", error);
      return 0;
    }
  };

  const refreshAllWidgets = async (): Promise<void> => {
    try {
      await WidgetManager.refreshAllWidgets(memos);
    } catch (error) {
      console.error("위젯 새로고침 오류:", error);
    }
  };

  // 메모 변경 시 위젯 자동 업데이트
  useEffect(() => {
    const updateWidgets = async () => {
      try {
        await WidgetManager.refreshAllWidgets(memos);
      } catch (error) {
        console.error("위젯 자동 업데이트 오류:", error);
      }
    };

    if (memos.length > 0) {
      updateWidgets();
    }
  }, [memos]);

  const addItemToMemo = (memoId, itemName) => {
    setMemos((prevMemos) =>
      prevMemos.map((memo) =>
        memo.id === memoId
          ? {
              ...memo,
              items: [
                { id: uuid.v4(), name: itemName, checked: false },
                ...memo.items,
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

        // 해당 항목과 그 상태를 찾기
        const targetItem = memo.items.find((item) => item.id === itemId);
        if (!targetItem) return memo;

        // 항목의 새로운 체크 상태 (토글 후)
        const newCheckedState = !targetItem.checked;

        if (newCheckedState) {
          // 항목이 체크되는 경우 (미완료 -> 완료)
          // 1. 해당 항목을 기존 목록에서 제거
          const otherItems = memo.items.filter((item) => item.id !== itemId);
          // 2. 체크된 항목들과 체크되지 않은 항목들 분리
          const checkedItems = otherItems.filter((item) => item.checked);
          const uncheckedItems = otherItems.filter((item) => !item.checked);
          // 3. 체크된 항목의 맨 앞에 새로 체크된 항목 추가
          const updatedItems = [
            ...uncheckedItems,
            { ...targetItem, checked: true },
            ...checkedItems,
          ];

          return {
            ...memo,
            items: updatedItems,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // 항목이 체크 해제되는 경우 (완료 -> 미완료)
          // 위치를 변경할 필요 없이 상태만 업데이트
          return {
            ...memo,
            items: memo.items.map((item) =>
              item.id === itemId ? { ...item, checked: false } : item
            ),
            updatedAt: new Date().toISOString(),
          };
        }
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
        restoreMemo,
        createWidgetForMemo,
        getWidgetCountForMemo,
        refreshAllWidgets,
      }}
    >
      {children}
    </MemoContext.Provider>
  );
};
