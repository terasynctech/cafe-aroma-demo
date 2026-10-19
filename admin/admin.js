document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const client = window.getCafeAromaSupabase?.();
  const configNotice = $("configNotice");
  const loginPanel = $("loginPanel");
  const dashboardPanel = $("dashboardPanel");
  const loginForm = $("loginForm");
  const loginMessage = $("loginMessage");
  const dashboardMessage = $("dashboardMessage");
  const logoutBtn = $("logoutBtn");
  const dialog = $("itemDialog");
  const itemForm = $("itemForm");
  let cafeId = null;
  let cafeName = "Cafe Aroma";
  let menuItems = [];
  let editingItem = null;

  if (!client) {
    configNotice.hidden = false;
    loginPanel.hidden = true;
    return;
  }

  function message(el, text, kind = "") {
    el.textContent = text;
    el.className = `admin-message ${kind}`.trim();
  }

  function showLogin() {
    loginPanel.hidden = false;
    dashboardPanel.hidden = true;
    logoutBtn.hidden = true;
  }

  async function showDashboard(user) {
    const { data: memberships, error } = await client
      .from("cafe_members")
      .select("cafe_id, cafes(id,name,slug)")
      .eq("user_id", user.id);
    if (error) throw error;
    if (!memberships?.length) throw new Error("This login is not assigned to a café. Ask the project administrator to add your user to cafe_members.");

    const membership = memberships.find(row => row.cafes?.slug === "cafe-aroma") || memberships[0];
    cafeId = membership.cafe_id;
    cafeName = membership.cafes?.name || "Your Café";
    $("cafeTitle").textContent = `${cafeName} menu`;
    loginPanel.hidden = true;
    dashboardPanel.hidden = false;
    logoutBtn.hidden = false;
    await loadItems();
  }

  async function checkSession() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    if (session?.user) await showDashboard(session.user);
    else showLogin();
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    message(loginMessage, "Signing in…");
    const email = $("email").value.trim();
    const password = $("password").value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      message(loginMessage, error.message, "error");
      return;
    }
    try {
      await showDashboard(data.user);
      message(loginMessage, "");
    } catch (err) {
      await client.auth.signOut();
      message(loginMessage, err.message || "Could not load your café.", "error");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await client.auth.signOut();
    cafeId = null;
    showLogin();
    message(loginMessage, "You have been signed out.", "success");
  });

  async function loadItems() {
    message(dashboardMessage, "Loading menu…");
    const { data, error } = await client.from("menu_items")
      .select("*").eq("cafe_id", cafeId).order("sort_order", { ascending: true }).order("name");
    if (error) {
      message(dashboardMessage, error.message, "error");
      return;
    }
    menuItems = data || [];
    renderItems();
    message(dashboardMessage, `${menuItems.length} menu item${menuItems.length === 1 ? "" : "s"} loaded.`, "success");
  }

  function renderItems() {
    $("totalCount").textContent = menuItems.length;
    $("availableCount").textContent = menuItems.filter(item => item.is_available && item.is_published).length;
    $("unavailableCount").textContent = menuItems.filter(item => !item.is_available || !item.is_published).length;

    const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))].sort();
    const categorySelect = $("categoryFilter");
    const oldCategory = categorySelect.value;
    categorySelect.replaceChildren(new Option("All categories", ""));
    categories.forEach(category => categorySelect.add(new Option(category, category)));
    categorySelect.value = categories.includes(oldCategory) ? oldCategory : "";

    const query = $("searchItems").value.trim().toLowerCase();
    const category = categorySelect.value;
    const filtered = menuItems.filter(item =>
      (!query || `${item.name} ${item.description || ""}`.toLowerCase().includes(query)) &&
      (!category || item.category === category)
    );
    const tbody = $("itemsTable");
    tbody.replaceChildren();
    if (!filtered.length) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 6;
      cell.textContent = menuItems.length ? "No menu items match this filter." : "No menu items yet. Select “Add menu item” to begin.";
      return;
    }
    filtered.forEach(item => {
      const row = tbody.insertRow();
      const itemCell = row.insertCell();
      itemCell.innerHTML = "";
      const wrapper = document.createElement("div"); wrapper.className = "admin-item";
      const img = document.createElement("img");
      img.src = item.image_url || "https://placehold.co/96x84/f7f1e9/4b281d?text=Food";
      img.alt = ""; img.onerror = () => { img.src = "https://placehold.co/96x84/f7f1e9/4b281d?text=Food"; };
      const details = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = item.name;
      const desc = document.createElement("small"); desc.textContent = item.description || "";
      details.append(name, desc); wrapper.append(img, details); itemCell.append(wrapper);
      row.insertCell().textContent = item.category || "—";
      row.insertCell().textContent = new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR"}).format(Number(item.price));
      row.insertCell().append(makeStatus(item.is_published, "Published"), document.createTextNode(" "), makeToggle(item, "is_published", "Publish"));
      row.insertCell().append(makeStatus(item.is_available, "Available"), document.createTextNode(" "), makeToggle(item, "is_available", "Available"));
      const actions = row.insertCell();
      actions.className = "table-actions";
      const edit = document.createElement("button"); edit.type = "button"; edit.textContent = "Edit";
      edit.addEventListener("click", () => openEditor(item));
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Delete";
      remove.addEventListener("click", () => deleteItem(item));
      actions.append(edit, remove);
    });
  }

  function makeStatus(active, label) {
    const span = document.createElement("span");
    span.className = `status-pill${active ? "" : " off"}`;
    span.textContent = active ? "Yes" : "No";
    span.title = label;
    return span;
  }

  function makeToggle(item, field, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item[field] ? "Turn off" : "Turn on";
    button.setAttribute("aria-label", `${button.textContent} ${label.toLowerCase()} for ${item.name}`);
    button.addEventListener("click", async () => {
      button.disabled = true;
      const { error } = await client.from("menu_items").update({[field]: !item[field]}).eq("id", item.id).eq("cafe_id", cafeId);
      button.disabled = false;
      if (error) message(dashboardMessage, error.message, "error");
      else await loadItems();
    });
    return button;
  }

  $("searchItems").addEventListener("input", renderItems);
  $("categoryFilter").addEventListener("change", renderItems);
  $("addItemBtn").addEventListener("click", () => openEditor(null));
  $("closeDialog").addEventListener("click", () => dialog.close());
  $("cancelDialog").addEventListener("click", () => dialog.close());

  function openEditor(item) {
    editingItem = item;
    itemForm.reset();
    $("itemId").value = item?.id || "";
    $("dialogTitle").textContent = item ? "Edit menu item" : "Add menu item";
    $("itemName").value = item?.name || "";
    $("itemCategory").value = item?.category || "Coffee";
    $("itemPrice").value = item?.price ?? "";
    $("itemDescription").value = item?.description || "";
    $("itemBadge").value = item?.badge || "";
    $("itemPublished").checked = item?.is_published ?? true;
    $("itemAvailable").checked = item?.is_available ?? true;
    $("formMessage").textContent = "";
    dialog.showModal();
  }

  itemForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!cafeId) return;
    const saveButton = $("saveItemBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving…";
    message($("formMessage"), "Saving menu item…");
    try {
      let imageUrl = editingItem?.image_url || null;
      const file = $("itemImage").files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Please choose an image smaller than 5 MB.");
        if (!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Please upload a JPG, PNG or WebP image.");
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
        const path = `${cafeId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await client.storage.from("menu-images").upload(path, file, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = client.storage.from("menu-images").getPublicUrl(path);
        imageUrl = publicUrl.publicUrl;
      }
      const payload = {
        cafe_id: cafeId,
        name: $("itemName").value.trim(),
        category: $("itemCategory").value,
        price: Number($("itemPrice").value),
        description: $("itemDescription").value.trim(),
        badge: $("itemBadge").value.trim() || null,
        image_url: imageUrl,
        is_published: $("itemPublished").checked,
        is_available: $("itemAvailable").checked
      };
      if (!payload.name || !Number.isFinite(payload.price) || payload.price <= 0) throw new Error("Enter an item name and a valid price.");
      const result = editingItem
        ? await client.from("menu_items").update(payload).eq("id", editingItem.id).eq("cafe_id", cafeId)
        : await client.from("menu_items").insert(payload);
      if (result.error) throw result.error;
      dialog.close();
      await loadItems();
    } catch (error) {
      message($("formMessage"), error.message || "Could not save the menu item.", "error");
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Save item";
    }
  });

  async function deleteItem(item) {
    if (!confirm(`Delete "${item.name}" from the menu? This cannot be undone.`)) return;
    const { error } = await client.from("menu_items").delete().eq("id", item.id).eq("cafe_id", cafeId);
    if (error) message(dashboardMessage, error.message, "error");
    else await loadItems();
  }

  client.auth.onAuthStateChange((_event, session) => {
    if (!session && !loginPanel.hidden) return;
    if (!session) showLogin();
  });
  checkSession().catch(error => {
    showLogin();
    message(loginMessage, error.message || "Unable to check your login session.", "error");
  });
});
