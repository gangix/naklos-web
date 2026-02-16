/**
 * Badge helper utilities for responsive badge sizing
 */

export const getBadgeSize = (count: number): {
  sizeClass: string;
  textClass: string;
  positionClass: string;
} => {
  if (count < 10) {
    return {
      sizeClass: 'w-6 h-6',
      textClass: 'text-sm',
      positionClass: '-top-2 -right-2'
    };
  } else if (count < 100) {
    return {
      sizeClass: 'w-8 h-8',
      textClass: 'text-sm font-bold',
      positionClass: '-top-2 -right-2'
    };
  } else {
    return {
      sizeClass: 'w-10 h-10',
      textClass: 'text-xs font-bold',
      positionClass: '-top-3 -right-3'
    };
  }
};
