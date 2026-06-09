// Pure DOM-reading helpers. No mutation. Used by detectors and the capture
// pipeline. Ported and tightened from TrueCost's util.js.
export function text(el) {
    if (!el)
        return "";
    const raw = el.innerText || el.textContent || "";
    return raw.replace(/\s+/g, " ").trim().toLowerCase();
}
// Best-effort accessible label for a form control.
export function labelFor(input) {
    const aria = input.getAttribute("aria-label");
    if (aria && aria.trim())
        return aria.trim().toLowerCase();
    const labelledby = input.getAttribute("aria-labelledby");
    if (labelledby) {
        const parts = labelledby
            .split(/\s+/)
            .map((id) => document.getElementById(id))
            .filter((n) => !!n)
            .map((n) => text(n));
        const joined = parts.join(" ").trim();
        if (joined)
            return joined;
    }
    if (input.id) {
        const lbl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (lbl)
            return text(lbl);
    }
    const wrap = input.closest("label");
    if (wrap)
        return text(wrap);
    const row = input.closest("li, tr, .row, .form-row, div, p, span");
    if (row) {
        const t = text(row);
        if (t && t.length < 240)
            return t;
    }
    return "";
}
const PRICE_RE = /(?:A\$|AU\$|US\$|[$£€¥₹])\s?(\d{1,4}(?:[.,]\d{2})?)/i;
export function parsePrice(str) {
    if (!str)
        return null;
    const m = str.match(PRICE_RE);
    if (!m || !m[1])
        return null;
    const amount = parseFloat(m[1].replace(",", "."));
    if (isNaN(amount))
        return null;
    let cadence = null;
    if (/\/\s?mo\b|per month|a month|monthly|\/month/i.test(str))
        cadence = "month";
    else if (/\/\s?yr\b|per year|a year|annually|yearly|\/year/i.test(str))
        cadence = "year";
    else if (/\/\s?wk\b|per week|a week|weekly|\/week/i.test(str))
        cadence = "week";
    return { amount, cadence, raw: m[0] };
}
export function findPriceNodes(root = document.body) {
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const v = node.nodeValue;
            if (!v)
                return NodeFilter.FILTER_REJECT;
            return /(?:A\$|AU\$|US\$|[$£€¥₹])\s?\d/.test(v)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
        },
    });
    let n;
    while ((n = walker.nextNode())) {
        const el = n.parentElement;
        if (!el || !n.nodeValue)
            continue;
        const price = parsePrice(n.nodeValue);
        if (price)
            out.push({ el, price, text: n.nodeValue.trim() });
        if (out.length > 200)
            break;
    }
    return out;
}
function luminance(r, g, b) {
    const a = [r, g, b].map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function parseRGB(str) {
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m || !m[1])
        return null;
    const parts = m[1].split(",").map((x) => parseFloat(x));
    return {
        r: parts[0] ?? 0,
        g: parts[1] ?? 0,
        b: parts[2] ?? 0,
        a: parts.length > 3 ? parts[3] ?? 1 : 1,
    };
}
function effectiveBg(el) {
    let node = el;
    while (node && node !== document.documentElement) {
        const bg = parseRGB(getComputedStyle(node).backgroundColor || "");
        if (bg && bg.a > 0)
            return bg;
        node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
}
export function contrastRatio(el) {
    const cs = getComputedStyle(el);
    const fg = parseRGB(cs.color) || { r: 0, g: 0, b: 0, a: 1 };
    const bg = effectiveBg(el);
    const l1 = luminance(fg.r, fg.g, fg.b);
    const l2 = luminance(bg.r, bg.g, bg.b);
    const hi = Math.max(l1, l2);
    const lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
}
export function fontSize(el) {
    return parseFloat(getComputedStyle(el).fontSize) || 0;
}
export function isVisible(el) {
    if (!el)
        return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0")
        return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
}
export function elSelector(el) {
    if (!el || el === document.documentElement)
        return "html";
    const id = el.id;
    if (id)
        return `#${id}`;
    const name = el.name;
    const tag = el.tagName.toLowerCase();
    return name ? `${tag}[name="${name}"]` : tag;
}
export function truncate(s, n) {
    s = (s || "").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
