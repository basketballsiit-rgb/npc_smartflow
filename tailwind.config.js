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
                sans: ['"IBM Plex Sans Thai"', 'Prompt', 'Kanit', 'sans-serif', ...defaultTheme.fontFamily.sans],
                body: ['"IBM Plex Sans Thai"', 'sans-serif', ...defaultTheme.fontFamily.sans],
                heading: ['Prompt', 'Kanit', 'sans-serif'],
                prompt: ['Prompt', 'sans-serif'],
                kanit: ['Kanit', 'sans-serif'],
            },
        },
    },

    plugins: [forms],
};
