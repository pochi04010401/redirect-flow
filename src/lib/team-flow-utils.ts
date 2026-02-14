import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNowJST(): Date {
  const now = new Date();
  const jstOffset = 9 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (jstOffset * 60000));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const jst = new Date(utc + (9 * 60 * 60000));
  
  const year = jst.getFullYear();
  const month = String(jst.getMonth() + 1).padStart(2, '0');
  const day = String(jst.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateJP(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const jst = new Date(utc + (9 * 60 * 60000));
  return `${jst.getFullYear()}年${jst.getMonth() + 1}月${jst.getDate()}日`;
}

export function getCurrentMonth(): string {
  const now = getNowJST();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatCurrency(amount: number): string {
  const kAmount = Math.floor(amount / 1000);
  return new Intl.NumberFormat('ja-JP').format(kAmount) + '千円';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export async function fireConfetti(): Promise<void> {
  const confetti = (await import('canvas-confetti')).default;
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
  const fire = (particleRatio: number, opts: any) => {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  };
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export const MEMBER_COLORS = [
  '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4', '#957DAD', '#D4A5A5',
] as const;

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#f8fafc';
}
