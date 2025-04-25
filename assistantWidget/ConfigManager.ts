// config-manager.ts
import type { ChatConfig, ChatTheme, ChatAssets, ChatIcons } from './types/types';
import { logo as logo, logo as headerLogo} from './assets/logo';


export class ConfigManager {
  private static readonly defaultTheme: ChatTheme = {
    userBackgroundColor: '#10b981',
    agentBackgroundColor: '#6c757d',
    textColor: '#212529',
    backgroundColor: '#ffffff',
    buttonColor: '#007bff',
    buttonTextColor: '#ffffff',
    agentForegroundColor: '#ffffff',
    userForegroundColor: '#ffffff',
    headerBackgroundColor: '#f3f4f6',
    headerTextColor: '#111827',
    agentIconColor: '#ffffff',
    userIconColor: '#ffffff'
  };

  private static readonly defaultAssets: ChatAssets = {
    logo: logo,
    headerLogo: headerLogo,
  };

  private static readonly defaultIcons: ChatIcons = {
    closeIcon: '/icons/close-icon.svg',
    sendIcon: '/icons/send-icon.svg',
    minimizeIcon: '/icons/minimize-icon.svg',
    maximizeIcon: '/icons/maximize-icon.svg',
    expandIcon: '/icons/resize-icon.svg',
    reduceIcon: '/icons/resize-icon.svg'
  };

  private config: ChatConfig;
  private theme: ChatTheme;
  private assets: ChatAssets;
  private icons: ChatIcons;

  constructor(config: ChatConfig) {
    this.validateConfig(config);
    this.config = this.mergeWithDefaults(config);
    this.theme = this.initializeTheme();
    this.assets = this.initializeAssets();
    this.icons = this.initializeIcons();
  }

  private validateConfig(config: ChatConfig): void {
    if (!config.apiUrl) {
      throw new Error('API URL is required');
    }
    if (!config.agentToken) {
      throw new Error('Agent token is required');
    }
  }

  private mergeWithDefaults(config: ChatConfig): ChatConfig {
    return {
      ...config,
      title: config.title || 'Chat Assistant',
      position: config.position || 'bottom-right',
      theme: {
        ...ConfigManager.defaultTheme,
        ...config.theme
      }
    };
  }

  private initializeTheme(): ChatTheme {
    return {
      ...ConfigManager.defaultTheme,
      ...this.config.theme
    };
  }

  private initializeAssets(): ChatAssets {
    const assets = {
      logo: this.config.logo || ConfigManager.defaultAssets.logo,
      headerLogo: this.config.headerLogo || ConfigManager.defaultAssets.headerLogo,
    };

    return assets;
  }

  private initializeIcons(): ChatIcons {
    const validImagePattern = /^(data:image\/|https:\/\/|\/)/i;
    const icons: ChatIcons = {
      closeIcon: ConfigManager.defaultIcons.closeIcon,
      sendIcon: ConfigManager.defaultIcons.sendIcon,
      minimizeIcon: ConfigManager.defaultIcons.minimizeIcon,
      maximizeIcon: ConfigManager.defaultIcons.maximizeIcon,
      expandIcon: ConfigManager.defaultIcons.expandIcon,
      reduceIcon: ConfigManager.defaultIcons.reduceIcon
    };

    if (this.config.icons) {
      Object.entries(this.config.icons).forEach(([key, value]) => {
        if (value && validImagePattern.test(value)) {
          icons[key as keyof ChatIcons] = value;
        } else {
          //  do nothing
        }
      });
    }

    return icons;
  }

  public getConfig(): ChatConfig {
    return this.config;
  }

  public getTheme(): ChatTheme {
    return this.theme;
  }

  public getAssets(): ChatAssets {
    return this.assets;
  }

  public getIcons(): ChatIcons {
    return this.icons;
  }

  public getCSSVariables(): Record<string, string> {
    return {
      '--chat-primary-color': this.theme.userBackgroundColor,
      '--chat-secondary-color': this.theme.agentBackgroundColor,
      '--chat-text-color': this.theme.textColor,
      '--chat-background-color': this.theme.backgroundColor,
      '--chat-button-color': this.theme.buttonColor,
      '--chat-button-text-color': this.theme.buttonTextColor
    };
  }

  public updateTheme(newTheme: Partial<ChatTheme>): void {
    this.theme = {
      ...this.theme,
      ...newTheme
    };
  }

  public updateAssets(newAssets: Partial<ChatAssets>): void {
    this.assets = this.initializeAssets();
  }

  public updateIcons(newIcons: Partial<ChatIcons>): void {
    this.icons = this.initializeIcons();
  }
}