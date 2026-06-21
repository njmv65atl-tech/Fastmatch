declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL?: string;
    DELL_URL?: string;
    API_VERSION?: string;
    [key: string]: any;
  }
  const Config: NativeConfig;
  export default Config;
}
