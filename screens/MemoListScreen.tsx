// screens/MemoListScreen.tsx
import React, { useContext, useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Linking,
  Image,
  ActivityIndicator,
  Animated,
  BackHandler,
  Share,
  ToastAndroid,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRoute, RouteProp, useNavigation, useFocusEffect } from "@react-navigation/native";
import { MemoContext, Memo } from "../context/MemoContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface RouteParams {
  memoId: string;
}

interface MemoFooterProps {
  input: string;
  setInput: (text: string) => void;
  handleAddItem: () => void;
  filteredSuggestions: string[];
  shareMemo: (memoId: string) => void;
  memoId: string;
  getMemoText: (memoId: string) => string;
  inputRef: React.RefObject<TextInput>;
}

// 공유 미리보기 모달
const SharePreviewModal = ({ visible, content, onClose }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>공유 텍스트 미리보기</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{content}</Text>
        </View>
        <Text style={styles.modalInfo}>
          텍스트가 클립보드에 복사되었습니다.
        </Text>
        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// 이미지 인식 결과 표시 모달
const ImageAnalysisModal = ({ visible, onClose, results, onUseResult }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>이미지 분석 결과</Text>

        <View style={styles.analysisResults}>
          {results.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.analysisItem}
              onPress={() => onUseResult(item)}
            >
              <Text style={styles.analysisItemText}>{item}</Text>
              <Text style={styles.analysisItemAction}>사용</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.modalInfo}>
          인식된 항목을 탭하면 직접 사용할 수 있습니다
        </Text>

        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// 이미지 캡처/선택 모달
const ImagePickerModal = ({ visible, onClose, onImageSelected }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.imagePickerContainer}>
          <Text style={styles.modalTitle}>이미지 추가</Text>

          <View style={styles.imagePickerOptions}>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => {
                // 실제 구현에서는 카메라 접근 코드 필요
                // ImagePicker.launchCamera()
                Alert.alert("카메라", "카메라 기능이 실행됩니다.");
                onImageSelected({
                  uri: "https://picsum.photos/200",
                  name: "상품 이미지",
                });
              }}
            >
              <Text style={styles.imagePickerOptionIcon}>📷</Text>
              <Text style={styles.imagePickerOptionText}>카메라</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => {
                // 실제 구현에서는 갤러리 접근 코드 필요
                // ImagePicker.launchImageLibrary()
                Alert.alert("갤러리", "갤러리 접근 기능이 실행됩니다.");
                onImageSelected({
                  uri: "https://picsum.photos/200",
                  name: "갤러리 이미지",
                });
              }}
            >
              <Text style={styles.imagePickerOptionIcon}>🖼️</Text>
              <Text style={styles.imagePickerOptionText}>갤러리</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// 스마트 추천 모달
const AIRecommendationModal = ({
  visible,
  onClose,
  recommendations,
  onUseRecommendation,
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.recommendationContainer}>
        <Text style={styles.modalTitle}>AI 추천 항목</Text>

        <View style={styles.recommendationCategories}>
          <TouchableOpacity
            style={[styles.categoryTab, styles.activeCategoryTab]}
          >
            <Text style={styles.activeCategoryText}>자주 함께 구매</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryTab}>
            <Text style={styles.categoryText}>계절 상품</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryTab}>
            <Text style={styles.categoryText}>최근 소진</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recommendationList}>
          {recommendations.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recommendationItem}
              onPress={() => onUseRecommendation(item.name)}
            >
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationName}>{item.name}</Text>
                <Text style={styles.recommendationReason}>{item.reason}</Text>
              </View>
              <View style={styles.recommendationAction}>
                <Text style={styles.recommendationActionText}>추가</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.modalInfo}>
          AI가 분석한 패턴 기반 추천 항목입니다
        </Text>

        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// 음성 인식 모달
const VoiceRecognitionModal = ({ visible, onClose, onResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [results, setResults] = useState([]);
  const [processingVoice, setProcessingVoice] = useState(false);

  // 애니메이션 값
  const [pulseAnim] = useState(new Animated.Value(1));

  // 녹음 애니메이션
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.setValue(1);
    };
  }, [isRecording, pulseAnim]);

  // 녹음 시작/중지
  const toggleRecording = () => {
    if (isRecording) {
      // 녹음 중지 처리
      setIsRecording(false);
      setProcessingVoice(true);

      // 음성 인식 API 호출 시뮬레이션
      setTimeout(() => {
        const simulatedResults = ["우유 두 개", "빵 한 봉지", "사과 다섯 개"];
        setResults(simulatedResults);
        setProcessingVoice(false);
      }, 1500);
    } else {
      // 녹음 시작
      setIsRecording(true);
      setResults([]);
    }
  };

  // 인식 결과 선택
  const selectResult = (result) => {
    onResult(result);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.voiceContainer}>
          <Text style={styles.modalTitle}>
            {isRecording
              ? "말씀해주세요..."
              : processingVoice
              ? "인식 중..."
              : "음성으로 품목 추가"}
          </Text>

          {isRecording && (
            <Text style={styles.recordingHint}>추가할 항목을 말씀해주세요</Text>
          )}

          {processingVoice ? (
            <ActivityIndicator
              size="large"
              color="#4dabf7"
              style={styles.voiceIndicator}
            />
          ) : (
            <TouchableOpacity
              onPress={toggleRecording}
              style={styles.micButton}
            >
              <Animated.View
                style={[
                  styles.micButtonInner,
                  isRecording && styles.micButtonRecording,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.micIcon}>🎤</Text>
              </Animated.View>
            </TouchableOpacity>
          )}

          {results.length > 0 && (
            <>
              <Text style={styles.resultsTitle}>인식 결과:</Text>
              <View style={styles.voiceResults}>
                {results.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.voiceResultItem}
                    onPress={() => selectResult(result)}
                  >
                    <Text style={styles.voiceResultText}>{result}</Text>
                    <Text style={styles.voiceResultSelect}>선택</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.modalButton, { marginTop: 16 }]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// URL 감지 정규식
const URL_REGEX = /(https?:\/\/[^\s]+)/;

const MemoFooter = ({
  input,
  setInput,
  handleAddItem,
  filteredSuggestions,
  memoId,
  inputRef,
}: {
  input: string;
  setInput: (text: string) => void;
  handleAddItem: () => void;
  filteredSuggestions: string[];
  memoId?: string;
  inputRef: React.RefObject<TextInput>;
}) => {
  const [isDetectingUrl, setIsDetectingUrl] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState("");
  const [urlPreview, setUrlPreview] = useState<null | {
    title: string;
    price?: string;
  }>(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<null | {
    uri: string;
    name: string;
  }>(null);

  // 이미지 인식 관련 상태 추가
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string[]>([]);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

  // AI 추천 관련 상태
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);

  // 음성 인식 관련 상태
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  // 키보드 표시 상태를 추적하는 변수 추가
  const [keyboardHidden, setKeyboardHidden] = useState(false);

  // 키보드 표시/숨김 이벤트 리스너 추가
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardHidden(false);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHidden(true);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // URL 감지 및 메타데이터 추출 기능
  useEffect(() => {
    if (URL_REGEX.test(input)) {
      const url = input.match(URL_REGEX)?.[0] || "";
      setDetectedUrl(url);
      setIsDetectingUrl(true);

      // 실제 구현에서는 서버 API를 호출하여 URL의 메타데이터를 가져와야 합니다
      // 여기서는 데모를 위해 간단한 예시만 보여줍니다
      setTimeout(() => {
        // 메타데이터 추출 시뮬레이션 (실제로는 서버 API 호출)
        setUrlPreview({
          title: "상품명: " + url.substring(8, 20) + "...",
          price: "가격: 미정",
        });
        setIsDetectingUrl(false);
      }, 500);
    } else {
      setDetectedUrl("");
      setUrlPreview(null);
    }
  }, [input]);

  const handleUseUrlInfo = () => {
    if (urlPreview) {
      setInput(urlPreview.title);
      setUrlPreview(null);
    }
  };

  const handleImageSelected = (image) => {
    setSelectedImage(image);
    setImagePickerVisible(false);
    setInput(image.name); // 이미지 이름을 품목명으로 설정

    // 이미지 분석 시작
    analyzeImage(image.uri);
  };

  // 이미지 분석 함수
  const analyzeImage = (imageUri) => {
    setIsAnalyzingImage(true);

    // 실제 구현에서는 이미지 분석 API를 호출해야 합니다
    // 예: Google Cloud Vision, AWS Rekognition 등
    setTimeout(() => {
      // 데모를 위한 시뮬레이션된 결과
      const simulatedResults = [
        "사과 (95% 확률)",
        "과일 (93% 확률)",
        "레드 디럴리셔스 (88% 확률)",
        "신선 식품 (85% 확률)",
      ];

      setAnalysisResults(simulatedResults);
      setIsAnalyzingImage(false);
      setAnalysisModalVisible(true);
    }, 2000);
  };

  const handleUseAnalysisResult = (result) => {
    // 결과에서 백분율 부분 제거
    const cleanResult = result.replace(/\s*\(\d+%\s*확률\)/, "");
    setInput(cleanResult);
    setAnalysisModalVisible(false);
  };

  // AI 추천 함수
  const getAIRecommendations = () => {
    setIsLoadingRecommendations(true);

    // 실제 구현에서는 서버 AI API 호출
    // 현재 메모의 내용과 이전 구매 이력을 분석하여 추천
    setTimeout(() => {
      // 데모용 시뮬레이션 데이터
      const simulatedRecommendations = [
        {
          name: "우유",
          reason: "빵과 함께 구매한 기록이 많습니다",
        },
        {
          name: "버터",
          reason: "빵 구매 시 자주 함께 구매했습니다",
        },
        {
          name: "오렌지 주스",
          reason: "아침 식사 패턴과 일치합니다",
        },
        {
          name: "계란",
          reason: "지난주에 소진된 것으로 예측됩니다",
        },
        {
          name: "바나나",
          reason: "주 2회 구매 패턴이 감지되었습니다",
        },
      ];

      setAiRecommendations(simulatedRecommendations);
      setIsLoadingRecommendations(false);
      setAiModalVisible(true);
    }, 1500);
  };

  // 추천 항목 사용
  const handleUseRecommendation = (itemName) => {
    setInput(itemName);
    setAiModalVisible(false);
  };

  // 음성 인식 결과 처리
  const handleVoiceResult = (result) => {
    setInput(result);
  };

  return (
    <>
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onImageSelected={handleImageSelected}
      />

      <ImageAnalysisModal
        visible={analysisModalVisible}
        onClose={() => setAnalysisModalVisible(false)}
        results={analysisResults}
        onUseResult={handleUseAnalysisResult}
      />

      <AIRecommendationModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        recommendations={aiRecommendations}
        onUseRecommendation={handleUseRecommendation}
      />

      <VoiceRecognitionModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onResult={handleVoiceResult}
      />

      {filteredSuggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {filteredSuggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => setInput(suggestion)}
              style={styles.suggestionItem}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="항목을 입력하세요"
          value={input}
          onChangeText={setInput}
          style={styles.input}
          ref={inputRef}
        />
        <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
          <Text style={styles.addButtonText}>추가</Text>
        </TouchableOpacity>
      </View>

      {isDetectingUrl && (
        <View style={styles.urlDetectingContainer}>
          <Text style={styles.urlDetectingText}>URL 정보를 가져오는 중...</Text>
        </View>
      )}

      {urlPreview && (
        <View style={styles.urlPreviewContainer}>
          <View style={styles.urlPreviewContent}>
            <Text style={styles.urlPreviewTitle}>{urlPreview.title}</Text>
            {urlPreview.price && (
              <Text style={styles.urlPreviewPrice}>{urlPreview.price}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.urlPreviewButton}
            onPress={handleUseUrlInfo}
          >
            <Text style={styles.urlPreviewButtonText}>정보 사용</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.urlPreviewLinkButton}
            onPress={() => Linking.openURL(detectedUrl)}
          >
            <Text style={styles.urlPreviewLinkText}>링크 열기</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.selectedImage}
            resizeMode="cover"
          />
          {isAnalyzingImage && (
            <View style={styles.imageAnalysisOverlay}>
              <ActivityIndicator size="large" color="#4dabf7" />
              <Text style={styles.imageAnalysisText}>이미지 분석 중...</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputMethodsContainer}>
        <TouchableOpacity
          style={styles.inputMethodButton}
          onPress={() => setImagePickerVisible(true)}
        >
          <Text style={styles.inputMethodIcon}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputMethodButton}>
          <Text style={styles.inputMethodIcon}>🔗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputMethodButton}
          onPress={() => setVoiceModalVisible(true)}
        >
          <Text style={styles.inputMethodIcon}>🎤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputMethodButton}>
          <Text style={styles.inputMethodIcon}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputMethodButton}
          onPress={getAIRecommendations}
        >
          <Text style={styles.inputMethodIcon}>🧠</Text>
          <Text style={styles.inputMethodLabel}>AI 추천</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const MemoListScreen = () => {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const navigation = useNavigation();
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
    toggleFavorite,
    deleteMemo,
  } = useContext(MemoContext);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // 키보드 상태 추적
  const [keyboardHidden, setKeyboardHidden] = useState(false);

  const currentMemo = memos.find((memo) => memo.id === memoId);
  const [isFavorite, setIsFavorite] = useState(currentMemo?.favorite || false);

  // 체크된 항목과 체크되지 않은 항목을 분리
  const uncheckedItems = currentMemo?.items.filter(item => !item.checked) || [];
  const checkedItems = currentMemo?.items.filter(item => item.checked) || [];

  // 메모가 처음 생성되었을 때 제목 편집 모드로 자동 전환
  // 한 번만 실행되도록 ref로 상태 추적
  const initialFocusApplied = useRef(false);
  const memoInputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    if (currentMemo && 
        currentMemo.title === '' && 
        currentMemo.items.length === 0 && 
        !initialFocusApplied.current) {
      setTitleInput('');
      setEditingTitle(true);
      initialFocusApplied.current = true;
    }
  }, [currentMemo]);

  // 키보드 표시/숨김 이벤트 리스너
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardHidden(false);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHidden(true);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // 헤더에 기본 타이틀만 표시
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "메모",
      headerRight: null, // 헤더에서 버튼 제거
    });
  }, [navigation]);

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toggleFavorite(memoId);
  };

  const handleShareMemo = async () => {
    const content = getMemoText(memoId);
    
    try {
      // 클립보드에 복사 (팝업 없이)
      await Clipboard.setStringAsync(content);
      
      // 시스템 공유 다이얼로그만 표시
      await Share.share({
        message: content,
        title: currentMemo?.title || "메모 공유",
      });
      
      // 성공, 취소, 오류 시 어떤 알림이나 모달도 표시하지 않음
    } catch (error) {
      console.error("공유 오류:", error);
      // 오류 발생 시에도 아무것도 표시하지 않음
    }
  };

  const handleTitleSubmit = () => {
    // 제목이 비어있든 아니든 모두 저장하고 편집 모드 종료
    renameMemo(memoId, titleInput.trim());
    setEditingTitle(false);
    
    // 키보드가 명시적으로 숨겨진 경우에는 자동 포커스 이동을 하지 않음
    if (!keyboardHidden) {
      // 제목 입력 후 메모 입력 필드로 포커스 이동
      setTimeout(() => {
        if (memoInputRef.current) {
          memoInputRef.current.focus();
        }
      }, 100);
    }
  };

  // 메모 입력 처리 - 텍스트 변경 시 호출
  const handleNewItemTextChange = (text: string) => {
    // 텍스트 상태만 업데이트하고 항목은 생성하지 않음
    setNewItemText(text);
  };
  
  // 메모 입력 완료 처리 - 포커스를 잃거나 특정 조건에서 호출
  const handleNewItemSubmit = () => {
    if (!newItemText.trim()) return;
    
    const lines = newItemText.trim().split('\n');
    
    // 빈 줄 제거
    const filteredLines = lines.filter(line => line.trim() !== '');
    
    // 기존 항목 모두 제거 (체크된 항목은 유지)
    const itemsToKeep = currentMemo?.items.filter(item => item.checked) || [];
    
    // 새 메모 아이템 구성
    let updatedMemo = { ...currentMemo, items: itemsToKeep };
    
    // 각 줄을 새 항목으로 추가
    filteredLines.forEach(line => {
      if (line.trim()) {
        addItemToMemo(memoId, line.trim());
      }
    });
    
    // 편집 모드 종료
    setIsEditing(false);
  };

  // 새 줄이 추가될 때 자동으로 체크박스를 표시하고 항목으로 변환하는 처리
  const renderMemoInput = () => {
    return (
      <View style={styles.memoInputWithCheckboxes}>
        {/* 체크되지 않은 항목들 표시 */}
        {uncheckedItems.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <TouchableOpacity
              onPress={() => toggleItemChecked(memoId, item.id)}
              style={styles.checkboxTouchable}
            >
              <View style={styles.checkbox}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <Text style={styles.itemText}>{item.name}</Text>
          </View>
        ))}
        
        {/* 새 항목 입력 필드 */}
        <View style={styles.newItemInputRow}>
          <View style={styles.checkboxTouchable}>
            <View style={styles.checkbox}></View>
          </View>
          <TextInput
            ref={memoInputRef}
            style={styles.itemInputField}
            multiline
            value={newItemText}
            onChangeText={handleNewItemTextChange}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Enter') {
                // Prevent default Enter behavior
                if (newItemText.trim()) {
                  // Store the text in a variable first
                  const textToProcess = newItemText;
                  // Clear the input field immediately
                  setNewItemText("");
                  // Then process the text
                  setTimeout(() => {
                    processTextToItems(textToProcess);
                  }, 10);
                } else {
                  // Just clear if empty
                  setNewItemText("");
                }
              }
            }}
            placeholder="새 항목을 입력하세요..."
            autoCapitalize="none"
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={styles.addItemButton}
            onPress={() => {
              if (newItemText.trim()) {
                // Store text in variable first
                const textToProcess = newItemText;
                // Clear input immediately
                setNewItemText("");
                // Then process the text
                setTimeout(() => {
                  processTextToItems(textToProcess);
                }, 10);
              }
            }}
          >
            <Text style={styles.addItemButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {/* 항목 추가 가이드 */}
        <View style={styles.addItemGuide}>
          <Text style={styles.addItemGuideText}>
            항목 입력 후 <Text style={styles.addItemGuideHighlight}>Enter 키</Text>를 누르거나 <Text style={styles.addItemGuideHighlight}>+ 버튼</Text>을 탭하여 항목 추가
          </Text>
        </View>
      </View>
    );
  };

  // 텍스트를 항목으로 처리하는 함수
  const processTextToItems = (text: string) => {
    if (!text.trim()) return;
    
    const lines = text.trim().split('\n');
    
    // 빈 줄 제거
    const filteredLines = lines.filter(line => line.trim() !== '');
    
    // 새로운 항목만 추가하고 기존 항목은 유지
    filteredLines.forEach((line, index) => {
      // 이미 존재하는 항목인지 확인
      const alreadyExists = currentMemo?.items.some(
        item => item.name === line.trim() && !item.checked
      );
      
      // 존재하지 않는 항목만 추가
      if (!alreadyExists && line.trim()) {
        addItemToMemo(memoId, line.trim());
      }
    });
    
    // 입력 필드는 이미 Enter 키 처리 시 비워졌으므로 여기서는 제거
    // setNewItemText("");
    
    // 성공 피드백 - 항목이 추가되었음을 알리는 간단한 알림
    if (Platform.OS === 'android') {
      ToastAndroid.show('항목이 추가되었습니다', ToastAndroid.SHORT);
    }
  };

  // 체크된 항목 렌더링
  const renderCheckedItems = () => {
    if (checkedItems.length === 0) return null;

    return (
      <View style={styles.checkedItemsContainer}>
        <Text style={styles.checkedItemsTitle}>완료된 항목</Text>
        {checkedItems.map((item) => (
          <View key={item.id} style={styles.checkedItemRow}>
            <TouchableOpacity
              onPress={() => toggleItemChecked(memoId, item.id)}
              style={styles.checkboxTouchable}
            >
              <View style={[styles.checkbox, styles.checkboxChecked]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemText, styles.checkedText]}>{item.name}</Text>
            </View>
            <TouchableOpacity
              onPress={() => deleteItemFromMemo(memoId, item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  // 뒤로가기 시 빈 메모 삭제
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (currentMemo && (!currentMemo.title || currentMemo.title.trim() === '') && (!currentMemo.items || currentMemo.items.length === 0)) {
          // 제목과 항목이 모두 없는 빈 메모인 경우 삭제
          deleteMemo(memoId);
          console.log("빈 메모가 삭제되었습니다:", memoId);
        }
        return false; // 기본 뒤로가기 동작 허용
      };

      // 안드로이드 하드웨어 뒤로가기 버튼 처리
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      // 화면 이탈 감지
      const unsubscribe = navigation.addListener('beforeRemove', () => {
        onBackPress();
      });

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        unsubscribe();
      };
    }, [currentMemo, memoId, deleteMemo, navigation])
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            {editingTitle ? (
              <TextInput
                value={titleInput}
                onChangeText={setTitleInput}
                onSubmitEditing={handleTitleSubmit}
                onBlur={handleTitleSubmit}
                style={styles.titleInput}
                placeholder="제목을 입력하세요"
                autoFocus
                blurOnSubmit={true}
              />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setTitleInput(currentMemo?.title || "");
                  setEditingTitle(true);
                }}
                style={styles.titleTextContainer}
              >
                <Text style={styles.titleText}>
                  {currentMemo?.title ? currentMemo.title : "제목 없음"}
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.titleActions}>
              <TouchableOpacity
                onPress={handleToggleFavorite}
                style={styles.titleActionButton}
              >
                <Text style={styles.titleActionIcon}>{isFavorite ? "⭐" : "☆"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareMemo}
                style={styles.titleActionButton}
              >
                <Text style={styles.titleActionIcon}>⇧</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <KeyboardAwareScrollView 
          style={styles.mainScrollView}
          contentContainerStyle={styles.mainScrollContentContainer}
          showsVerticalScrollIndicator={true}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={50}
          scrollEnabled={true}
          bounces={true}
          bouncesZoom={true}
          alwaysBounceVertical={true}
          automaticallyAdjustContentInsets={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10
          }}
        >
          <View style={styles.memoContainer}>
            {renderMemoInput()}
          </View>
          
          {/* 완료된 항목 영역 */}
          {renderCheckedItems()}
        </KeyboardAwareScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MemoListScreen;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#f8f9fa",
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
    backgroundColor: "#fff",
    marginVertical: 3,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    minHeight: 40,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  checkboxTouchable: {
    padding: 3,
  },
  itemTextContainer: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#ced4da",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#4dabf7",
    borderColor: "#4dabf7",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  itemText: {
    fontSize: 16,
    color: "#212529",
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: "#adb5bd",
    fontStyle: "italic",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  deleteText: {
    fontSize: 14,
    color: "#fa5252",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 12,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#868e96",
    textAlign: "center",
  },
  emptySubtext: {
    color: "#868e96",
    marginBottom: 20,
  },
  emptyArrow: {
    backgroundColor: "#e9ecef",
    padding: 10,
    borderRadius: 12,
  },
  emptyArrowText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  itemEditInput: {
    flex: 1,
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#4dabf7",
    marginRight: 8,
    padding: 4,
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    padding: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#4dabf7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    marginLeft: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  suggestionBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  suggestionItem: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  suggestionText: {
    color: "#495057",
    fontSize: 14,
  },
  listContentContainer: {
    paddingBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalInfo: {
    color: "#868e96",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#4dabf7",
    padding: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  previewBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
    marginBottom: 24,
  },
  previewText: {
    fontSize: 14,
    color: "#212529",
    lineHeight: 20,
  },
  inputMethodsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    padding: 8,
  },
  inputMethodButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  inputMethodIcon: {
    fontSize: 20,
  },
  urlDetectingContainer: {
    padding: 10,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    marginBottom: 10,
  },
  urlDetectingText: {
    color: "#495057",
    fontSize: 14,
  },
  urlPreviewContainer: {
    flexDirection: "row",
    backgroundColor: "#e3fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#99e9f2",
  },
  urlPreviewContent: {
    flex: 1,
  },
  urlPreviewTitle: {
    fontSize: 14,
    color: "#0c8599",
    fontWeight: "600",
  },
  urlPreviewPrice: {
    fontSize: 13,
    color: "#495057",
    marginTop: 2,
  },
  urlPreviewButton: {
    backgroundColor: "#15aabf",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  urlPreviewButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  urlPreviewLinkButton: {
    backgroundColor: "#e9ecef",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  urlPreviewLinkText: {
    color: "#495057",
    fontSize: 12,
  },
  imagePickerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  imagePickerOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 20,
  },
  imagePickerOption: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    width: "45%",
  },
  imagePickerOptionIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  imagePickerOptionText: {
    fontSize: 16,
    color: "#495057",
  },
  selectedImageContainer: {
    marginBottom: 16,
    position: "relative",
    alignSelf: "center",
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  imageAnalysisOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  imageAnalysisText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "bold",
  },
  analysisResults: {
    width: "100%",
    marginVertical: 15,
  },
  analysisItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  analysisItemText: {
    fontSize: 15,
    color: "#212529",
  },
  analysisItemAction: {
    fontSize: 13,
    color: "#4dabf7",
    fontWeight: "bold",
  },
  inputMethodLabel: {
    fontSize: 10,
    marginTop: 2,
    color: "#495057",
  },
  recommendationContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  recommendationCategories: {
    flexDirection: "row",
    marginVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  activeCategoryTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4dabf7",
  },
  categoryText: {
    color: "#868e96",
    fontSize: 14,
  },
  activeCategoryText: {
    color: "#4dabf7",
    fontWeight: "bold",
    fontSize: 14,
  },
  recommendationList: {
    maxHeight: 300,
  },
  recommendationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 13,
    color: "#868e96",
  },
  recommendationAction: {
    backgroundColor: "#e7f5ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 12,
  },
  recommendationActionText: {
    color: "#4dabf7",
    fontWeight: "bold",
    fontSize: 13,
  },
  voiceContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },
  recordingHint: {
    color: "#868e96",
    marginTop: 8,
    marginBottom: 20,
  },
  micButton: {
    marginVertical: 24,
  },
  micButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
  },
  micButtonRecording: {
    backgroundColor: "#ffc9c9",
    borderColor: "#ff8787",
  },
  micIcon: {
    fontSize: 36,
  },
  voiceIndicator: {
    marginVertical: 36,
  },
  resultsTitle: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#495057",
  },
  voiceResults: {
    width: "100%",
    marginBottom: 10,
  },
  voiceResultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  voiceResultText: {
    fontSize: 16,
    color: "#212529",
  },
  voiceResultSelect: {
    color: "#4dabf7",
    fontWeight: "bold",
  },
  titleContainer: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ced4da',
    flex: 1,
  },
  titleTextContainer: {
    padding: 4,
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 4,
  },
  editIcon: {
    fontSize: 16,
    color: '#868e96',
  },
  titleActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  titleActionButton: {
    padding: 8,
  },
  titleActionIcon: {
    fontSize: 18,
    color: '#495057',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  memoContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    width: '100%',
  },
  memoInputContainer: {
    flex: 1,
  },
  memoInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 4,
  },
  checkedItemsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  checkedItemsTitle: {
    fontSize: 14,
    color: '#868e96',
    marginBottom: 8,
    fontWeight: '500',
  },
  checkedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  uncheckedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  memoInputWithCheckboxes: {
    flex: 1,
    width: '100%',
  },
  itemInputField: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  newItemInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  addItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4dabf7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addItemGuide: {
    padding: 10,
    backgroundColor: '#e7f5ff',
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  addItemGuideText: {
    color: '#495057',
    fontSize: 13,
    textAlign: 'center',
  },
  addItemGuideHighlight: {
    fontWeight: 'bold',
    color: '#339af0',
  },
  contentContainer: {
    flex: 1,
  },
  itemsScrollView: {
    maxHeight: 300,
    marginBottom: 8,
  },
  checkedItemsScrollView: {
    maxHeight: 200,
  },
  mainScrollView: {
    flex: 1,
    width: '100%',
  },
  mainScrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 80, // 하단 여백 추가
  },
});
