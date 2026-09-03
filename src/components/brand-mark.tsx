type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 42 42"
      fill="none"
    >
      <circle cx="21" cy="21" r="20" fill="currentColor" />
      <path
        d="M28.9 14.4a10.2 10.2 0 1 0 0 13.2 8.1 8.1 0 1 1 0-13.2Z"
        fill="#FFF8EE"
      />
      <circle cx="29.4" cy="13.2" r="2.4" fill="#F3B65C" />
    </svg>
  );
}
