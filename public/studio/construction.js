import { getPartsProfile, partDefinitions } from "./parts-registry.js";

export const constructionFields = (d) => getPartsProfile(d)?.construction || {};
export function normalizeConstruction(d, input, strict = false) {
  const fields = constructionFields(d),
    keys = Object.keys(fields);
  const fail = () => {
    throw Error("Invalid construction settings for this object.");
  };
  if (
    input !== undefined &&
    (!keys.length ||
      !input ||
      typeof input !== "object" ||
      Array.isArray(input))
  ) {
    if (strict) fail();
    input = undefined;
  }
  if (
    strict &&
    input !== undefined &&
    (Object.keys(input).length !== keys.length ||
      Object.keys(input).some((key) => !Object.hasOwn(fields, key)))
  )
    fail();
  if (!keys.length) return undefined;
  return Object.fromEntries(
    keys.map((key) => {
      const f = fields[key],
        value = input?.[key];
      if (
        strict &&
        input !== undefined &&
        (typeof value !== "number" ||
          !Number.isInteger(value) ||
          value < f.min ||
          value > f.max)
      )
        fail();
      const number =
        typeof value === "number" && Number.isFinite(value)
          ? Math.max(f.min, Math.min(f.max, Math.round(value)))
          : f.default(d);
      return [key, number];
    }),
  );
}
export function setConstruction(d, key, value) {
  if (!Object.hasOwn(constructionFields(d), key))
    throw Error("Unsupported construction control.");
  const next = {
    ...d,
    construction: normalizeConstruction(d, { ...d.construction, [key]: value }),
  };
  const active = partDefinitions(next);
  if (d.parts)
    next.parts = Object.fromEntries(
      Object.entries(d.parts).filter(([id]) => Object.hasOwn(active, id)),
    );
  return next;
}
