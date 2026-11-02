import { prisma } from "./prisma";

/**
 * Generates a clean, unique username guaranteed not to collide with any existing user in SQLite.
 * Uses preferredUsername if provided, or derives from email, name, or phone.
 */
export async function generateSafeUsername(
  preferredUsername?: string | null,
  name?: string | null,
  phone?: string | null,
  email?: string | null
): Promise<string> {
  let base = "";
  if (preferredUsername && preferredUsername.trim()) {
    base = preferredUsername.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
  }
  if (!base && email && email.includes("@")) {
    base = email.split("@")[0].toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
  }
  if (!base && name && name.trim()) {
    base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, ".");
  }
  if (!base && phone && phone.trim()) {
    const cleanDigits = phone.trim().replace(/[^0-9]/g, "");
    base = `assoc.${cleanDigits.slice(-6) || cleanDigits}`;
  }
  if (!base) {
    base = `assoc.${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Ensure base length is at least 3 characters
  if (base.length < 3) {
    base = `${base}.${Math.floor(100 + Math.random() * 900)}`;
  }

  // Ensure uniqueness in database
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.user.findFirst({
      where: { username: candidate },
    });
    if (!existing) {
      return candidate;
    }
    counter++;
    candidate = `${base}.${counter}`;
  }
}
