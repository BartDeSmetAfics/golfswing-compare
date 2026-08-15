"use client";

import { useEffect, useState } from "react";

interface Pro {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  selected: string | null;
  onSelect: (proId: string) => void;
}

export default function ProSelector({ selected, onSelect }: Props) {
  const [pros, setPros] = useState<Pro[]>([]);

  useEffect(() => {
    fetch("/api/pros")
      .then((r) => r.json())
      .then(setPros);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-green-200 text-sm font-medium">Compare with:</p>
      <div className="flex flex-wrap gap-2">
        {pros.map((pro) => (
          <button
            key={pro.id}
            onClick={() => onSelect(pro.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              selected === pro.id
                ? "bg-green-500 text-white"
                : "bg-green-900 text-green-200 hover:bg-green-800"
            }`}
          >
            {pro.name}
          </button>
        ))}
      </div>
    </div>
  );
}
