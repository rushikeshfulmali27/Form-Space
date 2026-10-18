// Pure component settings. Saved values are centimeters; geometry uses meters.
import { getPartsProfile, partDefinitions } from "./parts-registry.js";
export { getPartsProfile, partDefinitions };
export const supportsParts = (d) => getPartsProfile(d) !== null;
export function partDefaults(d) {
  return getPartsProfile(d)?.defaults(d) || {};
}
export function partLimits(d, id, key) {
  const profile = getPartsProfile(d);
  if (!profile) throw Error("This object has no editable parts.");
  return profile.limits(d, id, key);
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
  const definitions = partDefinitions(d);
  for (const [id, values] of Object.entries(input)) {
    if (
      !Object.hasOwn(definitions, id) ||
      !values ||
      typeof values !== "object" ||
      Array.isArray(values)
    ) {
      if (strict) fail();
      continue;
    }
    const part = {};
    for (const [key, value] of Object.entries(values)) {
      if (definitions[id].fields.includes(key)) {
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
