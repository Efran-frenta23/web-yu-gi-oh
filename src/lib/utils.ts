import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';

export { clsx, twMerge, tv };

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
