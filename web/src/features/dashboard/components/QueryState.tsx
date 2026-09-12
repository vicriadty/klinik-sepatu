import type { ReactNode } from "react";
import Button from "../../../components/ui/button/Button";

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyText: string;
  onRetry: () => void;
  children: ReactNode;
}

export default function QueryState({
  isLoading,
  isError,
  isEmpty,
  emptyText,
  onRetry,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">
        Memuat…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gagal memuat data.
        </p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Coba lagi
        </Button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
      </div>
    );
  }

  return <>{children}</>;
}
