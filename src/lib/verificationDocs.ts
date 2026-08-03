/**
 * Secure access to the private `verification-documents` bucket.
 *
 * Objects are never exposed as public URLs. We mint short-lived signed
 * URLs (5 minutes) through Supabase Storage; the `verification docs admin
 * read` RLS policy (migration 0006) is what authorizes an admin's client
 * to create them. Paths are validated so callers can only ever sign
 * objects inside the verification folder.
 */

import { supabase } from "./supabase";
import { AdminError } from "./adminApi";

export const VERIFICATION_DOCUMENTS_BUCKET = "verification-documents";
export const SIGNED_URL_TTL_SECONDS = 300; // ~5 minutes
export const SIGNED_URL_TTL_MS = SIGNED_URL_TTL_SECONDS * 1000;

/** Documents are image or PDF objects inside `verification/<user>/...`. */
export function isVerificationDocumentPath(path: string | null | undefined): path is string {
  if (!path) return false;
  return path.startsWith("verification/") && !path.includes("..") && !path.includes("\0");
}

export function isPdfPath(path: string | null | undefined): boolean {
  return isVerificationDocumentPath(path) && path.toLowerCase().endsWith(".pdf");
}

/**
 * Mint a signed URL for a private verification document.
 * The URL expires after ~5 minutes and is safe to render directly.
 */
export async function createVerificationSignedUrl(
  path: string,
  expiresInSeconds = SIGNED_URL_TTL_SECONDS,
): Promise<{ signedUrl: string; expiresAt: number }> {
  if (!isVerificationDocumentPath(path)) {
    throw new AdminError("Invalid document reference.");
  }

  const { data, error } = await supabase.storage
    .from(VERIFICATION_DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new AdminError("Couldn't open the document — you may not have access to it.");
  }

  return {
    signedUrl: data.signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
}