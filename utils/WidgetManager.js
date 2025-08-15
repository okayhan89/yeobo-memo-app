import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WidgetManager {
  constructor() {
    this.WIDGET_STORAGE_KEY = 'widget_memo_mappings';
  }

  // 위젯-메모 매핑 정보 저장/로드
  async getWidgetMappings() {
    try {
      const mappings = await AsyncStorage.getItem(this.WIDGET_STORAGE_KEY);
      return mappings ? JSON.parse(mappings) : {};
    } catch (error) {
      console.error('위젯 매핑 정보 로드 실패:', error);
      return {};
    }
  }

  async saveWidgetMapping(widgetId, memoId) {
    try {
      const mappings = await this.getWidgetMappings();
      mappings[widgetId] = memoId;
      await AsyncStorage.setItem(this.WIDGET_STORAGE_KEY, JSON.stringify(mappings));
      return true;
    } catch (error) {
      console.error('위젯 매핑 정보 저장 실패:', error);
      return false;
    }
  }

  async removeWidgetMapping(widgetId) {
    try {
      const mappings = await this.getWidgetMappings();
      delete mappings[widgetId];
      await AsyncStorage.setItem(this.WIDGET_STORAGE_KEY, JSON.stringify(mappings));
      return true;
    } catch (error) {
      console.error('위젯 매핑 정보 삭제 실패:', error);
      return false;
    }
  }

  // 메모별 위젯 생성
  async createWidgetForMemo(memo) {
    if (Platform.OS === 'android') {
      return this.createAndroidWidget(memo);
    } else if (Platform.OS === 'ios') {
      return this.createIOSWidget(memo);
    } else {
      console.log('위젯은 안드로이드와 iOS에서만 지원됩니다.');
      return false;
    }
  }

  // 안드로이드 위젯 생성
  async createAndroidWidget(memo) {
    try {
      // 위젯 ID 생성 (현재 시간 기반)
      const widgetId = Date.now().toString();
      
      // 위젯 데이터 준비
      const widgetData = this.prepareWidgetData(memo);
      
      // 위젯 매핑 저장
      await this.saveWidgetMapping(widgetId, memo.id);
      
      // 안드로이드 SharedPreferences에 데이터 저장
      await this.updateWidgetData(widgetId, widgetData);
      
      console.log(`메모 "${memo.title}" 위젯이 생성되었습니다. (ID: ${widgetId})`);
      return widgetId;
    } catch (error) {
      console.error('위젯 생성 실패:', error);
      return false;
    }
  }

  // iOS 위젯 생성
  async createIOSWidget(memo) {
    try {
      // iOS는 시스템 위젯 설정을 통해 추가하므로 직접 생성하지 않음
      // 대신 UserDefaults에 데이터를 저장하여 위젯이 읽을 수 있도록 함
      const widgetId = Date.now().toString();
      
      // App Group UserDefaults에 데이터 저장
      await this.updateIOSWidgetData(memo);
      
      // 위젯 매핑 저장
      await this.saveWidgetMapping(widgetId, memo.id);
      
      console.log(`iOS 메모 "${memo.title}" 위젯 데이터가 준비되었습니다.`);
      return widgetId;
    } catch (error) {
      console.error('iOS 위젯 생성 실패:', error);
      return false;
    }
  }

  // iOS 위젯 데이터 업데이트
  async updateIOSWidgetData(memo) {
    try {
      // UserDefaults에 저장할 데이터 준비
      const title = memo.title || '제목 없음';
      const items = memo.items ? memo.items.map(item => item.name) : [];
      
      // AsyncStorage에 임시 저장 (실제로는 네이티브 모듈 필요)
      await AsyncStorage.setItem('ios_widget_title', title);
      await AsyncStorage.setItem('ios_widget_items', JSON.stringify(items));
      
      // TODO: 실제 구현에서는 네이티브 모듈을 통해 App Group UserDefaults에 저장
      // NativeModules.ExpoWidgets?.setWidgetData(title, JSON.stringify(items));
      
      return true;
    } catch (error) {
      console.error('iOS 위젯 데이터 업데이트 실패:', error);
      return false;
    }
  }

  // 메모 데이터를 위젯 형식으로 변환
  prepareWidgetData(memo) {
    return {
      id: memo.id,
      title: memo.title || '제목 없음',
      items: memo.items ? memo.items.slice(0, 5).map(item => ({
        id: item.id,
        name: item.name,
        checked: item.checked || false
      })) : [],
      updatedAt: memo.updatedAt || new Date().toISOString(),
      totalItems: memo.items ? memo.items.length : 0
    };
  }

  // 위젯 데이터 업데이트
  async updateWidgetData(widgetId, data) {
    if (Platform.OS !== 'android') return false;

    try {
      // SharedPreferences에 저장할 키
      const key = `yeobo_memo_widget_prefs`;
      const dataKey = `memo_data_${widgetId}`;
      
      // AsyncStorage를 통해 데이터 저장 (실제로는 네이티브 모듈이 필요)
      await AsyncStorage.setItem(`widget_${widgetId}`, JSON.stringify(data));
      
      // TODO: 실제 구현에서는 네이티브 모듈을 통해 안드로이드 SharedPreferences에 저장
      // NativeModules.WidgetModule?.updateWidget(widgetId, data);
      
      return true;
    } catch (error) {
      console.error('위젯 데이터 업데이트 실패:', error);
      return false;
    }
  }

  // 메모 변경 시 관련 위젯들 업데이트
  async updateWidgetsForMemo(memo) {
    try {
      const mappings = await this.getWidgetMappings();
      const widgetIds = Object.keys(mappings).filter(widgetId => mappings[widgetId] === memo.id);
      
      const widgetData = this.prepareWidgetData(memo);
      
      for (const widgetId of widgetIds) {
        await this.updateWidgetData(widgetId, widgetData);
      }
      
      console.log(`메모 "${memo.title}"에 대한 ${widgetIds.length}개 위젯이 업데이트되었습니다.`);
      return true;
    } catch (error) {
      console.error('위젯 업데이트 실패:', error);
      return false;
    }
  }

  // 메모 삭제 시 관련 위젯들 정리
  async removeWidgetsForMemo(memoId) {
    try {
      const mappings = await this.getWidgetMappings();
      const widgetIds = Object.keys(mappings).filter(widgetId => mappings[widgetId] === memoId);
      
      for (const widgetId of widgetIds) {
        await this.removeWidgetMapping(widgetId);
        await AsyncStorage.removeItem(`widget_${widgetId}`);
      }
      
      console.log(`메모 삭제로 인해 ${widgetIds.length}개 위젯이 정리되었습니다.`);
      return true;
    } catch (error) {
      console.error('위젯 정리 실패:', error);
      return false;
    }
  }

  // 메모에 연결된 위젯 개수 확인
  async getWidgetCountForMemo(memoId) {
    try {
      const mappings = await this.getWidgetMappings();
      return Object.values(mappings).filter(id => id === memoId).length;
    } catch (error) {
      console.error('위젯 개수 확인 실패:', error);
      return 0;
    }
  }

  // 모든 위젯 새로고침
  async refreshAllWidgets(memos) {
    try {
      const mappings = await this.getWidgetMappings();
      
      for (const [widgetId, memoId] of Object.entries(mappings)) {
        const memo = memos.find(m => m.id === memoId);
        if (memo) {
          const widgetData = this.prepareWidgetData(memo);
          await this.updateWidgetData(widgetId, widgetData);
        } else {
          // 메모가 없으면 위젯 매핑 제거
          await this.removeWidgetMapping(widgetId);
        }
      }
      
      console.log('모든 위젯이 새로고침되었습니다.');
      return true;
    } catch (error) {
      console.error('위젯 새로고침 실패:', error);
      return false;
    }
  }
}

export default new WidgetManager();