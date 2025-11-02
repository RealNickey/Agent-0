/**
 * Toast notification utilities with appropriate colors for different message types
 */

import { toast } from "sonner";

export const toastConfig = {
  success: {},
  error: {},
  warning: {},
  info: {},
};

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      ...toastConfig.success,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      ...toastConfig.error,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      ...toastConfig.warning,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      ...toastConfig.info,
    });
  },

  // Custom toast with manual styling
  custom: (message: string, options?: Parameters<typeof toast>[1]) => {
    toast(message, {
      ...toastConfig.info,
      ...options,
    });
  },
};

// Connection-specific toasts
export const connectionToasts = {
  connecting: () => showToast.info("Connecting to Gemini Live API..."),
  connected: () =>
    showToast.success(
      "Connected to Gemini Live API",
      "Ready to start conversing"
    ),
  disconnected: () => showToast.info("Disconnected from Gemini Live API"),
  connectionError: (error?: string) =>
    showToast.error(
      "Connection failed",
      error || "Please check your API key and try again"
    ),
  audioError: (error?: string) =>
    showToast.warning(
      "Audio issue detected",
      error || "Audio pipeline may need attention"
    ),
  sessionValidationFailed: () =>
    showToast.warning(
      "Session validation failed",
      "Connection may be unresponsive"
    ),
};

// Tool-specific toasts
export const toolToasts = {
  searchStarted: (query: string) =>
    showToast.info(`Searching for "${query}"...`),
  searchSuccess: (count: number) => showToast.success(`Found ${count} results`),
  searchError: (error?: string) => showToast.error("Search failed", error),
  movieNotFound: (title: string) =>
    showToast.warning(`Movie "${title}" not found`),
  apiError: (service: string, error?: string) =>
    showToast.error(`${service} API error`, error || "Please try again later"),
};
