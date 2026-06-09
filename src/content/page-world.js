"use strict";
// Runs in the PAGE world (not the extension's isolated world) so it can patch
// window.fetch and XMLHttpRequest. Posts observed payment-ish requests to the
// content script via window.postMessage.
(() => {
    const TAG = "__CS_NET__";
    const PAYMENT_HINTS = [
        "stripe.com",
        "braintree",
        "paypal.com",
        "adyen",
        "checkout",
        "subscription",
        "payment",
        "charge",
        "intent",
    ];
    const isPaymentish = (url) => {
        const u = url.toLowerCase();
        return PAYMENT_HINTS.some((h) => u.includes(h));
    };
    const post = (payload) => {
        window.postMessage({ __cs: TAG, payload }, "*");
    };
    const safeStringifyBody = (body) => {
        try {
            if (body == null)
                return "";
            if (typeof body === "string")
                return body;
            if (body instanceof URLSearchParams)
                return body.toString();
            if (body instanceof FormData) {
                const out = {};
                body.forEach((v, k) => (out[k] = typeof v === "string" ? v : "[file]"));
                return JSON.stringify(out);
            }
            return JSON.stringify(body);
        }
        catch {
            return "";
        }
    };
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
        try {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
            if (url && isPaymentish(url)) {
                post({
                    kind: "fetch",
                    t: Date.now(),
                    url,
                    method: (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase(),
                    body: safeStringifyBody(init?.body),
                });
            }
        }
        catch { }
        return origFetch.apply(this, arguments);
    };
    const OrigXHR = window.XMLHttpRequest;
    function PatchedXHR() {
        const xhr = new OrigXHR();
        let _url = "";
        let _method = "GET";
        const origOpen = xhr.open;
        xhr.open = function (method, url) {
            _method = method.toUpperCase();
            _url = url;
            return origOpen.apply(xhr, arguments);
        };
        const origSend = xhr.send;
        xhr.send = function (body) {
            try {
                if (_url && isPaymentish(_url)) {
                    post({ kind: "xhr", t: Date.now(), url: _url, method: _method, body: safeStringifyBody(body) });
                }
            }
            catch { }
            return origSend.apply(xhr, arguments);
        };
        return xhr;
    }
    // Preserve prototype for instanceof checks
    PatchedXHR.prototype = OrigXHR.prototype;
    window.XMLHttpRequest = PatchedXHR;
})();
