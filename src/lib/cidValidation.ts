// CID validation patterns
// CIDs can be CIDv0 (starts with Q) or CIDv1 (starts with z for base58btc encoding)
const CID_PATTERN = /^[zQ][a-zA-Z0-9]{44,98}$/;

export interface CidValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a CID (Content Identifier) string
 * @param cid - The CID string to validate
 * @returns Validation result with error message if invalid
 */
export function validateCid(cid: string): CidValidationResult {
  const trimmed = cid.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'CID cannot be empty' };
  }

  if (trimmed.length < 46) {
    return { valid: false, error: 'CID is too short' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'CID is too long' };
  }

  if (!CID_PATTERN.test(trimmed)) {
    return { valid: false, error: 'Invalid CID format. Must start with z or Q.' };
  }

  return { valid: true };
}

/**
 * Quick check if text looks like a CID without detailed validation
 * @param text - Text to check
 * @returns True if text matches CID pattern
 */
export function isCidLike(text: string): boolean {
  return CID_PATTERN.test(text.trim());
}
