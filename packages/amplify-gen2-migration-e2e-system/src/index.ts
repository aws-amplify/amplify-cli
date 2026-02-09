/**
 * Main entry point for the Amplify Migration System
 * Exports all public interfaces and classes
 */

// Core interfaces
export * from './interfaces';

// Types
export * from './types';

// Core components
export { ConfigurationLoader } from './core/configuration-loader';
export { EnvironmentDetector } from './core/environment-detector';
export { AppSelector } from './core/app-selector';
export { AmplifyInitializer } from './core/amplify-initializer';

// Utilities
export { Logger } from './utils/logger';
export { FileManager } from './utils/file-manager';
