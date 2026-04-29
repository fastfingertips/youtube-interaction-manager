export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        // Browser
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        MutationObserver: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        HTMLElement: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        // Firefox
        browser: 'readonly',
        // Chrome Extension
        chrome: 'readonly',
        importScripts: 'readonly',
        // Node (conditional exports)
        module: 'readonly',
        // App globals
        CONFIG: 'writable',
        StorageUtils: 'writable',
        BackupUtils: 'writable',
      }
    },
    rules: {
      // Errors
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-redeclare': 'off',
      // Warnings
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-constant-condition': 'warn',
      'no-empty': 'warn',
      'eqeqeq': ['warn', 'always'],
      // Off
      'no-console': 'off',
    }
  }
];
