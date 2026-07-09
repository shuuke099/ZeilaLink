'use client';

import { useEffect } from 'react';

/**
 * Suppresses harmless browser extension errors that clutter the console
 * These errors occur when browser extensions (like React DevTools) try to
 * communicate with disconnected ports
 */
export default function ErrorSuppressor() {
  useEffect(() => {
    // Suppress error events from browser extensions
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (
        message.includes('disconnected port object') ||
        message.includes('Extension context invalidated') ||
        message.includes('chrome-extension://') ||
        message.includes('moz-extension://') ||
        message.includes('proxy.js')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // Suppress unhandled promise rejections from extensions
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason?.message || reason?.toString() || '';
      
      if (
        message.includes('disconnected port object') ||
        message.includes('Extension context invalidated') ||
        message.includes('chrome-extension://') ||
        message.includes('moz-extension://') ||
        message.includes('proxy.js')
      ) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}

