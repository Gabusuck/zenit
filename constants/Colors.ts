const tintColorLight = '#4CAF50';
const tintColorDark = '#4CAF50';

export default {
  light: {
    text: '#333333',
    background: '#F5F5F5',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: tintColorLight,
    secondary: '#1b5e20', // Darker Green
    card: '#FFFFFF',
    separator: '#E0E0E0',
  },
  dark: {
    // For now, mapping Dark to look like Light Green as requested ("do EVERYTHING with this palette")
    // or we can make a proper dark mode. 
    // Given the request "do EVERYTHING with this palette", I will make dark mode follow the same green branding but with dark backgrounds 
    // OR just enforce light mode look if "palette" implies the white background too.
    // The user manually set background to #000 in Colors.ts but #f2f2f2 in profile.
    // I will set a proper Dark Green theme here just in case, but the app likely forces Light/Green look via the refactors.
    text: '#fff',
    background: '#121212',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: tintColorDark,
    secondary: '#81C784',
    card: '#1E1E1E',
    separator: '#333333',
  },
};
