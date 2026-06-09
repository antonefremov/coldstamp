// Corner-pinned, non-blocking warning panel. Shadow-DOM isolated so site CSS
// can't override us. Re-rendered idempotently when findings change.
const HOST_ID = "__coldstamp_panel_host__";
const SEVERITY_COLOR = { high: "#c53030", medium: "#b7791f", low: "#4a5568" };
let dismissedKey = null;
function findingsKey(findings) {
    return findings.map((f) => `${f.id}::${f.selector}`).sort().join("|");
}
export function render(findings) {
    if (findings.length === 0) {
        unmount();
        return;
    }
    const key = findingsKey(findings);
    if (key === dismissedKey)
        return;
    const host = ensureHost();
    const root = host.shadowRoot;
    root.innerHTML = template(findings);
    const closeBtn = root.querySelector(".close");
    closeBtn?.addEventListener("click", () => {
        dismissedKey = key;
        unmount();
    });
}
export function unmount() {
    const host = document.getElementById(HOST_ID);
    if (host)
        host.remove();
}
function ensureHost() {
    let host = document.getElementById(HOST_ID);
    if (host)
        return host;
    host = document.createElement("div");
    host.id = HOST_ID;
    // The host itself takes no space; the panel inside is positioned fixed.
    host.style.cssText = "all: initial; position: fixed; top: 0; right: 0; z-index: 2147483647;";
    host.attachShadow({ mode: "open" });
    document.documentElement.appendChild(host);
    return host;
}
function template(findings) {
    const top = findings[0];
    const rest = findings.slice(1);
    const restHtml = rest
        .map((f) => `
      <div class="row sev-${f.severity}">
        <div class="dot"></div>
        <div class="body">
          <div class="title">${escapeHtml(f.title)}</div>
          <div class="detail">${escapeHtml(f.detail)}</div>
        </div>
      </div>`)
        .join("");
    return `
    <style>
      :host, * { box-sizing: border-box; }
      .panel {
        position: fixed; top: 16px; right: 16px; width: 340px;
        font: 13px/1.45 -apple-system, system-ui, "Segoe UI", sans-serif;
        background: #fff; color: #111;
        border: 1px solid #e2e8f0; border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        max-height: 80vh; overflow: auto;
      }
      .header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 12px; border-bottom: 1px solid #edf2f7;
      }
      .brand { font-weight: 600; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: #4a5568; }
      .close {
        background: none; border: 0; cursor: pointer; padding: 2px 6px;
        font-size: 16px; color: #718096; border-radius: 4px;
      }
      .close:hover { background: #edf2f7; color: #1a202c; }
      .row { display: flex; gap: 10px; padding: 12px; border-bottom: 1px solid #f7fafc; }
      .row:last-child { border-bottom: 0; }
      .dot {
        flex: 0 0 8px; width: 8px; height: 8px; border-radius: 50%; margin-top: 6px;
      }
      .sev-high .dot { background: ${SEVERITY_COLOR.high}; }
      .sev-medium .dot { background: ${SEVERITY_COLOR.medium}; }
      .sev-low .dot { background: ${SEVERITY_COLOR.low}; }
      .body { flex: 1; min-width: 0; }
      .title { font-weight: 600; color: #1a202c; margin-bottom: 2px; }
      .detail { color: #4a5568; font-size: 12px; }
      .reco { margin-top: 6px; font-size: 12px; color: #2d3748; font-style: italic; }
      .count { font-size: 11px; color: #718096; padding: 6px 12px 10px; }
    </style>
    <div class="panel" role="dialog" aria-label="ColdStamp warnings">
      <div class="header">
        <div class="brand">ColdStamp</div>
        <button class="close" aria-label="Dismiss">×</button>
      </div>
      <div class="row sev-${top.severity}">
        <div class="dot"></div>
        <div class="body">
          <div class="title">${escapeHtml(top.title)}</div>
          <div class="detail">${escapeHtml(top.detail)}</div>
          <div class="reco">${escapeHtml(top.recommendation)}</div>
        </div>
      </div>
      ${restHtml}
      <div class="count">${findings.length} finding${findings.length === 1 ? "" : "s"} on this page</div>
    </div>
  `;
}
function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
