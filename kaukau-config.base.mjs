import { defineConfig } from 'kaukau/config';

export default defineConfig({
    enableLogs: false,
    exitOnFail: true,
    files: 'test/',
    ext: '.spec.ts',
    options: {
        bail: false,
        fullTrace: true,
        grep: '',
        ignoreLeaks: false,
        reporter: 'spec',
        retries: 0,
        slow: 1000,
        timeout: 5000,
        ui: 'bdd',
        color: true,
    },
});
