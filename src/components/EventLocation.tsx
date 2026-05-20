import type { Address } from "../types";
import { REGION_LABELS } from "../utils/labels";

function isSafeUrl(s: string | null | undefined): boolean {
  if (!s) return false;
  try {
    const url = new URL(s);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`inline-block w-4 h-4 mr-0.5 shrink-0 ${className}`}
    >
      <path
        fillRule="evenodd"
        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.697 3.5-8.327a8 8 0 10-16 0c0 3.63 1.556 6.314 3.5 8.327a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface Props {
  address: Address | null;
  location: string | null;
  className?: string;
  truncate?: boolean;
}

export default function EventLocation({ address, location, className = "", truncate = false }: Props) {
  const outerCls = truncate ? `flex items-center gap-0.5 min-w-0 ${className}` : className;
  const textCls = truncate ? "truncate min-w-0" : "";

  if (address) {
    const text = `${REGION_LABELS[address.region as keyof typeof REGION_LABELS] ?? address.region}·${address.name}`;
    if (isSafeUrl(address.map_url)) {
      return (
        <a
          href={address.map_url!}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-gray-700 hover:text-gray-900 underline underline-offset-2 decoration-gray-300 hover:decoration-gray-500 transition-colors ${outerCls}`}
          onClick={(e) => e.stopPropagation()}
        >
          <PinIcon className={`text-gray-400 -mt-0.5 ${truncate ? "" : "inline"}`} />
          <span className={textCls}>{text}</span>
        </a>
      );
    }
    return (
      <span className={outerCls}>
        <PinIcon className={`text-gray-400 -mt-0.5 ${truncate ? "" : "inline"}`} />
        <span className={textCls}>{text}</span>
      </span>
    );
  }

  if (!location) return null;

  if (isSafeUrl(location)) {
    return (
      <a
        href={location}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-gray-700 hover:text-gray-900 underline underline-offset-2 decoration-gray-300 hover:decoration-gray-500 transition-colors ${outerCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        <PinIcon className={`text-gray-400 -mt-0.5 ${truncate ? "" : "inline"}`} />
        <span>地圖</span>
      </a>
    );
  }

  return (
    <span className={outerCls}>
      <span className={textCls}>{location}</span>
    </span>
  );
}
