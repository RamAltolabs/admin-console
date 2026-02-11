export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          main: 'var(--primary-main)',
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)',
        },
        neutral: {
          bg: 'var(--neutral-bg)',
          card: 'var(--neutral-card)',
          border: 'var(--neutral-border)',
          text: {
            main: 'var(--neutral-text-main)',
            secondary: 'var(--neutral-text-secondary)',
            muted: 'var(--neutral-text-muted)',
          }
        },
        status: {
          success: 'var(--status-success)',
          error: 'var(--status-error)',
          warning: 'var(--status-warning)',
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
