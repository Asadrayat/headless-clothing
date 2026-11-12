const LINES = [
  {
    title: 'Made for golf and tennis',
    body: 'Polos, skorts, vests and mandarin-collar jackets in tech-stretch fabrics.',
    dot: 'bg-court',
  },
  {
    title: 'Prints with personality',
    body: 'Dots, argyle and geo prints in colors like Fruit Punch, Bluebelle and Candy Apple.',
    dot: 'bg-punch',
  },
  {
    title: 'Classic, with New York energy',
    body: 'A clean navy and white base, with bright pops where they count.',
    dot: 'bg-sun',
  },
];

export function BrandStrip() {
  return (
    <section
      aria-labelledby="brand-heading"
      className="rounded-2xl bg-ink px-6 py-10 text-paper md:px-10 md:py-12"
    >
      <h2 className="sr-only" id="brand-heading">
        About EP NY
      </h2>
      <div className="grid gap-8 md:grid-cols-3 md:gap-10">
        {LINES.map((line) => (
          <div className="flex gap-4" key={line.title}>
            <span
              aria-hidden="true"
              className={`mt-1.5 size-3 shrink-0 rounded-full ${line.dot}`}
            />
            <div>
              <h3 className="m-0 text-base leading-snug font-semibold">
                {line.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-paper/75">
                {line.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
