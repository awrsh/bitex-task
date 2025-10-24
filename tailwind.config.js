/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'buy': '#00d4aa',
                'sell': '#ff6b6b',
                'bid': '#00d4aa',
                'ask': '#ff6b6b',
                'neutral': '#64748b',
                'background': '#0f172a',
                'surface': '#1e293b',
                'border': '#334155',
            },
            animation: {
                'pulse-green': 'pulse-green 0.5s ease-in-out',
                'pulse-red': 'pulse-red 0.5s ease-in-out',
            },
            keyframes: {
                'pulse-green': {
                    '0%': { backgroundColor: 'transparent' },
                    '50%': { backgroundColor: 'rgba(0, 212, 170, 0.2)' },
                    '100%': { backgroundColor: 'transparent' },
                },
                'pulse-red': {
                    '0%': { backgroundColor: 'transparent' },
                    '50%': { backgroundColor: 'rgba(255, 107, 107, 0.2)' },
                    '100%': { backgroundColor: 'transparent' },
                },
            },
        },
    },
    plugins: [],
}