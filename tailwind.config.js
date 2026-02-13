module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#0052cc',
          dark: '#0747a6',
          light: '#deebff',
        },
        neutral: {
          bg: '#f8f9fa',
          card: '#ffffff',
          border: '#dfe1e6',
          text: {
            main: '#172b4d',
            secondary: '#42526e',
            muted: '#6b778c',
          },
        },
        status: {
          success: '#36b37e',
          error: '#ff5630',
          warning: '#ffab00',
        },
        genx: {
          50: '#f7fafc',
          100: '#eef2f7',
          200: '#dfe7ef',
          500: '#2b4865',
          700: '#162833',
        },
        accent: {
          500: '#ff6b6b',
          600: '#ff5252',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'card-lg': '0 10px 30px rgba(17, 24, 39, 0.12)',
      },
      backgroundImage: {
        'genx-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #2b4865 100%)',
      },
    },
  },
  plugins: [],
}
