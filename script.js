
document.addEventListener("DOMContentLoaded", () => {
  const WHATSAPP_NUMBER = "917633801161";

  const cart = [];

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(amount);

  const get = (id) => document.getElementById(id);

  // Event delegation supports both the original cards and database-rendered cards.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-name][data-price]");
    if (!button) return;

    const name = button.dataset.name;
    const price = Number(button.dataset.price);
    if (!name || !Number.isFinite(price) || price < 0) return;

    const existing = cart.find((item) => item.name === name);
    if (existing) existing.quantity += 1;
    else cart.push({ name, price, quantity: 1 });

    renderCart();
    const originalText = button.textContent;
    button.textContent = "Added ✓";
    setTimeout(() => { button.textContent = originalText; }, 900);
  });

  function renderCart() {
    const cartCount = get("cartCount");
    const cartItems = get("cartItems");
    const subtotalEl = get("subtotal");
    const discountEl = get("discount");
    const grandTotalEl = get("grandTotal");

    const totalQuantity = cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // No discount is applied until a genuine offer is configured.
    const discount = 0;
    const grandTotal = subtotal - discount;

    if (cartCount) cartCount.textContent = totalQuantity;

    if (cartItems) {
      cartItems.replaceChildren();

      if (cart.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Your cart is empty. Add something delicious!";
        cartItems.appendChild(empty);
      } else {
        cart.forEach((item) => {
          const row = document.createElement("div");
          row.className = "cart-item";

          const details = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = item.name;

          const quantity = document.createElement("div");
          quantity.textContent =
            `${money(item.price)} × ${item.quantity}`;

          details.append(title, quantity);

          const actions = document.createElement("div");

          const minus = document.createElement("button");
          minus.type = "button";
          minus.textContent = "−";
          minus.setAttribute("aria-label", `Remove one ${item.name}`);
          minus.addEventListener("click", () => changeQuantity(item.name, -1));

          const count = document.createElement("span");
          count.textContent = ` ${item.quantity} `;

          const plus = document.createElement("button");
          plus.type = "button";
          plus.textContent = "+";
          plus.setAttribute("aria-label", `Add one ${item.name}`);
          plus.addEventListener("click", () => changeQuantity(item.name, 1));

          actions.append(minus, count, plus);
          row.append(details, actions);
          cartItems.appendChild(row);
        });
      }
    }

    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (discountEl) discountEl.textContent = money(discount);
    if (grandTotalEl) grandTotalEl.textContent = money(grandTotal);
  }

  function changeQuantity(name, difference) {
    const item = cart.find((entry) => entry.name === name);
    if (!item) return;

    item.quantity += difference;

    if (item.quantity <= 0) {
      const index = cart.indexOf(item);
      cart.splice(index, 1);
    }

    renderCart();
  }

  // Menu category filters
  const filterContainer = get("menuFilters");

  if (filterContainer) {
    filterContainer.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      const category = button.dataset.category || "All";

      filterContainer.querySelectorAll("button").forEach((filter) => {
        filter.classList.toggle("active", filter === button);
      });

      document.querySelectorAll("#menuGrid .product-card").forEach((card) => {
        const cardCategory = card.dataset.category || "Food";
        card.hidden =
          category !== "All" && cardCategory !== category;
      });
    });
  }

  // Create a WhatsApp message with the current order
  function buildOrderMessage(form) {
    const formData = new FormData(form);

    const customerName =
      formData.get("customerName") ||
      formData.get("name") ||
      "";

    const phone =
      formData.get("customerPhone") ||
      formData.get("phone") ||
      "";

    const orderType =
      formData.get("orderType") ||
      formData.get("serviceType") ||
      "Pickup";

    const address = formData.get("address") || "";
    const notes = formData.get("notes") || "";

    const lines = [
      "Hello Cafe Aroma!",
      "",
      "I'd like to place an order.",
      `Name: ${customerName}`,
      `Phone: ${phone}`,
      `Order type: ${orderType}`
    ];

    if (address) lines.push(`Address: ${address}`);

    lines.push("", "Order items:");

    cart.forEach((item) => {
      lines.push(
        `${item.name} × ${item.quantity} — ${money(item.price * item.quantity)}`
      );
    });

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    lines.push("", `Estimated subtotal: ${money(subtotal)}`);

    if (notes) lines.push(`Special instructions: ${notes}`);

    lines.push(
      "",
      "Please confirm availability, final price and payment details."
    );

    return lines.join("\n");
  }

  // Online order form
  const checkoutForm = get("checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (cart.length === 0) {
        alert("Please add at least one menu item before ordering.");
        return;
      }

      if (!checkoutForm.reportValidity()) return;

      const message = buildOrderMessage(checkoutForm);
      const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  // Table booking form: opens WhatsApp with the requested details
  const bookingForm = get("bookingForm");

  if (bookingForm) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!bookingForm.reportValidity()) return;

      const data = new FormData(bookingForm);
      const lines = [
        "Hello Cafe Aroma!",
        "I'd like to request a table reservation.",
        "",
        `Name: ${data.get("name") || data.get("customerName") || ""}`,
        `Phone: ${data.get("phone") || data.get("customerPhone") || ""}`,
        `Date: ${data.get("date") || ""}`,
        `Time: ${data.get("time") || ""}`,
        `Guests: ${data.get("guests") || data.get("people") || ""}`,
        `Requests: ${data.get("notes") || data.get("message") || "None"}`,
        "",
        "Please confirm my reservation."
      ];

      const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;

      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  // Initialize cart display
  renderCart();

  // Automatically update minimum booking date to today
  const bookingDate = bookingForm?.querySelector('input[type="date"]');

  if (bookingDate) {
    const today = new Date();
    const localToday = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    bookingDate.min = localToday;
  }
});
