// Shared ID helper: string IDs keep MongoDB and the JSON fallback store compatible
// (existing data like "plant_1" / "user_..." keeps working in both engines).
export const genId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
export const stringId = (prefix) => ({ type: String, default: () => genId(prefix) });
