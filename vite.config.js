import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const assetUrl = env.ASSET_URL || '/npc_smartflow';
    const base = assetUrl.endsWith('/') ? `${assetUrl}build/` : `${assetUrl}/build/`;

    return {
        base: base,
        plugins: [
            laravel({
                input: 'resources/js/app.jsx',
                refresh: true,
            }),
            react(),
        ],
    };
});
