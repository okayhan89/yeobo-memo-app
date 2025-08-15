export default {
  expo: {
    name: "yeobo-memo-app",
    slug: "yeobo-memo-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hanseungyeab.yeobomemoapp",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      // 위젯 데이터 공유를 위한 App Group 설정
      entitlements: {
        "com.apple.security.application-groups": ["group.com.hanseungyeab.yeobomemoapp.widget"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.hanseungyeab.yeobomemoapp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "bc94272b-4dab-472f-b3c5-d8b31cd21ddc"
      }
    },
    owner: "hanseungyeab",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/bc94272b-4dab-472f-b3c5-d8b31cd21ddc"
    },
    plugins: [
      // 일단 위젯 플러그인을 비활성화하고 기본 앱부터 테스트
      // [
      //   "@bittingz/expo-widgets",
      //   {
      //     ios: {
      //       src: "./widgets/ios",
      //       // devTeamId: "YOUR_APPLE_DEV_TEAM_ID", // Apple Developer Team ID - 나중에 설정
      //       mode: "production",
      //       moduleDependencies: [],
      //       useLiveActivities: false,
      //       frequentUpdates: false,
      //       entitlements: {
      //         "com.apple.security.application-groups": ["group.com.hanseungyeab.yeobomemoapp.widget"]
      //       }
      //     },
      //     android: {
      //       src: "./widgets/android",
      //       widgets: [
      //         {
      //           name: "MemoWidgetProvider",
      //           resourceName: "@xml/memo_widget_info"
      //         }
      //       ]
      //     }
      //   }
      // ]
    ]
  }
};