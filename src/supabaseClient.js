import { createClient } from "@supabase/supabase-js";

// ──────────────────────────────────────────────────────────────
//  Supabase ได้อัปเดต API Key format ใหม่ (2025)
//
//  ใส่ค่าจาก Supabase Dashboard → Settings → API Keys
//
//  SUPABASE_URL        → Project URL  (https://xxxx.supabase.co)
//  SUPABASE_PUBLISHABLE_KEY → Publishable key  (sb_publishable_...)
//                             ✅ ใช้ใน React / browser ได้ปลอดภัย
//
//  ❌ อย่าใส่ Secret key (sb_secret_...) ในโค้ด React เด็ดขาด
// ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";

// รองรับทั้ง key format ใหม่ (sb_publishable_) และเก่า (anon key)
const SUPABASE_KEY =
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "";

const isValidKey =
  SUPABASE_KEY.startsWith("sb_publishable_") ||   // format ใหม่
  SUPABASE_KEY.startsWith("eyJ");                  // format เก่า (JWT)

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") && isValidKey;

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
