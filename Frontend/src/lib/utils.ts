import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(): string {
  try {
    const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");
    return config.moeda || config.moeda_simbolo || "STN";
  } catch {
    return "STN";
  }
}

export function formatCurrency(value: number) {
  const num = Number(value) || 0;
  const moeda = getCurrencySymbol();

  const numFormatted = new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return moeda ? `${numFormatted} ${moeda}` : numFormatted;
}
