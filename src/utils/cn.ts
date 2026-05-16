import clsx, { type ClassValue } from 'clsx';

/** Tiny classnames helper — alias of clsx. Keeps imports short. */
export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}
