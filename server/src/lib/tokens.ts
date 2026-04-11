import { customAlphabet } from "nanoid";

// URL-safe alphabet, 21 chars → ~126 bits of entropy
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 21);

export function generateShareToken(): string {
  return nanoid();
}
