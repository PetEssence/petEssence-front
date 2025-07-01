/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx}", 
  "./pages/**/*.{js,ts,jsx,tsx}",     
],

  theme: {
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      colors: {
        primaryGreen: '#29C28D',
        primaryGreenHouver: '#22A478',
      },
    }
  },
  variants: {
    extend: {
      borderColor: ['focus-visible'],
      opacity: ['disabled'],
    }
  },
  corePlugins: {
    preflight: true,
  },
  important: false,

}