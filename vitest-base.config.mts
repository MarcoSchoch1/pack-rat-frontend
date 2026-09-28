import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node 25+ ships its own global localStorage, which shadows jsdom's and is undefined
    // without --localstorage-file. Disable it so tests get jsdom's working implementation.
    execArgv: ['--no-experimental-webstorage'],
  },
});
