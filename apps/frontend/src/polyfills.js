// Polyfills for Node.js modules in browser environment
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Export for explicit imports
export { Buffer };
