import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

/**
 * Generic observer interface
 */
export interface Observer<T> {
  update(data: T): void;
}

/**
 * Observable configuration manager using the Observer pattern
 */
export class ConfigurationObservable<T> implements vscode.Disposable {
  private observers: Observer<T>[] = [];
  private logger: Logger;
  private disposables: vscode.Disposable[] = [];

  constructor(private configurationSection: string) {
    this.logger = Logger.initialize("ConfigurationObservable", {
      minLevel: LogLevel.INFO,
    });

    // Watch for configuration changes
    const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configurationSection)) {
        this.notifyObservers();
      }
    });

    this.disposables.push(configWatcher);
  }

  /**
   * Subscribe an observer to configuration changes
   */
  subscribe(observer: Observer<T>): vscode.Disposable {
    this.observers.push(observer);
    this.logger.info(`Observer subscribed to ${this.configurationSection} changes`);

    return {
      dispose: () => {
        this.unsubscribe(observer);
      },
    };
  }

  /**
   * Unsubscribe an observer from configuration changes
   */
  unsubscribe(observer: Observer<T>): void {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
      this.logger.info(`Observer unsubscribed from ${this.configurationSection} changes`);
    }
  }

  /**
   * Notify all observers of configuration changes
   */
  private notifyObservers(): void {
    const config = this.getCurrentConfiguration();
    this.logger.info(`Notifying ${this.observers.length} observers of configuration change`);

    for (const observer of this.observers) {
      try {
        observer.update(config);
      } catch (error) {
        this.logger.error("Error in configuration observer:", error);
      }
    }
  }

  /**
   * Get current configuration - to be overridden by subclasses
   */
  protected getCurrentConfiguration(): T {
    const config = vscode.workspace.getConfiguration(this.configurationSection);
    return config as unknown as T;
  }

  /**
   * Manually trigger notification (useful for testing or forced updates)
   */
  notify(): void {
    this.notifyObservers();
  }

  /**
   * Get the number of current observers
   */
  getObserverCount(): number {
    return this.observers.length;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.logger.info("Disposing configuration observable");
    this.observers.length = 0;
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }
}

/**
 * Specific observable for Vector Database Configuration
 */
export class VectorDbConfigObservable extends ConfigurationObservable<any> {
  constructor() {
    super("codebuddy.vectorDb");
  }

  protected getCurrentConfiguration(): any {
    const config = vscode.workspace.getConfiguration("codebuddy.vectorDb");

    return {
      enabled: config.get("enabled", true),
      embeddingModel: config.get("embeddingModel", "gemini"),
      maxTokens: config.get("maxTokens", 6000),
      batchSize: config.get("batchSize", 10),
      searchResultLimit: config.get("searchResultLimit", 8),
      enableBackgroundProcessing: config.get("enableBackgroundProcessing", true),
      enableProgressNotifications: config.get("enableProgressNotifications", true),
      progressLocation: config.get("progressLocation", "notification"),
      debounceDelay: config.get("debounceDelay", 1000),
      performanceMode: config.get("performanceMode", "balanced"),
      fallbackToKeywordSearch: config.get("fallbackToKeywordSearch", true),
      cacheEnabled: config.get("cacheEnabled", true),
      logLevel: config.get("logLevel", "info"),
      slowSearchThreshold: config.get("slowSearchThreshold", 2000),
    };
  }
}

/**
 * Configuration change listener that implements Observer pattern
 */
export class ConfigurationChangeListener implements Observer<any> {
  private logger: Logger;

  constructor(
    private name: string,
    private callback: (config: any) => void
  ) {
    this.logger = Logger.initialize(`ConfigListener_${name}`, {
      minLevel: LogLevel.INFO,
    });
  }

  update(config: any): void {
    this.logger.info(`Configuration changed for ${this.name}`);
    try {
      this.callback(config);
    } catch (error) {
      this.logger.error(`Error in configuration callback for ${this.name}:`, error);
    }
  }
}

/**
 * Factory for creating configuration observers
 */
export class ConfigurationObserverFactory {
  private static observables = new Map<string, ConfigurationObservable<any>>();

  /**
   * Get or create an observable for a configuration section
   */
  static getObservable<T>(section: string): ConfigurationObservable<T> {
    if (!this.observables.has(section)) {
      if (section === "codebuddy.vectorDb") {
        this.observables.set(section, new VectorDbConfigObservable());
      } else {
        this.observables.set(section, new ConfigurationObservable<T>(section));
      }
    }
    return this.observables.get(section) as ConfigurationObservable<T>;
  }

  /**
   * Create a configuration listener
   */
  static createListener<T>(name: string, callback: (config: T) => void): Observer<T> {
    return new ConfigurationChangeListener(name, callback);
  }

  /**
   * Dispose of all observables
   */
  static disposeAll(): void {
    for (const observable of this.observables.values()) {
      observable.dispose();
    }
    this.observables.clear();
  }
}
