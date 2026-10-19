/*
 * Cafe Aroma backend configuration.
 * Replace these two placeholders with the Project URL and publishable/anon key
 * from Supabase Project Settings -> API. Never put a service_role/secret key here.
 */
window.CAFE_AROMA_SUPABASE_URL = "https://foftznkwnkaqtmpwfgqt.supabase.co";
window.CAFE_AROMA_SUPABASE_ANON_KEY = "sb_publishable_qBx0t-W7yLAU0XPuAmgjew_-Q2p2gWn";

window.getCafeAromaSupabase = function () {
  const url = window.CAFE_AROMA_SUPABASE_URL;
  const key = window.CAFE_AROMA_SUPABASE_ANON_KEY;
  if (!window.supabase || !url || !key ||
      url.includes("YOUR_SUPABASE") || key.includes("YOUR_SUPABASE")) return null;
  if (!window.__cafeAromaSupabase) {
    window.__cafeAromaSupabase = window.supabase.createClient(url, key);
  }
  return window.__cafeAromaSupabase;
};
