import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "TBA";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(date: Date | string | null): string {
  if (!date) return "To Be Announced";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function daysUntil(date: Date | string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDeadlineUrgency(
  deadline: Date | string | null
): "closed" | "urgent" | "soon" | "warning" | "safe" | "unknown" {
  if (!deadline) return "unknown";
  const days = daysUntil(deadline);
  if (days === null) return "unknown";
  if (days < 0) return "closed";
  if (days <= 7) return "urgent";
  if (days <= 15) return "soon";
  if (days <= 30) return "warning";
  return "safe";
}

export function getFundingLevel(type: string): string {
  const levels: Record<string, string> = {
    "fully-funded": "Fully Funded",
    "fully-tuition": "Full Tuition",
    "partial-tuition": "Partial Tuition",
    "stipend": "Stipend",
    "living-expenses": "Living Expenses",
    "travel": "Travel Grant",
    "accommodation": "Accommodation",
    "research-funding": "Research Funding",
    "mixed": "Mixed Funding",
  };
  return levels[type] || type;
}

export function getMatchColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-primary-600";
  if (score >= 40) return "text-amber-600";
  return "text-gray-500";
}

export function getMatchBg(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-primary-50 border-primary-200";
  if (score >= 40) return "bg-amber-50 border-amber-200";
  return "bg-gray-50 border-gray-200";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getVerificationBadge(status: string) {
  switch (status) {
    case "Verified Recently":
      return { label: "Verified", variant: "success" as const, icon: "🟢" };
    case "Verification Needed":
      return { label: "Verify", variant: "warning" as const, icon: "🟡" };
    case "Potentially Expired":
      return { label: "Expired?", variant: "error" as const, icon: "🔴" };
    default:
      return { label: status, variant: "outline" as const, icon: "⚪" };
  }
}

export function getDeadlineBadgeColor(urgency: string): string {
  switch (urgency) {
    case "closed": return "bg-red-100 text-red-700";
    case "urgent": return "bg-red-100 text-red-700";
    case "soon": return "bg-amber-100 text-amber-700";
    case "warning": return "bg-yellow-100 text-yellow-700";
    case "safe": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export function getDeadlineLabel(urgency: string): string {
  switch (urgency) {
    case "closed": return "Closed";
    case "urgent": return "Closing Soon";
    case "soon": return "In 1-2 Weeks";
    case "warning": return "This Month";
    case "safe": return "Open";
    default: return "Unknown";
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}
