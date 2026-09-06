import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Sarabun', 'Kanit', 'sans-serif', ...defaultTheme.fontFamily.sans],
                body: ['Sarabun', 'sans-serif', ...defaultTheme.fontFamily.sans],
                heading: ['Kanit', 'sans-serif'],
                kanit: ['Kanit', 'sans-serif'],
                sarabun: ['Sarabun', 'sans-serif'],
            },
        },
    },

    plugins: [forms],
};
