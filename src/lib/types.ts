export type ControlSnapshot = {
  tag: string;
  type: string;
  name: string;
  id: string;
  autocomplete: string;
  labelText: string;
  checked: boolean | null;
  defaultChecked: boolean | null;
  value: string;
  defaultValue: string;
  userInteracted: boolean;
  rect: { x: number; y: number; w: number; h: number } | null;
};

export type InteractionEvent = {
  t: number;
  kind: "click" | "focus" | "scroll" | "change";
  target: string;
};

export type NetworkCharge = {
  t: number;
  url: string;
  method: string;
  amount: number | null;
  currency: string | null;
  recurring: boolean | null;
  intervalText: string | null;
  rawBodyDigest: string;
};

export type DisclosureVisibility = {
  query: string;
  text: string;
  inViewportAtConsent: boolean;
};

export type EvidenceBundle = {
  id: string;
  schemaVersion: 2;
  capturedAt: number;
  merchantDomain: string;
  pageUrl: string;
  pageTitle: string;
  // Derived locally before redaction: a partial obfuscation of the email
  // (or analogous identifier) the user submitted, like "an…@gmail.com".
  // Lets the user link a bundle to an account at the merchant without
  // exposing the full email inside the sealed bundle. May be null if no
  // email field was present or filled.
  merchantAccountHint: string | null;
  controlState: ControlSnapshot[];
  interactionLog: InteractionEvent[];
  networkCharges: NetworkCharge[];
  disclosureVisibility: DisclosureVisibility[];
  screenshotDataUrl: string | null;
  rootHash: string;
  anchor: null;
};
