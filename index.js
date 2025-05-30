export { emaBot, chatBot } from './src/app.js';
export { getState, session_store } from './src/session_store.js';

// index.js
export function greet(name) {
    return `Hello, ${name}! 👋`;
  }