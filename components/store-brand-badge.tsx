import React from "react";

interface StoreBrandBadgeProps {
  storeName: string;
  className?: string;
}

export function StoreBrandBadge({ storeName, className = "h-7" }: StoreBrandBadgeProps) {
  const name = storeName.toLowerCase();

  if (name.includes("flipkart")) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <svg viewBox="0 0 100 32" className="h-full w-auto fill-current text-[#2874F0]" aria-label="Flipkart">
          <g>
            {/* Iconic Flipkart Yellow Bag with F */}
            <path
              d="M16 4C14.343 4 13 5.343 13 7V9H8C6.895 9 6 9.895 6 11L9 27C9.18 27.96 10.02 28.67 11 28.67H25C25.98 28.67 26.82 27.96 27 27L30 11C30 9.895 29.105 9 28 9H23V7C23 5.343 21.657 4 20 4H16ZM15 7C15 6.448 15.448 6 16 6H20C20.552 6 21 6.448 21 7V9H15V7ZM14 13H22V15H17V17H21V19H17V24H14V13Z"
              fill="#F9A825"
            />
            {/* Wordmark typography */}
            <text x="34" y="22" fontFamily="sans-serif" fontSize="17" fontWeight="800" fill="#2874F0" letterSpacing="-0.5">
              Flipkart
            </text>
          </g>
        </svg>
      </div>
    );
  }

  if (name.includes("amazon")) {
    return (
      <div className={`flex items-center ${className}`}>
        <svg viewBox="0 0 100 32" className="h-full w-auto fill-current" aria-label="Amazon">
          <g>
            <text x="4" y="21" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="currentColor" letterSpacing="-0.5">
              amazon
            </text>
            {/* Iconic smile arrow */}
            <path
              d="M10 26C24 30.5 44 30.5 58 24C59.5 23.3 61.2 24.8 60 26C45 33 22 33 8 27.5C6.8 27 7.5 25.2 10 26Z"
              fill="#FF9900"
            />
            <path
              d="M56 22L62 25L60 20Z"
              fill="#FF9900"
            />
          </g>
        </svg>
      </div>
    );
  }

  if (name.includes("myntra")) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <svg viewBox="0 0 100 32" className="h-full w-auto" aria-label="Myntra">
          <g>
            {/* Myntra M logo mark */}
            <path
              d="M7 24L12 11C12.5 9.8 13.8 9.5 14.8 10.3L19 13.5L23.2 10.3C24.2 9.5 25.5 9.8 26 11L31 24C31.5 25.2 30.6 26.5 29.3 26.5H26.8C25.8 26.5 25 25.8 24.7 24.9L22.2 17L19.8 18.8C19.3 19.2 18.7 19.2 18.2 18.8L15.8 17L13.3 24.9C13 25.8 12.2 26.5 11.2 26.5H8.7C7.4 26.5 6.5 25.2 7 24Z"
              fill="#FF3F6C"
            />
            <text x="36" y="22" fontFamily="sans-serif" fontSize="17" fontWeight="800" fill="currentColor" letterSpacing="-0.5">
              Myntra
            </text>
          </g>
        </svg>
      </div>
    );
  }

  if (name.includes("ajio")) {
    return (
      <div className={`flex items-center ${className}`}>
        <svg viewBox="0 0 80 32" className="h-full w-auto" aria-label="Ajio">
          <g>
            <text x="4" y="22" fontFamily="sans-serif" fontSize="20" fontWeight="900" fill="currentColor" letterSpacing="1">
              AJIO
            </text>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <span className="font-extrabold text-sm tracking-tight text-foreground">
      {storeName}
    </span>
  );
}
