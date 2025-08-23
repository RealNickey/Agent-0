import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

const map: Map<string, AudioContext> = new Map();

let didInteract: Promise<any> | null = null;

export const audioContext = async (
  options?: GetAudioContextOptions
): Promise<AudioContext> => {
  // Return early if running on server
  if (typeof window === "undefined") {
    throw new Error("AudioContext is not available on server side");
  }

  // Initialize didInteract only on client
  if (!didInteract) {
    didInteract = new Promise((res) => {
      window.addEventListener("pointerdown", res, { once: true });
      window.addEventListener("keydown", res, { once: true });
    });
  }

  try {
    const a = new Audio();
    a.src =
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    await a.play();
    if (options?.id && map.has(options.id)) {
      const ctx = map.get(options.id);
      if (ctx) {
        return ctx;
      }
    }
    const ctx = new AudioContext(options);
    if (options?.id) {
      map.set(options.id, ctx);
    }
    return ctx;
  } catch (e) {
    await didInteract;
    if (options?.id && map.has(options.id)) {
      const ctx = map.get(options.id);
      if (ctx) {
        return ctx;
      }
    }
    const ctx = new AudioContext(options);
    if (options?.id) {
      map.set(options.id, ctx);
    }
    return ctx;
  }
};

export function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
