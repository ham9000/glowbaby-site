type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-balance font-display text-[clamp(2.5rem,6vw,5.25rem)] leading-[0.98] tracking-[-0.055em] text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-6 text-pretty text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}
