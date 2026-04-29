import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPesos(pesos: number) {
  return `₱${Math.round(pesos).toLocaleString("en-PH")}`;
}

export function formatCents(cents: number) {
  return formatPesos(cents / 100);
}

export function formatLocalYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseLocalYMD(dateString: string) {
  const [y, m, d] = dateString.split("-").map((v) => parseInt(v, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}
