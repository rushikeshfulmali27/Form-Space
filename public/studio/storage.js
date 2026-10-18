import { fresh, serialize, deserialize } from "./design.js";
export const STORE = "form-studio.workspace.v2";
export const LEGACY_STORE = "form-studio.workspace.v1";
export function loadWorkspace(storage) {
  try {
    let text = storage.getItem(STORE);
    if (text === null) {
      text = storage.getItem(LEGACY_STORE);
      if (text !== null) {
        try {
          const design = deserialize(text);
          return { design, status: saveWorkspace(storage, design) };
        } catch {
          return { design: fresh(), status: "corrupt" };
        }
      }
    }
    if (text === null) return { design: fresh(), status: "new" };
    try {
      return { design: deserialize(text), status: "saved" };
    } catch {
      return { design: fresh(), status: "corrupt" };
    }
  } catch {
    return { design: fresh(), status: "unavailable" };
  }
}
export function saveWorkspace(storage, design) {
  try {
    storage.setItem(STORE, serialize(design));
    return "saved";
  } catch {
    return "unavailable";
  }
}
export const storageMessage = (status) =>
  ({
    saved: "Saved on this device",
    new: "Not saved yet · edits save locally",
    corrupt: "Saved data is invalid · export new edits to keep them",
    unavailable: "Storage unavailable · export to keep edits",
    editing: "Editing · not saved yet",
  })[status];
