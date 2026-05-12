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

function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="inline-block w-3.5 h-3.5 mr-0.5 -mt-0.5"
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
}

export default function EventLocation({ address, location, className = "" }: Props) {
  if (address) {
    const text = `${REGION_LABELS[address.region as keyof typeof REGION_LABELS] ?? address.region}·${address.name}`;
    if (isSafeUrl(address.map_url)) {
      return (
        <a
          href={address.map_url!}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center text-brand hover:underline ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <PinIcon />{text}
        </a>
      );
    }
    return (
      <span className={`inline-flex items-center ${className}`}>
        <PinIcon />{text}
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
        className={`inline-flex items-center text-brand hover:underline ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <PinIcon />地圖
      </a>
    );
  }

  return <span className={className}>{location}</span>;
}
