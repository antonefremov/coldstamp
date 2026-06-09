// Preventative-layer detectors. Run continuously on checkout-like pages and
// produce Findings consumed by the in-page panel. Deliberately NOT sealed into
// the EvidenceBundle — capture stays neutral, classification is derived and
// re-runnable over stored bundles later.
import { lexicon, containsAny } from "../lib/lexicon";
import { contrastRatio, findPriceNodes, fontSize, isVisible, labelFor, parsePrice, text, truncate, } from "../lib/dom";
function selectorOf(el) {
    if (!el)
        return "";
    const id = el.id;
    if (id)
        return `#${id}`;
    return el.tagName.toLowerCase();
}
export function isCheckoutLikePage() {
    const url = (location.pathname + location.search).toLowerCase();
    if (/check\s?out|subscribe|signup|sign-up|join|cart|billing|payment|upgrade|plan|order|purchase/.test(url)) {
        return true;
    }
    if (document.querySelector('input[autocomplete="cc-number"], input[name*="card" i], input[id*="card" i], ' +
        'iframe[src*="stripe" i], iframe[src*="braintree" i], iframe[src*="paypal" i], ' +
        'iframe[src*="adyen" i], iframe[title*="card" i], iframe[name*="card" i]')) {
        return true;
    }
    const btns = Array.from(document.querySelectorAll('button, input[type="submit"], a[role="button"]'));
    return btns.some((b) => /pay|subscribe|start (free|trial)|place order|complete (order|purchase)|continue to payment|join now|upgrade/i.test(text(b) || b.value || ""));
}
// ---- Detector 1: pre-selected recurring opt-in ------------------------------
function detectPreselectedRecurring() {
    const out = [];
    const checked = document.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
    checked.forEach((input) => {
        if (!isVisible(input))
            return;
        const label = labelFor(input);
        if (!label)
            return;
        const recHit = containsAny(label, lexicon.recurrence);
        const addonHit = containsAny(label, lexicon.addon);
        if (recHit) {
            out.push({
                id: "preselected-recurring",
                severity: "high",
                title: "A recurring charge is pre-ticked",
                detail: `An option that signs you up for a repeating charge is already selected ` +
                    `("${truncate(label, 90)}"). You did not choose it — the page chose it for you.`,
                recommendation: "Untick this before continuing unless you want it.",
                selector: selectorOf(input),
            });
        }
        else if (addonHit) {
            out.push({
                id: "preselected-addon",
                severity: "medium",
                title: "An add-on is pre-ticked",
                detail: `An optional extra is already selected for you ("${truncate(label, 90)}"). ` +
                    `This usually adds to your total.`,
                recommendation: "Untick it if you didn't ask for it.",
                selector: selectorOf(input),
            });
        }
    });
    return out;
}
// ---- Detector 2: trial-to-paid conversion -----------------------------------
function detectTrialConversion() {
    const out = [];
    const bodyText = text(document.body);
    if (!containsAny(bodyText, lexicon.trialCta))
        return out;
    const priceNodes = findPriceNodes(document.body);
    for (const { el, price } of priceNodes) {
        const ctxEl = el.closest("div, section, li, p, form") || el;
        const ctx = text(ctxEl);
        const convHit = containsAny(ctx, lexicon.conversion);
        if (convHit && price.cadence) {
            const daysMatch = ctx.match(/(\d{1,3})[ -]?(day|week|month)s?\s+(?:free|trial)|(?:free|trial)[^.]{0,20}?(\d{1,3})[ -]?(day|week|month)s?/);
            let when = "after the trial ends";
            if (daysMatch) {
                const num = daysMatch[1] || daysMatch[3];
                const unit = daysMatch[2] || daysMatch[4];
                if (num)
                    when = `in ${num} ${unit}${num === "1" ? "" : "s"}`;
            }
            out.push({
                id: "trial-conversion",
                severity: "medium",
                title: "Free now, then a real charge",
                detail: `This "free" offer converts to ${price.raw}/${price.cadence} ${when}. ` +
                    `That price is on the page but de-emphasised next to the word "free".`,
                recommendation: "Note the renewal date and set a reminder, or cancel before it.",
                selector: selectorOf(el),
            });
            break;
        }
    }
    return out;
}
// ---- Detector 3: visually de-emphasised recurring price ---------------------
function detectBuriedPrice() {
    const out = [];
    const nodes = findPriceNodes(document.body).filter((n) => isVisible(n.el));
    if (nodes.length < 2)
        return out;
    const recurring = nodes.filter((n) => n.price.cadence);
    if (!recurring.length)
        return out;
    let headline = null;
    for (const n of nodes) {
        const fs = fontSize(n.el);
        if (!headline || fs > headline.fs)
            headline = { el: n.el, fs };
    }
    if (!headline)
        return out;
    for (const r of recurring) {
        const rFs = fontSize(r.el);
        const rContrast = contrastRatio(r.el);
        const muchSmaller = rFs > 0 && headline.fs / rFs >= 1.8;
        const lowContrast = rContrast < 3.0;
        if ((muchSmaller || lowContrast) && r.el !== headline.el) {
            out.push({
                id: "buried-price",
                severity: "medium",
                title: "The recurring price is hidden in the fine print",
                detail: `The ongoing cost (${r.price.raw}/${r.price.cadence}) is shown much smaller ` +
                    `or fainter than the headline price. That's a common way to make a ` +
                    `subscription look like a one-off.`,
                recommendation: "Read the small print — that's the price you'll keep paying.",
                selector: selectorOf(r.el),
            });
            break;
        }
    }
    return out;
}
// ---- Detector 4: total exceeds sum of line items ----------------------------
function detectTotalMismatch() {
    const out = [];
    const labels = Array.from(document.querySelectorAll("*")).filter((el) => {
        if (el.children.length > 3)
            return false;
        const t = text(el);
        return t === "total" || t === "order total" || t === "amount due" || t === "grand total";
    });
    if (!labels.length)
        return out;
    const nodes = findPriceNodes(document.body).filter((n) => isVisible(n.el));
    if (nodes.length < 3)
        return out;
    let totalVal = 0;
    for (const lab of labels) {
        const row = lab.closest("tr, li, .row, div");
        if (!row)
            continue;
        const p = parsePrice(text(row));
        if (p && p.amount > totalVal)
            totalVal = p.amount;
    }
    if (!totalVal)
        return out;
    const items = nodes.map((n) => n.price.amount).filter((a) => a > 0 && a < totalVal);
    const sum = items.reduce((s, a) => s + a, 0);
    if (sum > 0 && totalVal - sum > Math.max(1, sum * 0.05) && totalVal - sum < totalVal) {
        out.push({
            id: "total-mismatch",
            severity: "high",
            title: "The total is more than the items add up to",
            detail: `Your items total about ${sum.toFixed(2)}, but the order total is ` +
                `${totalVal.toFixed(2)}. The extra often comes from a pre-added fee, ` +
                `donation, or protection plan you didn't choose.`,
            recommendation: "Find the extra line item before paying — it may be removable.",
            selector: selectorOf(labels[0]),
        });
    }
    return out;
}
// ---- Detector 5: confirmshaming / asymmetric decline ------------------------
function detectConfirmshaming() {
    const out = [];
    const candidates = Array.from(document.querySelectorAll('a, button, span[role="button"], [role="button"]')).filter(isVisible);
    for (const el of candidates) {
        const t = text(el);
        if (!t || t.length > 120)
            continue;
        if (containsAny(t, lexicon.confirmshame)) {
            out.push({
                id: "confirmshaming",
                severity: "low",
                title: "Guilt-trip decline button",
                detail: `The "no" option is worded to make you feel bad for declining ` +
                    `("${truncate(t, 80)}"). That's a manipulation tactic, not information.`,
                recommendation: "Ignore the wording. Declining is a normal, valid choice.",
                selector: selectorOf(el),
            });
            break;
        }
    }
    return out;
}
export function runDetectors() {
    const findings = [];
    const detectors = [
        detectPreselectedRecurring,
        detectTrialConversion,
        detectBuriedPrice,
        detectTotalMismatch,
        detectConfirmshaming,
    ];
    for (const d of detectors) {
        try {
            findings.push(...d());
        }
        catch (e) {
            console.debug("[ColdStamp] detector error", d.name, e);
        }
    }
    return dedupe(findings);
}
const RANK = { high: 0, medium: 1, low: 2 };
function dedupe(findings) {
    const seen = new Set();
    const out = [];
    for (const f of findings) {
        const key = `${f.id}::${f.selector}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(f);
    }
    out.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
    return out;
}
