"use client";

import React from "react";

export interface StepFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

export default function StepField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: StepFieldProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs text-white/50">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-4 rounded-lg bg-black/40 border border-white/10 text-base text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
      />
    </div>
  );
}
