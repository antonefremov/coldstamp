import { deleteAll, deleteBundle, listBundles } from "../lib/db";
import type { EvidenceBundle } from "../lib/types";

const fmtTime = (t: number) => new Date(t).toLocaleString();

function render(bundles: EvidenceBundle[]) {
  const list = document.getElementById("list")!;
  list.textContent = "";
  if (bundles.length === 0) {
    const div = document.createElement("div");
    div.className = "empty";
    div.textContent = "No bundles captured yet. Visit a checkout page and click a subscribe/pay button.";
    list.appendChild(div);
    return;
  }
  for (const b of bundles) {
    const row = document.createElement("div");
    row.className = "row";

    const title = document.createElement("div");
    title.innerHTML = `<strong></strong>`;
    title.querySelector("strong")!.textContent = b.merchantDomain;
    row.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "meta";
    const flagged = b.controlState.filter(
      (c) => (c.type === "checkbox" || c.type === "radio") && c.defaultChecked && !c.userInteracted
    ).length;
    const charges = b.networkCharges.length;
    meta.textContent = `${fmtTime(b.capturedAt)} · ${flagged} pre-checked & untouched · ${charges} payment req(s)`;
    row.appendChild(meta);

    const hash = document.createElement("div");
    hash.className = "hash";
    hash.textContent = `sha256:${b.rootHash}`;
    row.appendChild(hash);

    const actions = document.createElement("div");
    actions.style.marginTop = "6px";

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export";
    exportBtn.onclick = () => {
      const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bundle-${b.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    actions.appendChild(exportBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = async () => {
      await deleteBundle(b.id);
      void refresh();
    };
    actions.appendChild(delBtn);

    row.appendChild(actions);
    list.appendChild(row);
  }
}

async function refresh() {
  render(await listBundles());
}

document.getElementById("delete-all")!.addEventListener("click", async () => {
  if (!confirm("Delete all captured bundles?")) return;
  await deleteAll();
  void refresh();
});

void refresh();
