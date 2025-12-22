/**
 * Main entry point for the Amplify Migration System
 * Exports all public interfaces and classes
 */

// Core interfaces
export * from './interfaces';

// Types
export * from './types';

// Core components
export { ConfigurationLoader } from './core/ConfigurationLoader';
export { EnvironmentDetector } from './core/EnvironmentDetector';
export { AppSelector } from './core/AppSelector';

// Utilities
export { Logger } from './utils/Logger';
export { FileManager } from './utils/FileManager';
export { NameGenerator } from './utils/NameGenerator';

// Version
export const VERSION = '1.0.0';
