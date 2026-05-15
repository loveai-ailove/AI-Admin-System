import { z } from "zod";

export const statusValues = ["ACTIVE", "DISABLED"] as const;
export const menuTypeValues = ["DIRECTORY", "MENU", "BUTTON"] as const;

export const statusSchema = z.enum(statusValues);
export const menuTypeSchema = z.enum(menuTypeValues);

export const optionalString = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .optional();

export function normalizeOptional(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
