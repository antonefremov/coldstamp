// Single source of truth for consent state. Stored in chrome.storage.local so
// it survives across sessions. All fields default to "not granted" (null).
//
// Withdrawal is just setting the timestamp back to null. We do not currently
// retain a withdrawal log; if/when audit requirements demand it, change this
// shape to a list of {grantedAt, withdrawnAt} records keyed by purpose.

export const PRIVACY_POLICY_URL =
  "https://antonefremov.github.io/coldstamp-site/privacy.html";

export const POLICY_VERSION = "1.0";

export type ConsentState = {
  policyVersion: string;
  onboardingCompletedAt: number | null;
  ageConfirmedAt: number | null;
  // Map of purpose code → timestamp granted (null = not granted).
  purposes: {
    core_protection: number | null;
  };
};

const DEFAULT_STATE: ConsentState = {
  policyVersion: POLICY_VERSION,
  onboardingCompletedAt: null,
  ageConfirmedAt: null,
  purposes: { core_protection: null },
};

const STORAGE_KEY = "consent";

export async function getConsent(): Promise<ConsentState> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([STORAGE_KEY], (raw) => {
        const stored = raw?.[STORAGE_KEY] as Partial<ConsentState> | undefined;
        resolve({
          ...DEFAULT_STATE,
          ...(stored ?? {}),
          purposes: { ...DEFAULT_STATE.purposes, ...(stored?.purposes ?? {}) },
        });
      });
    } catch {
      resolve(DEFAULT_STATE);
    }
  });
}

export async function setConsent(next: ConsentState): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: next }, () => resolve());
    } catch {
      resolve();
    }
  });
}

export function hasCapture(state: ConsentState): boolean {
  return (
    state.onboardingCompletedAt !== null &&
    state.ageConfirmedAt !== null &&
    state.purposes.core_protection !== null
  );
}
