"use client";

export interface FieldProps {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-white/50">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
      />
    </div>
  );
}
