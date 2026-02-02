/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    light: '#BE9EFF', // Lighter shade of purple
                    DEFAULT: '#8B51FF', // Teaching Pariksha Purple
                    dark: '#701aef', // Darker shade for hover
                },
                secondary: {
                    light: '#F5F5F5',
                    DEFAULT: '#E0E0E0',
                    dark: '#BDBDBD',
                },
                accent: '#FFD700', // Gold accent
            },
            backgroundImage: {
                'none': 'none', // Ensure gradients can be easily disabled
            },
            boxShadow: {
                'flat': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // Minimal shadow
            }
        },
    },
    plugins: [],
}
