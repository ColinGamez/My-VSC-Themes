import { useMemo, useState } from "react";

type Swatch = {
  name: string;
  value: `#${string}`;
  locked?: boolean;
};

const initialSwatches: Swatch[] = [
  { name: "Ember", value: "#ff7a18", locked: true },
  { name: "Citrus", value: "#ffbc42" },
  { name: "Peach", value: "#ffd9a8" }
];

export function PalettePanel() {
  const [selected, setSelected] = useState(initialSwatches[0]);
  const cssVariables = useMemo(
    () => initialSwatches.map((swatch) => `--${swatch.name.toLowerCase()}: ${swatch.value};`),
    []
  );

  return (
    <section aria-label="Theme palette">
      <h2>{selected.name}</h2>
      <button type="button" onClick={() => setSelected(initialSwatches[1])}>
        Use citrus
      </button>
      <pre>{cssVariables.join("\n")}</pre>
    </section>
  );
}
