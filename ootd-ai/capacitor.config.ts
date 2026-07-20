import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.ootdai.app',
  appName: 'OOTD AI',
  webDir: 'out',
  server: {
    // 서버 URL 방식: 앱이 ootdai.me를 로드 (번들 없음)
    url: 'https://ootdai.me',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
