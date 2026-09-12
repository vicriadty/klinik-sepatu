interface PlaceholderPageProps {
  title: string;
  description: string;
}

/**
 * Temporary section shell. Each route gets a real feature page in its
 * own phase; this only proves routing, layout, and role gating work.
 */
export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      <p className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-400">
        Halaman dalam pengembangan.
      </p>
    </div>
  );
}
