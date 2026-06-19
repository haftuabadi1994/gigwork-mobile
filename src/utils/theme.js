export const Colors = {
  // Brand
  primary:      '#1D9E75',
  primaryDark:  '#0F6E56',
  primaryLight: '#E1F5EE',
  primaryMid:   '#5DCAA5',

  // UI colors
  blue:         '#378ADD',
  blueLight:    '#E6F1FB',
  amber:        '#EF9F27',
  amberLight:   '#FAEEDA',
  red:          '#E24B4A',
  redLight:     '#FCEBEB',
  redDark:      '#A32D2D',
  purple:       '#8B5CF6',
  purpleLight:  '#F5F3FF',
  pink:         '#EC4899',
  pinkLight:    '#FDF2F8',
  pinkDark:     '#9D174D',
  teal:         '#14B8A6',
  tealLight:    '#E6FFFA',
  tealDark:     '#0D7A70',
  orange:       '#F97316',
  orangeLight:  '#FFF0E6',
  orangeDark:   '#C2410C',

  // Backgrounds
  bg:      '#F7F8FA',
  surface: '#FFFFFF',
  border:  '#E8E8E8',

  // Text
  text:  '#1A1A1A',
  text2: '#555B66',
  text3: '#9AA0AD',
  text4: '#C5C8CE',

  // Level colors
  levels: {
    intern: { color: '#6B7280', light: '#F3F4F6', label: 'Intern'    },
    job1:   { color: '#10B981', light: '#D1FAE5', label: 'Junior I'  },
    job2:   { color: '#3B82F6', light: '#DBEAFE', label: 'Junior II' },
    job3:   { color: '#8B5CF6', light: '#EDE9FE', label: 'Mid I'     },
    job4:   { color: '#F59E0B', light: '#FEF3C7', label: 'Mid II'    },
    job5:   { color: '#EF4444', light: '#FEE2E2', label: 'Senior I'  },
    job6:   { color: '#EC4899', light: '#FCE7F3', label: 'Senior II' },
    job7:   { color: '#14B8A6', light: '#CCFBF1', label: 'Lead I'    },
    job8:   { color: '#F97316', light: '#FFEDD5', label: 'Lead II'   },
    job9:   { color: '#6366F1', light: '#E0E7FF', label: 'Expert'    },
    job10:  { color: '#D97706', light: '#FEF3C7', label: 'Master'    },
  },
};

export const Fonts = {
  sizes: {
    xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 32,
  },
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  lg: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 16, elevation: 8,
  },
  primary: {
    shadowColor: '#1D9E75', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
};

// Level helpers
export const getLevelColor = (level) => Colors.levels[level || 'intern']?.color || Colors.primary;
export const getLevelLight = (level) => Colors.levels[level || 'intern']?.light || Colors.primaryLight;
export const getLevelLabel = (level) => Colors.levels[level || 'intern']?.label || level;