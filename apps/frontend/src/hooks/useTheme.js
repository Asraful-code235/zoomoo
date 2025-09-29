import { useTheme as useThemeContext } from '../contexts/ThemeContext';

// Re-export the theme hook for convenience
export const useTheme = useThemeContext;

// Theme utility functions
export const themeUtils = {
  // Get theme-aware class names
  getThemeClasses: (lightClasses, darkClasses) => {
    return `${lightClasses} dark:${darkClasses}`;
  },

  // Get background classes for different surfaces
  getBgClasses: (surface = 'primary') => {
    const surfaces = {
      primary: 'bg-white dark:bg-gray-900',
      secondary: 'bg-gray-50 dark:bg-gray-800',
      tertiary: 'bg-gray-100 dark:bg-gray-700',
      card: 'bg-white dark:bg-gray-800',
      modal: 'bg-white dark:bg-gray-900',
      overlay: 'bg-black/60 dark:bg-black/80',
    };
    return surfaces[surface] || surfaces.primary;
  },

  // Get text classes for different text types
  getTextClasses: (type = 'primary') => {
    const textTypes = {
      primary: 'text-gray-900 dark:text-white',
      secondary: 'text-gray-600 dark:text-gray-300',
      tertiary: 'text-gray-500 dark:text-gray-400',
      muted: 'text-gray-400 dark:text-gray-500',
      inverse: 'text-white dark:text-gray-900',
    };
    return textTypes[type] || textTypes.primary;
  },

  // Get border classes
  getBorderClasses: (type = 'default') => {
    const borderTypes = {
      default: 'border-gray-200 dark:border-gray-700',
      light: 'border-gray-100 dark:border-gray-800',
      strong: 'border-gray-300 dark:border-gray-600',
      accent: 'border-primary-200 dark:border-primary-700',
    };
    return borderTypes[type] || borderTypes.default;
  },

  // Get button classes
  getButtonClasses: (variant = 'primary') => {
    const variants = {
      primary: 'bg-primary-500 hover:bg-primary-600 text-white border-primary-500 hover:border-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 dark:border-primary-600 dark:hover:border-primary-700',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 hover:border-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:border-gray-500',
      success: 'bg-success-500 hover:bg-success-600 text-white border-success-500 hover:border-success-600 dark:bg-success-600 dark:hover:bg-success-700 dark:border-success-600 dark:hover:border-success-700',
      danger: 'bg-danger-500 hover:bg-danger-600 text-white border-danger-500 hover:border-danger-600 dark:bg-danger-600 dark:hover:bg-danger-700 dark:border-danger-600 dark:hover:border-danger-700',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent hover:border-gray-300 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600',
    };
    return variants[variant] || variants.primary;
  },

  // Get input classes
  getInputClasses: () => {
    return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400';
  },

  // Get shadow classes
  getShadowClasses: (type = 'default') => {
    const shadowTypes = {
      default: 'shadow-sm dark:shadow-gray-900/20',
      medium: 'shadow-md dark:shadow-gray-900/30',
      large: 'shadow-lg dark:shadow-gray-900/40',
      xl: 'shadow-xl dark:shadow-gray-900/50',
    };
    return shadowTypes[type] || shadowTypes.default;
  },

  // Get navigation classes
  getNavClasses: (isActive = false) => {
    if (isActive) {
      return 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white';
    }
    return 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800';
  },

  // Get card classes
  getCardClasses: () => {
    return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/20';
  },
};

export default useTheme;
