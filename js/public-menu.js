/*
 * If Supabase is configured, replace the sample cards with published, available
 * items from the database. If it is not configured or fails, the original demo
 * menu remains visible.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const client = window.getCafeAromaSupabase?.();
  const grid = document.getElementById("menuGrid");
  const filters = document.getElementById("menuFilters");
  if (!client || !grid || !filters) return;

  try {
    const { data: cafes, error: cafeError } = await client
      .from("cafes").select("id,slug").eq("slug", "cafe-aroma").limit(1);
    if (cafeError || !cafes?.length) return;

    const { data: items, error } = await client
      .from("menu_items")
      .select("id,name,description,category,price,image_url,badge,is_available,is_published,sort_order")
      .eq("cafe_id", cafes[0].id)
      .eq("is_available", true)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !items?.length) return;

    const categories = ["All", ...new Set(items.map(item => item.category).filter(Boolean))];
    filters.replaceChildren();
    categories.forEach((category, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-btn${index === 0 ? " active" : ""}`;
      button.dataset.category = category;
      button.textContent = index === 0 ? "All Items" : category;
      filters.appendChild(button);
    });

    grid.replaceChildren();
    items.forEach(item => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.dataset.category = item.category || "Food";

      const img = document.createElement("img");
      img.src = item.image_url || "https://placehold.co/800x600/f7f1e9/4b281d?text=Cafe+Aroma";
      img.alt = item.name;
      img.loading = "lazy";
      img.onerror = () => { img.src = "https://placehold.co/800x600/f7f1e9/4b281d?text=Cafe+Aroma"; };

      const info = document.createElement("div");
      info.className = "product-info";
      const badge = document.createElement("span");
      badge.className = "product-category";
      badge.textContent = item.badge || "CAFE FAVOURITE";
      const title = document.createElement("h3");
      title.textContent = item.name;
      const description = document.createElement("p");
      description.textContent = item.description || "";
      const bottom = document.createElement("div");
      bottom.className = "product-bottom";
      const price = document.createElement("strong");
      price.textContent = new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 2
      }).format(Number(item.price));
      const add = document.createElement("button");
      add.className = "add-btn";
      add.type = "button";
      add.dataset.name = item.name;
      add.dataset.price = String(item.price);
      add.textContent = "+ Add";
      bottom.append(price, add);
      info.append(badge, title, description, bottom);
      card.append(img, info);
      grid.appendChild(card);
    });
  } catch (error) {
    console.warn("Cafe Aroma is using its built-in demo menu.", error);
  }
});
