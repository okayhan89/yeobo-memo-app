import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";

// Screens
import HomeScreen from "./screens/HomeScreen";
import MemoListScreen from "./screens/MemoListScreen";

// Context
import { MemoProvider } from "./context/MemoContext";

// Define the type for our root stack navigator
type RootStackParamList = {
  Home: undefined;
  MemoList: { memoId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <SafeAreaView style={styles.container}>
        <MemoProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: "#f8f9fa",
                },
                headerTitleStyle: {
                  fontWeight: "600",
                  fontSize: 18,
                  color: "#212529",
                },
                headerTintColor: "#4dabf7",
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: "#f8f9fa",
                },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: "쇼핑 메모",
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="MemoList"
                component={MemoListScreen}
                options={{
                  title: "쇼핑 목록",
                  headerBackTitle: "뒤로",
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </MemoProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});
