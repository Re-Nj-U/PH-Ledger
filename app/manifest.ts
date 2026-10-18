import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/', name: 'PIKU Holidays Ledger', short_name: 'PIKU Ledger',
        description: 'Trips, expenses, EMIs and partner balances for PIKU Holidays.',
        start_url: '/', scope: '/', display: 'standalone',
        background_color: '#f7faf8', theme_color: '#174b36', lang: 'en-IN',
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
