"use client";

import { useState } from "react";
import StepField from "./StepField";

export interface AccessGateProps {
  onSuccess: () => void;
  accessKey?: string; // opzionale, per override via env / backend
}

export default function AccessGate({
  onSuccess,
  accessKey = "atelier", // default locale
}: AccessGateProps) {
  const [key, setKey] = useState("");

  return (
    <div className="space-y-6">
      <StepField
        label="Access key"
        placeholder="Invitation password"
        value={key}
        onChange={setKey}
        type="password"
      />

      <button
        onClick={() => key === accessKey && onSuccess()}
        disabled={!key}
        className="w-full py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition"
      >
        Request access
      </button>

      <p className="text-xs text-white/40 text-center">
        Access is reserved to selected ateliers.
      </p>
    </div>
  );
}
