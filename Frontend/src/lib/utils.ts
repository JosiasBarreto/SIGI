import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getCurrencySymbol(): string {
  try {
    const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");
    return config.moeda || config.moeda_simbolo || "";
  } catch {
    return "";
  }
}

export function formatCurrency(value: number) {
  const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: config.moeda || "STN",
    useGrouping: true,
  }).format(value);
}
