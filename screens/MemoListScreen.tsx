// screens/MemoListScreen.tsx
import React, { useContext, useState, useEffect } from "react";
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
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { MemoContext, Memo } from "../context/MemoContext";

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
}: {
  input: string;
  setInput: (text: string) => void;
  handleAddItem: () => void;
  filteredSuggestions: string[];
  memoId?: string;
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
  } = useContext(MemoContext);

  const [input, setInput] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemInput, setItemInput] = useState("");
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareContent, setShareContent] = useState("");

  const currentMemo = memos.find((memo) => memo.id === memoId);
  const [isFavorite, setIsFavorite] = useState(currentMemo?.favorite || false);

  // 메모가 처음 생성되었을 때 제목 편집 모드로 자동 전환
  useEffect(() => {
    if (currentMemo && currentMemo.title === '' && currentMemo.items.length === 0) {
      setTitleInput('');
      setEditingTitle(true);
    }
  }, [currentMemo]);

  const checkedCount = currentMemo?.items.filter((i) => i.checked).length || 0;
  const totalCount = currentMemo?.items.length || 0;
  const percentage =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toggleFavorite(memoId);
  };

  const handleShareMemo = () => {
    const content = getMemoText(memoId);
    setShareContent(content);
    setShareModalVisible(true);
    shareMemo(memoId);
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

  const confirmDelete = (itemId) => {
    Alert.alert("삭제 확인", "이 항목을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteItemFromMemo(memoId, itemId),
      },
    ]);
  };

  const filteredSuggestions = recentItems.filter(
    (item) =>
      input &&
      item.toLowerCase().includes(input.toLowerCase()) &&
      !currentMemo.items.some((i) => i.name === item)
  );

  return (
    <View style={styles.container}>
      <SharePreviewModal
        visible={shareModalVisible}
        content={shareContent}
        onClose={() => setShareModalVisible(false)}
      />

      {editingTitle ? (
        <TextInput
          value={titleInput}
          onChangeText={setTitleInput}
          onSubmitEditing={handleTitleSubmit}
          onBlur={handleTitleSubmit}
          style={styles.titleInput}
          placeholder="메모 제목을 입력하세요"
          autoFocus
          selectTextOnFocus={true}
        />
      ) : (
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => {
              setTitleInput(currentMemo?.title || "");
              setEditingTitle(true);
            }}
            style={{ flex: 1 }}
          >
            <Text style={styles.title}>{currentMemo?.title}</Text>
          </TouchableOpacity>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.iconButton}
            >
              <Text style={styles.iconText}>{isFavorite ? "⭐" : "☆"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareMemo}
              style={styles.iconButton}
            >
              <Text style={styles.iconText}>📤</Text>
            </TouchableOpacity>
          </View>
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
              <View style={styles.itemContainer}>
                <TouchableOpacity
                  onPress={() => toggleItemChecked(memoId, item.id)}
                  style={styles.checkboxTouchable}
                >
                  <View
                    style={[
                      styles.checkbox,
                      item.checked && styles.checkboxChecked,
                    ]}
                  >
                    {item.checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onLongPress={() => {
                    setEditingItemId(item.id);
                    setItemInput(item.name);
                  }}
                  style={styles.itemTextContainer}
                >
                  <Text
                    style={[
                      styles.itemText,
                      item.checked && styles.checkedText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => confirmDelete(item.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>항목을 추가해보세요.</Text>
          </View>
        }
        ListFooterComponent={
          <MemoFooter
            input={input}
            setInput={setInput}
            handleAddItem={handleAddItem}
            filteredSuggestions={filteredSuggestions}
            memoId={memoId}
          />
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContentContainer}
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
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 6,
    marginLeft: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
  },
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#ced4da",
    padding: 10,
    marginBottom: 20,
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
    backgroundColor: "#fff",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxTouchable: {
    padding: 4,
  },
  itemTextContainer: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
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
    color: "#868e96",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  deleteText: {
    fontSize: 14,
    color: "#ff6b6b",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#868e96",
    textAlign: "center",
  },
  itemEditInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#4dabf7",
    marginRight: 10,
    padding: 4,
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 24,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#4dabf7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    marginLeft: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
});
