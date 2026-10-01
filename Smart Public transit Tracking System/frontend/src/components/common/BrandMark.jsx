import Image from "next/image";

export function BrandMark({ size = 40, className = "", priority = false }) {
  return (
    <Image
      src="/smart-transit-logo.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      priority={priority}
      className={`shrink-0 rounded-xl ${className}`}
    />
  );
}
