// Fake-checkout behaviour. Lives in an external file so strict CSP environments
// (Vite dev server, certain extensions) don't block it.

const s = document.createElement("script");
s.src = "https://js.stripe.com/v3/?fake=1";
s.onerror = () => {};
document.head.appendChild(s);

document.getElementById("decline").addEventListener("click", (e) => {
  e.preventDefault();
  alert("Glad you stayed (fake).");
});

document.getElementById("checkout").addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = new URLSearchParams({
    amount: "1999",
    currency: "usd",
    "recurring[interval]": "month",
    "payment_method_data[type]": "card",
    "payment_method_data[card][number]": (fd.get("cardnumber") || "").toString(),
    "payment_method_data[card][cvc]": (fd.get("cvc") || "").toString(),
  });
  fetch("/_fake/stripe/payment_intents", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  }).catch(() => {});
  setTimeout(
    () => alert("Subscribed (fake). Open the extension popup to see the captured bundle."),
    200
  );
});
