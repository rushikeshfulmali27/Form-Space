// Pure component settings. Saved values are centimeters; geometry uses meters.
export const PARTS = {
  tabletop: { label: "Tabletop", fields: ["thickness"] },
  column: { label: "Support column", fields: ["diameter"] },
  base: { label: "Base assembly", fields: ["width", "depth"] },
};
export const supportsParts = (d) => d?.id === "cafe-table";
const cm = (value) => Math.round(value * 100) / 100;
export function partDefaults(d) {
  return {
    tabletop: {
      thickness: Math.min(4.5, d.height * 0.08),
      color: d.color,
      material: d.material,
    },
    column: {
      diameter: cm(Math.min(d.width, d.depth) * 0.15),
      color: d.accent,
      material: "matte",
    },
    base: {
      width: cm(d.width * 0.68),
      depth: cm(d.depth * 0.68),
      color: d.accent,
      material: "matte",
    },
  };
}
export function partLimits(d, id, key) {
  if (id === "tabletop" && key === "thickness")
    return [0.5, Math.min(12, d.height - 10)];
  if (id === "column" && key === "diameter")
    return [0.5, Math.min(d.width, d.depth) * 0.4];
  if (id === "base" && ["width", "depth"].includes(key))
    return [d[key] * 0.25, d[key]];
  throw Error("Unsupported part dimension.");
}
export function normalizeParts(d, input, materials, strict = false) {
  if (input === undefined) return {};
  const fail = () => {
    throw Error("Invalid part settings for this object.");
  };
  if (
    !supportsParts(d) ||
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  )
    return strict ? fail() : {};
  const out = {};
  for (const [id, values] of Object.entries(input)) {
    if (
      !Object.hasOwn(PARTS, id) ||
      !values ||
      typeof values !== "object" ||
      Array.isArray(values)
    ) {
      if (strict) fail();
      continue;
    }
    const part = {};
    for (const [key, value] of Object.entries(values)) {
      if (PARTS[id].fields.includes(key)) {
        const [min, max] = partLimits(d, id, key);
        if (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          (strict && (value < min || value > max))
        ) {
          if (strict) fail();
          continue;
        }
        part[key] = Math.round(Math.max(min, Math.min(max, value)) * 100) / 100;
      } else if (
        key === "color" &&
        typeof value === "string" &&
        /^#[0-9a-f]{6}$/i.test(value)
      )
        part.color = value.toLowerCase();
      else if (
        key === "material" &&
        typeof value === "string" &&
        Object.hasOwn(materials, value)
      )
        part.material = value;
      else if (strict) fail();
    }
    if (Object.keys(part).length) out[id] = part;
  }
  return out;
}
export function resolveParts(d) {
  const defaults = partDefaults(d);
  return Object.fromEntries(
    Object.entries(defaults).map(([id, p]) => [id, { ...p, ...d.parts?.[id] }]),
  );
}
export function editPart(d, id, key, value) {
  return {
    ...d,
    parts: { ...d.parts, [id]: { ...d.parts?.[id], [key]: value } },
  };
}
export function resetPart(d, id) {
  const parts = { ...d.parts };
  delete parts[id];
  return { ...d, parts };
}
