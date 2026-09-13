import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import Label from "./Label";
import { CalenderIcon } from "../../icons";

interface DateFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

/**
 * Controlled single-date field backed by flatpickr (dark-mode safe:
 * the popup is styled via `.dark .flatpickr-calendar` in index.css).
 * Empty value means "no date selected".
 */
export default function DateField({
  id,
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  disabled = false,
}: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const instanceRef = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inputRef.current) return;
    const instance = flatpickr(inputRef.current, {
      dateFormat: "Y-m-d",
      allowInput: true,
      clickOpens: !disabled,
      onChange: (dates: Date[]) => {
        const [selected] = dates;
        onChangeRef.current(
          selected ? flatpickr.formatDate(selected, "Y-m-d") : ""
        );
      },
    });
    instanceRef.current = instance;
    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
  }, [id, disabled]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    const [selected] = instance.selectedDates;
    const current = selected
      ? flatpickr.formatDate(selected, "Y-m-d")
      : "";
    if (current !== value) {
      if (value === "") {
        instance.clear();
      } else {
        instance.setDate(value, false);
      }
    }
  }, [value]);

  useEffect(() => {
    instanceRef.current?.set("minDate", min || undefined);
    instanceRef.current?.set("maxDate", max || undefined);
  }, [min, max]);

  const clear = () => {
    instanceRef.current?.clear();
    onChange("");
  };

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-16 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
        />
        {value !== "" && !disabled ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Hapus tanggal"
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        ) : null}
        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
