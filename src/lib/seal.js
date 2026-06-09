// Deterministic JSON canonicalization (RFC 8785-lite: sorted keys, no whitespace,
// arrays in source order). Sufficient for SHA-256 root hashing of a bundle.
export function canonicalize(value) {
    if (value === null || typeof value !== "object")
        return JSON.stringify(value);
    if (Array.isArray(value))
        return "[" + value.map(canonicalize).join(",") + "]";
    const obj = value;
    const keys = Object.keys(obj).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}
export async function sha256Hex(input) {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function rootHash(bundleWithoutHash) {
    return sha256Hex(canonicalize(bundleWithoutHash));
}
