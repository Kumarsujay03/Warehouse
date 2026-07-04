import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-10 w-10",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizes[size]}
      >
        {/* Warehouse/box shape */}
        <rect
          x="3"
          y="8"
          width="26"
          height="20"
          rx="2"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Roof/top */}
        <path
          d="M2 10L16 3L30 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Shelves */}
        <line x1="7" y1="16" x2="25" y2="16" stroke="hsl(0 0% 7%)" strokeWidth="1.5" />
        <line x1="7" y1="21" x2="25" y2="21" stroke="hsl(0 0% 7%)" strokeWidth="1.5" />
        {/* Door/opening */}
        <rect x="12" y="22" width="8" height="6" rx="1" fill="hsl(0 0% 7%)" />
      </svg>
      {showText && (
        <span className={cn("font-semibold tracking-tight", textSizes[size])}>
          Warehouse
        </span>
      )}
    </div>
  );
}
