// Config
import config from 'better-trading/config/environment';

interface ExtensionApi {
  runtime: {
    getURL(path: string): string;
    sendMessage(query: object, callback: (payload: object | null) => void): void;
  };

  storage: {
    local: {
      get(keys: string[] | null, callback: (result: any) => void): void;
      set(data: object, callback: () => void): void;
      remove(keys: string | string[], callback: () => void): void;
    };
  };
}

declare const chrome: ExtensionApi;
declare const browser: ExtensionApi;

export const extensionApi = (): ExtensionApi => {
  return config.APP.browser === 'chrome' ? chrome : browser;
};
