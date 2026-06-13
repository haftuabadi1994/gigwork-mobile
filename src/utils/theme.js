export const Colors = {
  primary:     '#1D9E75',
  primaryDark: '#0F6E56',
  primaryLight:'#E1F5EE',
  primaryMid:  '#5DCAA5',

  blue:        '#378ADD',
  blueLight:   '#E6F1FB',
  amber:       '#EF9F27',
  amberLight:  '#FAEEDA',
  red:         '#E24B4A',
  redLight:    '#FCEBEB',
  purple:      '#8B5CF6',
  purpleLight: '#F5F3FF',

  bg:          '#F7F8FA',
  surface:     '#FFFFFF',
  border:      '#E8E8E8',
  borderLight: '#F2F2F2',

  text:        '#1A1A1A',
  text2:       '#555B66',
  text3:       '#9AA0AD',
  text4:       '#C5C8CE',

  // Level colors
  levels: {
    intern: '#6B7280', job1: '#10B981', job2: '#3B82F6',
    job3: '#8B5CF6',   job4: '#F59E0B', job5: '#EF4444',
    job6: '#EC4899',   job7: '#14B8A6', job8: '#F97316',
    job9: '#6366F1',   job10:'#D97706'
  }
};

export const Fonts = {
  regular: 'System',
  medium:  'System',
  bold:    'System',
  sizes: {
    xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 32
  }
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999
};

export const Shadow = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4
  }
};
