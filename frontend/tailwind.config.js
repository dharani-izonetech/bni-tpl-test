/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border:     'var(--border-color)',
        input:      'var(--input-color)',
        ring:       'var(--ring-color)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // ── Match Center theme ──────────────────────────────────────────────
        // Backgrounds
        'broadcast':    '#FFFDF5',      // warm page background
        'cream':        '#FFFDF5',
        'cream-soft':   '#FDF6E3',      // soft warm card background
        'cream-deeper': '#F0E8D0',      // slightly darker warm
        'card':         '#FFFFFF',      // card white

        // Text
        'ink':          '#1A1200',      // near-black warm
        'muted-ink':    '#5C4A10',      // warm mid-grey
        'muted-ink-2':  '#8A7840',      // lighter warm-grey

        // Accent reds (cricket live badge, wickets, boundaries)
        'accent-red': {
          DEFAULT: '#E53935',
          soft:    '#FEECEC',
        },

        // Accent amber (fours, gold stats)
        'accent-amber': {
          DEFAULT: '#F59E0B',
        },

        // Accent green (completed, run rates)
        'accent-green': {
          DEFAULT: '#16A34A',
        },

        // ── Existing BNI palette ────────────────────────────────────────────
        primary: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          DEFAULT: '#ca8a04',
          foreground: '#ffffff',
        },
        slate: {
          50:  '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b',
          900: '#0f172a', 950: '#020617',
        },
        'ipl-red':   '#dc2626',
        'ipl-green': '#16a34a',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        fixture: ['Teko', 'Oswald', 'sans-serif'],
      },
      boxShadow: {
        'broadcast': '0 2px 16px rgba(26,18,0,0.08)',
        'soft':      '0 1px 4px rgba(26,18,0,0.06)',
        'red':       '0 4px 16px rgba(229,57,53,0.25)',
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
      },
    },
  },
  plugins: [],
}
