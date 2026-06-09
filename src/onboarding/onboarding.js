import { getConsent, setConsent, PRIVACY_POLICY_URL, POLICY_VERSION, } from "../lib/consent";
const ageEl = document.getElementById("age");
const captureEl = document.getElementById("capture");
const buttonEl = document.getElementById("get-started");
const policyLinkEl = document.getElementById("policy-link");
const policyVersionEl = document.getElementById("policy-version");
policyLinkEl.href = PRIVACY_POLICY_URL;
policyVersionEl.textContent = POLICY_VERSION;
// Pre-fill from any existing state — supports re-opening from settings later.
(async () => {
    const state = await getConsent();
    ageEl.checked = state.ageConfirmedAt !== null;
    captureEl.checked = state.purposes.core_protection !== null;
    updateButton();
})();
ageEl.addEventListener("change", updateButton);
function updateButton() {
    buttonEl.disabled = !ageEl.checked;
}
buttonEl.addEventListener("click", async () => {
    if (!ageEl.checked)
        return;
    const now = Date.now();
    const current = await getConsent();
    await setConsent({
        policyVersion: POLICY_VERSION,
        onboardingCompletedAt: now,
        ageConfirmedAt: current.ageConfirmedAt ?? now,
        purposes: {
            core_protection: captureEl.checked
                ? current.purposes.core_protection ?? now
                : null,
        },
    });
    // Close this tab on completion.
    try {
        const tab = await chrome.tabs.getCurrent();
        if (tab?.id != null)
            chrome.tabs.remove(tab.id);
    }
    catch {
        window.close();
    }
});
