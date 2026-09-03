type StarOutlineProps = {
  className?: string;
};

export function StarOutline({ className = "" }: StarOutlineProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 2.8 2.72 5.52 6.09.89-4.41 4.3 1.04 6.07L12 16.72l-5.44 2.86 1.04-6.07-4.41-4.3 6.09-.89L12 2.8Z" />
    </svg>
  );
}
