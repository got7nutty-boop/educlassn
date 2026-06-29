import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ── Design tokens ──────────────────────────────────────────────────────────
// Palette: ฟ้า (#2563EB) + ขาว (#FFFFFF) — เรียบง่าย สะอาด สไตล์ออฟฟิศ
// Type: system-ui body
// Signature: เส้นกรอบบาง + เงาเบา ไม่มี glow effect

// ══════════════════════════════════════════════════════════════════════════
//  รูปภาพสไลด์หน้า Login (ฝั่งซ้าย)
//  ── แก้ไขตรงนี้ได้เลยเมื่อมีรูปจริงจากโรงเรียน ──
//  ใส่ลิงก์รูปแทนที่ url เดิม / เพิ่มหรือลด object ในนี้ได้ตามต้องการ
// ══════════════════════════════════════════════════════════════════════════
const LOGIN_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    caption: "บรรยากาศการเรียนการสอนในห้องเรียน",
  },
  {
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80",
    caption: "กิจกรรมกลุ่มเสริมทักษะการเรียนรู้",
  },
  {
    url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200&q=80",
    caption: "ห้องปฏิบัติการและการฝึกทักษะวิชาชีพ",
  },
  {
    url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200&q=80",
    caption: "งานแสดงผลงานและกิจกรรมนักเรียน",
  },
];

const COLORS = {
  // โทนหลัก — ฟ้า-ขาว
  navy: "#2563EB",        // ฟ้าหลัก (ใช้แทนที่ navy เดิม)
  navyLight: "#3B82F6",
  navyMid: "#F8FAFC",     // พื้นหลังการ์ด (ขาวอมฟ้าอ่อนมาก)

  // Accent — ใช้ฟ้าเฉดเดียวแทนสีสันหลากหลาย
  cyan: "#2563EB",
  cyanDim: "#1D4ED8",
  cyanGlow: "rgba(37,99,235,0.08)",
  cyanBorder: "rgba(37,99,235,0.3)",

  violet: "#2563EB",
  violetLight: "#60A5FA",
  violetGlow: "rgba(37,99,235,0.08)",

  emerald: "#2563EB",
  emeraldLight: "#60A5FA",
  emeraldGlow: "rgba(37,99,235,0.08)",

  amber: "#2563EB",
  amberLight: "#60A5FA",
  amberGlow: "rgba(37,99,235,0.08)",

  // การ์ด/พื้นผิว — ขาวล้วน มีเส้นกรอบบาง
  glass: "#FFFFFF",
  glassBorder: "#E2E8F0",
  glassBorderBright: "#CBD5E1",
  glassMid: "#F1F5F9",

  // ตัวอักษร — เข้มบนพื้นขาว อ่านง่ายสุด
  white: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",

  // สถานะ (คงสีแดง/เขียวไว้เพื่อความชัดเจนของผิด/ถูก)
  red: "#DC2626",
  redGlow: "rgba(220,38,38,0.08)",
  green: "#16A34A",
  greenGlow: "rgba(22,163,74,0.08)",

  // Legacy aliases
  saffron: "#2563EB",
  saffronLight: "rgba(37,99,235,0.08)",
  jade: "#2563EB",
  jadeLight: "rgba(37,99,235,0.08)",
  bg: "#F1F5F9",
  slate: "#475569",
  slateLight: "rgba(71,85,105,0.08)",
  redLight: "rgba(220,38,38,0.08)",
  greenLight: "rgba(22,163,74,0.08)",

  // Aliases เพิ่มเติมที่ใช้ใน Sidebar และส่วนอื่น (กันพลาด undefined)
  border: "#E2E8F0",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
};

// Gradient presets — ใช้สีฟ้าเฉดเดียวแทน gradient หลายสี
const G = {
  cyan: "#2563EB",
  emerald: "#2563EB",
  amber: "#2563EB",
  violet: "#2563EB",
  mesh: "#F1F5F9",
  sidebarBg: "#FFFFFF",
};

// ── Data helpers ─────────────────────────────────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────

const callClaude = async (messages, systemPrompt = "") => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
};

const profileToUser = (profile, authUser) => ({
  id: profile.id,
  name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
  role: profile.role,
  subject: profile.subject || "",
  department: profile.department || "",
  level: profile.level || "",
  class: profile.classroom || "",
  username: authUser?.email || "",
  email: authUser?.email || "",
});

const loadUserProfile = async (authUser) => {
  if (!supabase || !authUser) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !data) return null;
  return profileToUser(data, authUser);
};


// ── Supabase Data Helpers ──────────────────────────────────────────────────

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
};

const dbToAnnouncement = (r) => ({
  id: r.id, author: r.author_name, authorId: r.author_id,
  subject: r.subject, body: r.body, pinned: r.pinned,
  isSpecial: r.is_special || false,
  imageUrl: r.image_url || null,
  date: formatDate(r.created_at),
});

const dbToNotification = (r) => ({
  id: r.id, userId: r.user_id, announcementId: r.announcement_id,
  title: r.title, body: r.body, isRead: r.is_read,
  date: formatDate(r.created_at), createdAt: r.created_at,
});

const dbToExercise = (r) => ({
  id: r.id, title: r.title, subject: r.subject,
  author: r.author_name, authorId: r.author_id,
  dueDate: r.due_date, description: r.description,
  questions: r.questions || [],
});

const dbToSubmission = (r) => ({
  id: r.id, exerciseId: r.exercise_id,
  studentId: r.student_id, studentName: r.student_name,
  answers: r.answers || {}, score: r.score, maxScore: r.max_score,
  percentage: r.percentage, comment: r.comment,
  results: r.results || [], date: formatDate(r.created_at),
});

const dbToMessage = (r) => ({
  id: r.id, from: r.from_name, fromId: r.from_id,
  to: r.to_label, text: r.text,
  date: formatDate(r.created_at), type: r.msg_type || "broadcast",
});

const dbToComment = (r) => ({
  id: r.id, announcementId: r.announcement_id,
  userId: r.user_id, userName: r.user_name, userRole: r.user_role,
  text: r.text, date: formatDate(r.created_at),
});

const dbToLesson = (r) => ({
  id: r.id, title: r.title, subject: r.subject,
  author: r.author_name, authorId: r.author_id,
  description: r.description,
  videoUrl: r.video_url || "", fileUrl: r.file_url || "", fileName: r.file_name || "",
  date: formatDate(r.created_at),
});

// helper: แปลงลิงก์ YouTube ทั่วไปให้เป็นลิงก์ embed
// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line no-unused-vars
const toEmbedUrl = (url) => {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
};

// helper: ดึง YouTube video ID เพื่อโหลด thumbnail
const getYoutubeThumbnail = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
};

// helper: เช็คว่าไฟล์เป็นรูปภาพหรือไม่ จากชื่อไฟล์
const isImageFile = (fileName) => {
  if (!fileName) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
};

// ── Components ─────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const isTeacher = role === "teacher";
  return (
    <span style={{
      background: isTeacher ? COLORS.amberLight : COLORS.blueLight,
      color: isTeacher ? COLORS.amber : COLORS.blue,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      padding: "3px 10px", borderRadius: 20,
    }}>
      {isTeacher ? "ครู" : "นักเรียน"}
    </span>
  );
}

function Card({ children, style, accent, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: COLORS.glass,
      borderRadius: 12,
      border: `1px solid ${COLORS.glassBorder}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      overflow: "hidden",
      position: "relative",
      transition: "box-shadow 0.2s ease",
      ...style,
    }}>
      {accent && (
        <div style={{
          height: 3,
          background: accent,
        }} />
      )}
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md", disabled, style }) {
  const base = {
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 8, fontWeight: 600, transition: "background 0.15s ease",
    fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
    opacity: disabled ? 0.5 : 1,
    fontSize: size === "sm" ? 12 : 14,
    padding: size === "sm" ? "6px 14px" : "10px 20px",
    ...style,
  };
  const variants = {
    primary: { background: COLORS.navy, color: COLORS.white },
    saffron: { background: COLORS.navy, color: COLORS.white },
    jade: { background: COLORS.navy, color: COLORS.white },
    ghost: { background: COLORS.glassMid, color: COLORS.textPrimary, border: `1px solid ${COLORS.glassBorder}` },
    danger: { background: COLORS.red, color: COLORS.white },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6, fontSize: 13 }}>{label}</label>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          border: `1px solid ${COLORS.glassBorder}`,
          borderRadius: 8,
          padding: "10px 14px", fontSize: 14, fontFamily: "inherit",
          background: COLORS.white,
          color: COLORS.textPrimary,
          outline: "none", transition: "border-color 0.15s ease",
        }}
        onFocus={e => { e.target.style.borderColor = COLORS.navy; }}
        onBlur={e => { e.target.style.borderColor = COLORS.glassBorder; }}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6, fontSize: 13 }}>{label}</label>}
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{
          width: "100%", boxSizing: "border-box",
          border: `1px solid ${COLORS.glassBorder}`, borderRadius: 8,
          padding: "10px 14px", fontSize: 14, fontFamily: "inherit",
          background: COLORS.white,
          color: COLORS.textPrimary, resize: "vertical",
          outline: "none", transition: "border-color 0.15s ease",
        }}
        onFocus={e => { e.target.style.borderColor = COLORS.navy; }}
        onBlur={e => { e.target.style.borderColor = COLORS.glassBorder; }}
      />
    </div>
  );
}

// ── Login Screen ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError("ยังไม่ได้ตั้งค่า Supabase URL และ Anon Key");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    });

    if (loginError) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const profile = await loadUserProfile(data.user);
    if (!profile) {
      await supabase.auth.signOut();
      setError("บัญชีนี้ยังไม่มีข้อมูลโปรไฟล์ในตาราง profiles");
      setLoading(false);
      return;
    }

    if (profile.role !== role) {
      await supabase.auth.signOut();
      setError(`บัญชีนี้เป็น${profile.role === "teacher" ? "ครู" : "นักเรียน"} กรุณาเลือกประเภทผู้ใช้ให้ถูกต้อง`);
      setLoading(false);
      return;
    }

    onLogin(profile);
    setLoading(false);
  };

  // ── Image slider state ──────────────────────────────────────────────────
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % LOGIN_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* ── ฝั่งซ้าย: สไลด์รูปภาพ ── */}
      <div className="login-slide-left" style={{
        flex: "1 1 50%",
        background: "linear-gradient(160deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)",
        color: COLORS.white,
        display: "flex", flexDirection: "column",
        padding: "48px 56px",
        position: "relative", overflow: "hidden",
        minHeight: "100vh", height: "100vh",
      }}>
        {/* decorative circles */}
        <div style={{ position:"absolute", width:380, height:380, borderRadius:"50%", background:"rgba(255,255,255,0.07)", top:-140, right:-120 }} />
        <div style={{ position:"absolute", width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,0.05)", bottom:-100, left:-80 }} />

        <div style={{ position:"relative", zIndex:1, flexShrink: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom: 40 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 19, fontWeight: 800, color: COLORS.white,
            }}>E</div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>EduClass</span>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, letterSpacing: "0.5px", marginBottom: 12 }}>
            สำหรับสถานศึกษายุคใหม่
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.3, margin: "0 0 14px", letterSpacing: "-0.5px" }}>
            จัดการการเรียนการสอน<br />อย่างเป็นระบบ
          </h1>
          <p style={{ fontSize: 14.5, opacity: 0.85, lineHeight: 1.6, maxWidth: 420, margin: "0 0 24px" }}>
            จัดการประกาศ แบบฝึกหัด คะแนน และการสื่อสารระหว่างครูกับนักเรียน ไว้ในที่เดียว — เพื่อให้ทุกคนโฟกัสกับการเรียนรู้
          </p>
        </div>

        {/* ── กรอบสี่เหลี่ยมแนวนอน แสดงรูปสไลด์ — ขยายเต็มพื้นที่ที่เหลือพอดี ── */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{
            position: "relative", width: "100%", flex: 1, minHeight: 0,
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.15)",
            marginBottom: 16,
          }}>
            {LOGIN_SLIDES.map((slide, i) => (
              <img key={i} src={slide.url} alt={slide.caption} style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%", objectFit: "cover",
                opacity: i === slideIndex ? 1 : 0,
                transition: "opacity 1s ease",
              }} />
            ))}
            {/* คำบรรยายซ้อนบนรูปแบบบางๆ มุมล่าง */}
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              padding: "20px 18px 14px",
              background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
              fontSize: 13.5, fontWeight: 600,
            }}>
              {LOGIN_SLIDES[slideIndex].caption}
            </div>
          </div>

          {/* จุดกดเลื่อนสไลด์ */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {LOGIN_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlideIndex(i)} aria-label={`สไลด์ ${i + 1}`}
                style={{
                  width: i === slideIndex ? 28 : 8, height: 8, borderRadius: 999,
                  border: "none", cursor: "pointer", padding: 0,
                  background: i === slideIndex ? COLORS.white : "rgba(255,255,255,0.4)",
                  transition: "all 0.3s ease",
                }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── ฝั่งขวา: ฟอร์ม login ── */}
      <div style={{
        flex: "1 1 50%",
        background: COLORS.white,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, height: "100vh", overflowY: "auto",
      }}>
        <div className="login-slide-in" style={{ width: "100%", maxWidth: 400 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: COLORS.textPrimary, margin: "0 0 8px", letterSpacing: "-0.4px" }}>
            ยินดีต้อนรับกลับ
          </h2>
          <p style={{ color: COLORS.textSecondary, margin: "0 0 32px", fontSize: 14.5, lineHeight: 1.6 }}>
            เข้าสู่ระบบเพื่อจัดการประกาศ แบบฝึกหัด และคะแนนของคุณ
          </p>

          {/* Role toggle */}
          <div style={{
            display: "flex", background: COLORS.glassMid,
            borderRadius: 10, padding: 4, marginBottom: 24,
          }}>
            {["student", "teacher"].map(r => (
              <button key={r} onClick={() => { setRole(r); setError(""); setUsername(""); setPassword(""); }}
                style={{
                  flex: 1, padding: "9px 0", border: "none", cursor: "pointer",
                  borderRadius: 8, fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                  transition: "background 0.15s ease",
                  background: role === r ? COLORS.navy : "transparent",
                  color: role === r ? COLORS.white : COLORS.textSecondary,
                }}>
                {r === "student" ? "นักเรียน" : "ครูผู้สอน"}
              </button>
            ))}
          </div>

          <Input label="อีเมล" value={username} onChange={setUsername} placeholder={role === "teacher" ? "teacher@school.ac.th" : "student@school.ac.th"} />
          <Input label="รหัสผ่าน" value={password} onChange={setPassword} type="password" placeholder="••••••••" />

          {error && (
            <div style={{ background: COLORS.redLight, color: COLORS.red, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <Button onClick={handleLogin} disabled={loading} variant="primary" style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: "13px 0" }}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>

          <div style={{ marginTop: 24, padding: 14, background: COLORS.glassMid, borderRadius: 10, fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 1.6, textAlign: "center" }}>
            ใช้อีเมลและรหัสผ่านที่ลงทะเบียนไว้กับระบบ
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap');

        html, body, #root {
          margin: 0;
          min-height: 100%;
        }
        * { box-sizing: border-box; }

        @keyframes loginSlideFromLeft {
          0% { opacity: 0; transform: translateX(-40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .login-slide-left {
          animation: loginSlideFromLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes loginSlideFromRight {
          0% { opacity: 0; transform: translateX(40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .login-slide-in {
          animation: loginSlideFromRight 0.6s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @media (max-width: 860px) {
          .login-slide-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
// ── Notification Bell (แจ้งเตือนแบบ Facebook) ──────────────────────────────
function NotificationBell({ notifications, onMarkRead, onMarkAllRead, onGoToAnnouncement }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setOpen(prev => !prev);
  };

  const handleItemClick = (n) => {
    if (!n.isRead) onMarkRead(n.id);
    setOpen(false);
    if (onGoToAnnouncement) onGoToAnnouncement();
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={handleBellClick} style={{
        width: 38, height: 38, borderRadius: 10, border: `1px solid ${COLORS.border}`,
        background: COLORS.bg, cursor: "pointer", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
      }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 18, height: 18, padding: "0 4px", borderRadius: 999,
            background: COLORS.red, color: COLORS.white,
            fontSize: 10.5, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${COLORS.white}`,
          }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 320, maxWidth: "calc(100vw - 32px)", maxHeight: 420, overflowY: "auto",
          background: COLORS.white, borderRadius: 14,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          zIndex: 200,
        }}>
          <div style={{
            padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: 14.5 }}>การแจ้งเตือน</span>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} style={{
                background: "none", border: "none", cursor: "pointer",
                color: COLORS.blue, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
              }}>อ่านทั้งหมด</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: COLORS.textMuted, fontSize: 13.5 }}>
              ยังไม่มีการแจ้งเตือน
            </div>
          ) : notifications.map(n => (
            <button key={n.id} onClick={() => handleItemClick(n)} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              width: "100%", padding: "12px 16px", border: "none",
              borderBottom: `1px solid ${COLORS.border}`,
              background: n.isRead ? "transparent" : COLORS.redLight,
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6,
                background: n.isRead ? "transparent" : COLORS.red,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: n.isRead ? 600 : 800, color: COLORS.textPrimary, marginBottom: 2 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {n.body}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{n.date}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ user, page, setPage, onLogout, mobileOpen, setMobileOpen }) {
  const isTeacher = user.role === "teacher";
  const nav = [
    { id: "dashboard", label: "แดชบอร์ด" },
    { id: "announcements", label: "ประกาศ/ข่าวสาร" },
    { id: "lessons", label: "เนื้อหาการเรียน" },
    { id: "messages", label: "ส่งข้อความ" },
    { id: "exercises", label: "แบบฝึกหัด" },
    ...(isTeacher ? [{ id: "results", label: "ผลการทำแบบฝึกหัด" }] : [{ id: "myscores", label: "คะแนนของฉัน" }]),
    ...(isTeacher ? [{ id: "users", label: "ผู้ใช้งาน" }] : []),
    { id: "help", label: "ศูนย์ช่วยเหลือ" },
    { id: "settings", label: "ตั้งค่า" },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 90,
        }} />
      )}
      <aside className={`app-sidebar${mobileOpen ? " mobile-open" : ""}`} style={{
        width: 250,
        background: COLORS.white,
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        transform: mobileOpen ? "translateX(0)" : undefined,
        transition: "transform .25s ease",
        borderRight: `1px solid ${COLORS.border}`,
      }}>
        {/* Header */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: COLORS.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 800, color: COLORS.white, flexShrink:0,
            }}>E</div>
            <div>
              <div style={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: 17 }}>EduClass</div>
              <div style={{ fontSize:11, color: COLORS.textMuted }}>ระบบจัดการการเรียนการสอน</div>
            </div>
          </div>

          {/* User card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: isTeacher ? COLORS.amber : COLORS.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, color: COLORS.white, fontSize: 15, flexShrink:0,
            }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user.name.length > 14 ? user.name.slice(0, 14) + "…" : user.name}
              </div>
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
          {nav.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => { setPage(n.id); setMobileOpen(false); }}
                style={{
                  display: "flex", alignItems: "center",
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "none",
                  borderLeft: active ? `3px solid ${COLORS.blue}` : "3px solid transparent",
                  cursor: "pointer", fontFamily: "inherit",
                  fontWeight: active ? 700 : 500, fontSize: 13.5,
                  marginBottom: 2,
                  background: active ? COLORS.blueLight : "transparent",
                  color: active ? COLORS.blue : COLORS.textSecondary,
                  textAlign: "left", transition: "background 0.15s ease",
                }}>
                {n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "14px 10px", borderTop: `1px solid ${COLORS.border}` }}>
          <button onClick={onLogout} style={{
            width: "100%", padding: "10px 14px", borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.white,
            color: COLORS.red,
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => { e.target.style.background=COLORS.redLight; }}
          onMouseLeave={e => { e.target.style.background=COLORS.white; }}>
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Back Button ───────────────────────────────────────────────────────────
function BackButton({ onClick, label = "กลับสู่แดชบอร์ด" }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10, padding: "9px 16px",
      color: COLORS.textSecondary, fontWeight: 600, fontSize: 13,
      cursor: "pointer", fontFamily: "inherit",
      marginBottom: 20, transition: "all 0.2s ease",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = COLORS.blue;
      e.currentTarget.style.color = COLORS.blue;
      e.currentTarget.style.background = COLORS.blueLight;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = COLORS.border;
      e.currentTarget.style.color = COLORS.textSecondary;
      e.currentTarget.style.background = COLORS.white;
    }}>
      <span style={{ fontSize: 15 }}>←</span> {label}
    </button>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ user, announcements, exercises, submissions, messages, setPage }) {
  const isTeacher = user.role === "teacher";
  const mySubmissions = submissions.filter(s => s.studentId === user.id);
  const totalExercises = exercises.length;
  const doneCount = mySubmissions.length;
  const avgScore = mySubmissions.length
    ? Math.round(mySubmissions.reduce((s, x) => s + x.percentage, 0) / mySubmissions.length)
    : 0;

  const teacherSubmissions = submissions.filter(s => exercises.find(e => e.authorId === user.id && e.id === s.exerciseId));

  const stats = isTeacher
    ? [
        { label: "แบบฝึกหัดที่มอบหมาย", value: exercises.filter(e => e.authorId === user.id).length, color: COLORS.saffron },
        { label: "ส่งงานแล้ว", value: teacherSubmissions.length, color: COLORS.jade },
        { label: "ประกาศทั้งหมด", value: announcements.filter(a => a.authorId === user.id).length, color: COLORS.navyLight },
      ]
    : [
        { label: "แบบฝึกหัดทั้งหมด", value: totalExercises, color: COLORS.textPrimary },
        { label: "ส่งแล้ว", value: doneCount, color: COLORS.jade },
        { label: "คะแนนเฉลี่ย", value: avgScore + "%", color: COLORS.saffron },
      ];

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: COLORS.textPrimary, margin: "0 0 6px", letterSpacing:"-0.5px" }}>
        สวัสดี, {user.name}
      </h2>
      <p style={{ color: COLORS.textSecondary, margin: "0 0 28px", fontSize: 15 }}>
        {isTeacher ? `วิชา: ${user.subject}` : `ห้อง: ${user.class}`}
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <Card key={i} accent={s.color}>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.textPrimary, fontFamily: "monospace", letterSpacing:"-1px" }}>{s.value}</div>
              <div style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Latest announcements */}
        <Card accent={COLORS.jade}>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: 14, fontSize: 15, display: "flex", justifyContent: "space-between" }}>
              ประกาศล่าสุด
              <button onClick={() => setPage("announcements")} style={{ background: "none", border: "none", color: COLORS.jade, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>ดูทั้งหมด →</button>
            </div>
            {announcements.slice(0, 3).map(a => (
              <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderLeft: `3px solid ${a.pinned ? COLORS.amber : COLORS.glassBorder}`, paddingLeft: 12, marginBottom: 12 }}>
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{a.subject}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{a.author} · {a.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming exercises */}
        <Card accent={COLORS.saffron}>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: 14, fontSize: 15, display: "flex", justifyContent: "space-between" }}>
              แบบฝึกหัดที่ยังไม่ส่ง
              <button onClick={() => setPage("exercises")} style={{ background: "none", border: "none", color: COLORS.saffron, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>ดูทั้งหมด →</button>
            </div>
            {exercises.filter(e => !mySubmissions.find(s => s.exerciseId === e.id)).slice(0, 3).map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 10px", background: COLORS.navyMid, borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>ครบกำหนด: {e.dueDate}</div>
                </div>
              </div>
            ))}
            {exercises.filter(e => !mySubmissions.find(s => s.exerciseId === e.id)).length === 0 && (
              <div style={{ color: COLORS.green, fontWeight: 600, fontSize: 14 }}> ส่งงานครบทุกชิ้นแล้ว!</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Announcements ──────────────────────────────────────────────────────────
function PostComposer({ user, onAdd }) {
  const isTeacher = user.role === "teacher";
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file) => {
    if (!supabase) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    setUploadProgress("กำลังอัปโหลดรูปภาพ...");
    const { error } = await supabase.storage
      .from("announcement-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { setUploadProgress(""); return null; }
    const { data } = supabase.storage.from("announcement-images").getPublicUrl(path);
    setUploadProgress("");
    return data?.publicUrl || null;
  };

  const handlePost = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSaving(true);
    let imageUrl = null;
    if (isTeacher && imageFile) imageUrl = await uploadImage(imageFile);
    await onAdd({
      author: user.name, authorId: user.id, subject, body,
      pinned: isTeacher ? pinned : false,
      isSpecial: isTeacher ? isSpecial : false,
      imageUrl,
    });
    setSubject(""); setBody(""); setPinned(false); setIsSpecial(false); setShowForm(false);
    removeImage();
    setSaving(false);
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ padding: 16 }}>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: 0, fontFamily: "inherit",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: isTeacher ? G.amber : G.emerald, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, color: COLORS.white, fontSize: 16,
            }}>{user.name.charAt(0)}</div>
            <div style={{
              flex: 1, textAlign: "left", padding: "10px 16px",
              background: COLORS.navyMid, borderRadius: 24,
              color: COLORS.textMuted, fontSize: 14,
            }}>
              คุณกำลังคิดอะไรอยู่ {user.name.split(" ")[0]}?
            </div>
          </button>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: isTeacher ? G.amber : G.emerald, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: COLORS.white, fontSize: 16,
              }}>{user.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: 14 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>กำลังโพสต์ประกาศ</div>
              </div>
            </div>

            <Input value={subject} onChange={setSubject} placeholder="หัวข้อประกาศ..." />
            <Textarea value={body} onChange={setBody} placeholder="คุณกำลังคิดอะไรอยู่..." rows={3} />

            {/* Image upload — teachers only */}
            {isTeacher && (
              imagePreview ? (
                <div style={{ position: "relative", marginBottom: 16, borderRadius: 14, overflow: "hidden", background: COLORS.glassMid, maxHeight: 400 }}>
                  <img src={imagePreview} alt="preview" style={{ width: "100%", maxHeight: 400, objectFit: "contain", display: "block", margin: "0 auto" }} />
                  <button onClick={removeImage} style={{
                    position: "absolute", top: 10, right: 10,
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)", border: "none", color: COLORS.white,
                    cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>×</button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "14px", marginBottom: 16,
                  border: `1.5px dashed ${COLORS.glassBorderBright}`, borderRadius: 14,
                  background: "rgba(56,189,248,0.04)", color: COLORS.cyan,
                  cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13,
                }}>
                  เพิ่มรูปภาพ
                </button>
              )
            )}
            {isTeacher && <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />}
            {!isTeacher && (
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
                ℹ นักเรียนสามารถโพสต์ประกาศได้ แต่ไม่สามารถแนบรูปภาพ
              </div>
            )}

            {isTeacher && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="pin" checked={pinned} onChange={e => setPinned(e.target.checked)} />
                  <label htmlFor="pin" style={{ fontWeight: 600, color: COLORS.textPrimary, cursor: "pointer", fontSize: 13 }}>ปักหมุดประกาศนี้</label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="special" checked={isSpecial} onChange={e => setIsSpecial(e.target.checked)} />
                  <label htmlFor="special" style={{ fontWeight: 600, color: COLORS.red, cursor: "pointer", fontSize: 13 }}>
                    ประกาศพิเศษ (แจ้งเตือนไปยังนักเรียนทุกคน)
                  </label>
                </div>
              </div>
            )}

            {uploadProgress && (
              <div style={{ fontSize: 13, color: COLORS.cyan, marginBottom: 12 }}>{uploadProgress}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={handlePost} variant={isTeacher ? "saffron" : "jade"} disabled={saving} style={{ flex: 1, justifyContent: "center" }}>
                {saving ? "กำลังโพสต์..." : "โพสต์"}
              </Button>
              <Button onClick={() => { setShowForm(false); removeImage(); }} variant="ghost">ยกเลิก</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function CommentSection({ user, announcementId, comments, onAddComment, onDeleteComment }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const myComments = comments.filter(c => c.announcementId === announcementId);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onAddComment(announcementId, text);
    setText("");
    setSending(false);
  };

  return (
    <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${COLORS.glassBorder}` }}>
      {myComments.length > 0 && (
        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {myComments.map(c => (
            <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: c.userRole === "teacher" ? G.amber : G.emerald,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: COLORS.white, fontSize: 12,
              }}>{c.userName.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  background: COLORS.navyMid, borderRadius: 12, padding: "8px 12px",
                  display: "inline-block",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: COLORS.textPrimary }}>{c.userName}</div>
                  <div style={{ fontSize: 13.5, color: COLORS.textSecondary, marginTop: 2 }}>{c.text}</div>
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3, display: "flex", gap: 10, alignItems: "center" }}>
                  {c.date}
                  {(c.userId === user.id || user.role === "teacher") && (
                    <button onClick={() => onDeleteComment(c.id)} style={{ background: "none", border: "none", color: COLORS.red, cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0 }}>ลบ</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: user.role === "teacher" ? G.amber : G.emerald,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, color: COLORS.white, fontSize: 12,
        }}>{user.name.charAt(0)}</div>
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="แสดงความเห็น..."
          style={{
            flex: 1, border: `1px solid ${COLORS.glassBorder}`, borderRadius: 20,
            padding: "8px 14px", fontSize: 13, fontFamily: "inherit",
            background: COLORS.navyMid, color: COLORS.textPrimary, outline: "none",
          }}
        />
        <Button onClick={handleSend} variant="ghost" size="sm" disabled={sending}>ส่ง</Button>
      </div>
    </div>
  );
}

function Announcements({ user, announcements, onAdd, onDelete, likes, comments, onToggleLike, onAddComment, onDeleteComment }) {
  const isTeacher = user.role === "teacher";
  const [openComments, setOpenComments] = useState({});

  const handleDelete = (id) => onDelete(id);
  const toggleComments = (id) => setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: 0, letterSpacing:"-0.3px" }}>ฟีดข่าวสาร</h2>
      </div>

      <PostComposer user={user} onAdd={onAdd} />

      {/* Feed */}
      {announcements.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted }}>ยังไม่มีประกาศ</div></Card>
      ) : announcements.map(a => {
        const postLikes = likes.filter(l => l.announcement_id === a.id);
        const iLiked = postLikes.some(l => l.user_id === user.id);
        const postComments = comments.filter(c => c.announcementId === a.id);
        const commentsOpen = !!openComments[a.id];

        return (
          <Card key={a.id} accent={a.isSpecial ? COLORS.red : (a.pinned ? COLORS.amber : null)} style={{ marginBottom: 16 }}>
            {/* Post header */}
            <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: a.authorId && a.authorId === user.id && !isTeacher ? G.emerald : G.amber,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: COLORS.white, fontSize: 17,
              }}>{a.author.charAt(0)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: 15 }}>{a.author}</span>
                  {a.isSpecial && (
                    <span style={{
                      background: COLORS.redLight, color: COLORS.red,
                      fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                      letterSpacing: "0.3px",
                    }}>ประกาศพิเศษ</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                  {a.date}
                  {a.pinned && <span style={{ color: COLORS.amber, fontWeight: 700 }}>· ปักหมุด</span>}
                </div>
              </div>
              {(a.authorId === user.id || isTeacher) && (
                <Button onClick={() => handleDelete(a.id)} variant="danger" size="sm"></Button>
              )}
            </div>

            {/* Post body */}
            <div style={{ padding: "0 18px 16px" }}>
              <h3 style={{ margin: "0 0 8px", color: COLORS.textPrimary, fontSize: 16, fontWeight: 800 }}>{a.subject}</h3>
              <p style={{ margin: 0, color: COLORS.textSecondary, lineHeight: 1.7, fontSize: 14.5, whiteSpace: "pre-wrap" }}>{a.body}</p>
            </div>

            {/* Post image — แสดงสัดส่วนจริงตามภาพที่อัปโหลด */}
            {a.imageUrl && (
              <div style={{ background: COLORS.glassMid, maxHeight: 560, overflow: "hidden", display: "flex", justifyContent: "center" }}>
                <img src={a.imageUrl} alt={a.subject} style={{
                  width: "100%", maxHeight: 560, objectFit: "contain", display: "block",
                }} />
              </div>
            )}

            {/* Like / comment counts */}
            {(postLikes.length > 0 || postComments.length > 0) && (
              <div style={{ padding: "10px 18px 0", display: "flex", justifyContent: "space-between", fontSize: 12.5, color: COLORS.textMuted }}>
                <span>{postLikes.length > 0 && ` ${postLikes.length} คนถูกใจ`}</span>
                <span>{postComments.length > 0 && `${postComments.length} ความเห็น`}</span>
              </div>
            )}

            {/* Engagement bar */}
            <div style={{
              padding: "8px 18px", display: "flex", gap: 4,
              borderTop: `1px solid ${COLORS.glassBorder}`, marginTop: 8,
            }}>
              <button onClick={() => onToggleLike(a.id)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                padding: "8px 0", borderRadius: 10,
                fontSize: 13, fontWeight: 700,
                color: iLiked ? COLORS.cyan : COLORS.textMuted,
                transition: "all 0.15s ease",
              }}>
                {iLiked ? "ถูกใจแล้ว" : "ถูกใจ"}
              </button>
              <button onClick={() => toggleComments(a.id)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                padding: "8px 0", borderRadius: 10,
                fontSize: 13, fontWeight: 700, color: COLORS.textMuted,
              }}>
                แสดงความเห็น
              </button>
            </div>

            {commentsOpen && (
              <CommentSection
                user={user} announcementId={a.id} comments={comments}
                onAddComment={onAddComment} onDeleteComment={onDeleteComment}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Messages ───────────────────────────────────────────────────────────────
function Messages({ user, messages, onSend, profiles }) {
  const [text, setText] = useState("");
  const [toAll, setToAll] = useState(true);
  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── @mention autocomplete state ──────────────────────────────────────────
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(null); // ตำแหน่งตัวอักษร @ ในข้อความ
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // รายชื่อทุกคน ไม่รวมตัวเอง กรองตาม query หลัง @
  const otherPeople = (profiles || []).filter(p => p.id !== user.id);
  const mentionResults = otherPeople
    .filter(p => p.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, 6);

  const handleTextChange = (val) => {
    setText(val);
    const cursorPos = inputRef.current?.selectionStart ?? val.length;
    // หา @ ตัวล่าสุดก่อนตำแหน่ง cursor ที่ยังไม่มี space ปิดท้าย
    const beforeCursor = val.slice(0, cursorPos);
    const atIdx = beforeCursor.lastIndexOf("@");
    if (atIdx !== -1) {
      const queryPart = beforeCursor.slice(atIdx + 1);
      if (!/\s/.test(queryPart)) {
        setMentionStart(atIdx);
        setMentionQuery(queryPart);
        setMentionOpen(true);
        setActiveIdx(0);
        return;
      }
    }
    setMentionOpen(false);
  };

  const insertMention = (person) => {
    if (mentionStart === null) return;
    const cursorPos = inputRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, mentionStart);
    const after = text.slice(cursorPos);
    const newText = `${before}@${person.name} ${after}`;
    setText(newText);
    setMentionOpen(false);
    setMentionStart(null);
    // คืน focus ให้ input หลังแทรกชื่อ
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (e) => {
    if (mentionOpen && mentionResults.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => (i + 1) % mentionResults.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => (i - 1 + mentionResults.length) % mentionResults.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionResults[activeIdx]); return; }
      if (e.key === "Escape") { setMentionOpen(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey && !mentionOpen) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── highlight @ชื่อ ในข้อความที่แสดงผล ──────────────────────────────────────
  const renderWithMentions = (msgText) => {
    const names = otherPeople.map(p => p.name).sort((a, b) => b.length - a.length);
    if (names.length === 0) return msgText;
    const pattern = new RegExp(`@(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
    const parts = msgText.split(pattern);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: COLORS.blue, fontWeight: 700 }}>@{part}</strong>
        : <span key={i}>{part}</span>
    );
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onSend(text, toAll ? "นักเรียนทุกคน" : target, toAll ? "broadcast" : "direct");
    setText("");
    setSending(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: "0 0 20px", letterSpacing:"-0.3px" }}> ส่งข้อความ</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Message list */}
        <Card accent={COLORS.jade} style={{ marginBottom: 20 }}>
          <div style={{ padding: 20, maxHeight: 380, overflowY: "auto" }}>
            {messages.map(m => {
              const isMe = m.fromId === user.id;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 16 }}>
                  <div style={{ maxWidth: "75%" }}>
                    {!isMe && <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>{m.from}</div>}
                    <div style={{
                      background: isMe ? COLORS.jade : COLORS.slateLight,
                      color: isMe ? COLORS.white : COLORS.navy,
                      padding: "10px 14px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      fontSize: 15, lineHeight: 1.6,
                    }}>
                      {m.type === "broadcast" && <span style={{ fontSize: 11, fontWeight: 700, opacity: .8, display: "block", marginBottom: 2 }}>→ {m.to}</span>}
                      {renderWithMentions(m.text)}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: isMe ? "right" : "left" }}>{m.date}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </Card>

        {/* Compose */}
        <Card accent={COLORS.saffron}>
          <div style={{ padding: 20 }}>
            {user.role === "teacher" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={() => setToAll(true)} style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                  background: toAll ? COLORS.saffron : COLORS.slateLight,
                  color: toAll ? COLORS.navy : COLORS.slate,
                }}>ส่งถึงทุกคน</button>
                <button onClick={() => setToAll(false)} style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                  background: !toAll ? COLORS.saffron : COLORS.slateLight,
                  color: !toAll ? COLORS.navy : COLORS.slate,
                }}>ส่งถึงนักเรียนคนเดิม</button>
              </div>
            )}
            {!toAll && <Input value={target} onChange={setTarget} placeholder="ชื่อนักเรียน..." />}

            <div style={{ position: "relative" }}>
              {/* Dropdown รายชื่อสำหรับ @mention */}
              {mentionOpen && mentionResults.length > 0 && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 8px)", left: 0,
                  width: 260, maxHeight: 220, overflowY: "auto",
                  background: COLORS.white, borderRadius: 12,
                  border: `1px solid ${COLORS.glassBorder}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  zIndex: 50,
                }}>
                  {mentionResults.map((p, i) => (
                    <button key={p.id} onClick={() => insertMention(p)}
                      onMouseEnter={() => setActiveIdx(i)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "10px 14px", border: "none",
                        background: i === activeIdx ? COLORS.blueLight : "transparent",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: p.role === "teacher" ? G.amber : G.emerald,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, color: COLORS.white, fontSize: 12,
                      }}>{p.name.charAt(0)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{p.role === "teacher" ? "ครู" : "นักเรียน"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => handleTextChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="พิมพ์ข้อความ... (พิมพ์ @ เพื่อแท็กชื่อ)" style={{
                    flex: 1, border: `1.5px solid ${COLORS.slateLight}`, borderRadius: 10,
                    padding: "10px 14px", fontSize: 15, fontFamily: "inherit",
                    background: COLORS.navyMid, color: COLORS.textPrimary, outline: "none",
                  }} />
                <Button onClick={handleSend} variant="jade" disabled={sending}>{sending ? "..." : "ส่ง "}</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Exercises list ─────────────────────────────────────────────────────────
function ExerciseList({ user, exercises, onAdd, onDelete, submissions, onOpenExercise }) {
  const isTeacher = user.role === "teacher";
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [qTexts, setQTexts] = useState(["", "", ""]);
  const [qAnswers, setQAnswers] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const questions = qTexts.map((t, i) => ({ id: "q" + (i + 1), text: t, answer: qAnswers[i], hint: "" })).filter(q => q.text.trim());
    await onAdd({
      title, description, dueDate,
      subject: user.subject, author: user.name, authorId: user.id, questions,
    });
    setTitle(""); setDescription(""); setDueDate("");
    setQTexts(["", "", ""]); setQAnswers(["", "", ""]);
    setShowForm(false); setSaving(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: 0, letterSpacing:"-0.3px" }}> แบบฝึกหัด</h2>
        {isTeacher && <Button onClick={() => setShowForm(!showForm)} variant="saffron">+ สร้างแบบฝึกหัด</Button>}
      </div>

      {isTeacher && showForm && (
        <Card accent={COLORS.saffron} style={{ marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: COLORS.textPrimary }}>สร้างแบบฝึกหัดใหม่</h3>
            <Input label="ชื่อแบบฝึกหัด" value={title} onChange={setTitle} placeholder="เช่น แบบฝึกหัดคณิตศาสตร์ บทที่ 1" />
            <Textarea label="คำอธิบาย" value={description} onChange={setDescription} placeholder="รายละเอียดแบบฝึกหัด..." rows={2} />
            <Input label="วันครบกำหนด" value={dueDate} onChange={setDueDate} placeholder="เช่น 25 มิ.ย. 2568" />
            <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: 12 }}>คำถาม (กรอกคำถามและเฉลย)</div>
            {[0, 1, 2].map(i => (
              <div key={i} className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={qTexts[i]} onChange={e => { const a = [...qTexts]; a[i] = e.target.value; setQTexts(a); }}
                  placeholder={`คำถามที่ ${i + 1}`} style={{ border: `1.5px solid ${COLORS.glassBorder}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", background: COLORS.navyMid, color: COLORS.textPrimary, outline: "none" }} />
                <input value={qAnswers[i]} onChange={e => { const a = [...qAnswers]; a[i] = e.target.value; setQAnswers(a); }}
                  placeholder="เฉลย" style={{ border: `1.5px solid ${COLORS.glassBorder}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", background: COLORS.navyMid, color: COLORS.textPrimary, outline: "none" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Button onClick={handleCreate} variant="saffron" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost">ยกเลิก</Button>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {exercises.map(ex => {
          const mySubmit = submissions.find(s => s.exerciseId === ex.id && s.studentId === user.id);
          return (
            <Card key={ex.id} accent={mySubmit ? COLORS.green : COLORS.saffron}
              style={{ cursor: "pointer", transition: "transform .15s" }}
              onClick={() => !isTeacher && onOpenExercise(ex)}>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 }}>{ex.subject} · {ex.author}</div>
                <h3 style={{ margin: "0 0 8px", color: COLORS.textPrimary, fontSize: 16 }}>{ex.title}</h3>
                <p style={{ margin: "0 0 12px", color: COLORS.textSecondary, fontSize: 14 }}>{ex.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: COLORS.textSecondary }}> {ex.dueDate}</span>
                  {mySubmit
                    ? <span style={{ background: COLORS.greenLight, color: COLORS.green, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}> {mySubmit.percentage}%</span>
                    : <span style={{ background: COLORS.saffronLight, color: COLORS.amber, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>ยังไม่ส่ง</span>}
                </div>
                {!isTeacher && !mySubmit && (
                  <Button onClick={e => { e.stopPropagation(); onOpenExercise(ex); }} variant="saffron" size="sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>ทำแบบฝึกหัด →</Button>
                )}
                {isTeacher && ex.authorId === user.id && (
                  <Button onClick={e => { e.stopPropagation(); if(window.confirm("ลบแบบฝึกหัดนี้?")) onDelete(ex.id); }} variant="danger" size="sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}> ลบแบบฝึกหัด</Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Exercise Attempt ───────────────────────────────────────────────────────
function ExerciseAttempt({ user, exercise, onSubmit, onBack }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const systemPrompt = `คุณเป็นครูผู้ช่วยตรวจแบบฝึกหัดที่มีความเชี่ยวชาญ ตรวจคำตอบของนักเรียนโดยเปรียบเทียบกับเฉลย ตอบกลับเป็น JSON เท่านั้น ไม่มี markdown หรือ backticks`;

      const userMsg = `ตรวจแบบฝึกหัดต่อไปนี้:
${exercise.questions.map((q, i) => `
คำถาม ${i + 1}: ${q.text}
เฉลยที่ถูกต้อง: ${q.answer}
คำตอบนักเรียน: ${answers["q" + i] || "(ไม่ได้ตอบ)"}
`).join("")}

ส่งกลับเป็น JSON: {"results": [{"questionIndex": 0, "correct": true/false, "feedback": "คำอธิบายสั้นๆ"}], "totalScore": X, "maxScore": ${exercise.questions.length}, "overallComment": "ความเห็นรวม"}`;

      const response = await callClaude([{ role: "user", content: userMsg }], systemPrompt);
      const data = JSON.parse(response.trim());
      const percentage = Math.round((data.totalScore / data.maxScore) * 100);
      setResult({ ...data, percentage });
      onSubmit(exercise.id, answers, data.totalScore, data.maxScore, percentage, data.overallComment, data.results);
    } catch (err) {
      // Fallback: simple exact match
      let correct = 0;
      const results = exercise.questions.map((q, i) => {
        const ans = (answers["q" + i] || "").trim().toLowerCase();
        const isCorrect = ans === q.answer.toLowerCase();
        if (isCorrect) correct++;
        return { questionIndex: i, correct: isCorrect, feedback: isCorrect ? "ถูกต้อง!" : `เฉลย: ${q.answer}` };
      });
      const percentage = Math.round((correct / exercise.questions.length) * 100);
      setResult({ results, totalScore: correct, maxScore: exercise.questions.length, percentage, overallComment: `คุณได้ ${correct}/${exercise.questions.length} ข้อ` });
      onSubmit(exercise.id, answers, correct, exercise.questions.length, percentage, "", results);
    }
    setLoading(false);
  };

  if (result) {
    return (
      <div>
        <Button onClick={onBack} variant="ghost" size="sm" style={{ marginBottom: 20 }}>← กลับ</Button>
        <Card accent={result.percentage >= 70 ? COLORS.green : COLORS.red}>
          <div style={{ padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 64 }}>{result.percentage >= 80 ? "" : result.percentage >= 60 ? "" : ""}</div>
            <h2 style={{ color: COLORS.textPrimary, fontSize: 28, margin: "12px 0 4px" }}>คะแนนของคุณ</h2>
            <div style={{ fontSize: 56, fontWeight: 900, color: result.percentage >= 70 ? COLORS.green : COLORS.red, fontFamily: "monospace" }}>
              {result.percentage}%
            </div>
            <div style={{ color: COLORS.textSecondary, fontSize: 18, marginBottom: 8 }}>{result.totalScore} / {result.maxScore} ข้อ</div>
            <div style={{ background: COLORS.navyMid, borderRadius: 12, padding: 16, marginTop: 16, color: COLORS.textPrimary, lineHeight: 1.7 }}>
              {result.overallComment}
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 20 }}>
          {exercise.questions.map((q, i) => {
            const r = result.results[i];
            return (
              <Card key={i} accent={r.correct ? COLORS.green : COLORS.red} style={{ marginBottom: 12 }}>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }}>{r.correct ? "" : ""}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: 4 }}>ข้อ {i + 1}: {q.text}</div>
                      <div style={{ fontSize: 14, color: COLORS.textSecondary }}>คำตอบของคุณ: <strong>{answers["q" + i] || "(ไม่ได้ตอบ)"}</strong></div>
                      {!r.correct && <div style={{ fontSize: 14, color: COLORS.green, marginTop: 2 }}>เฉลย: <strong>{q.answer}</strong></div>}
                      <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontStyle: "italic" }}>{r.feedback}</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={onBack} variant="ghost" size="sm" style={{ marginBottom: 20 }}>← กลับ</Button>
      <Card accent={COLORS.saffron} style={{ marginBottom: 20 }}>
        <div style={{ padding: 24 }}>
          <h2 style={{ color: COLORS.textPrimary, margin: "0 0 6px" }}>{exercise.title}</h2>
          <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>{exercise.author} · ครบกำหนด {exercise.dueDate}</div>
          {exercise.description && <p style={{ margin: "10px 0 0", color: COLORS.textPrimary }}>{exercise.description}</p>}
        </div>
      </Card>

      {exercise.questions.map((q, i) => (
        <Card key={i} style={{ marginBottom: 16 }}>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: 12 }}>ข้อ {i + 1}. {q.text}</div>
            {q.hint && <div style={{ fontSize: 13, color: COLORS.jade, marginBottom: 10 }}>คำใบ้: {q.hint}</div>}
            <input
              value={answers["q" + i] || ""}
              onChange={e => setAnswers({ ...answers, ["q" + i]: e.target.value })}
              placeholder="พิมพ์คำตอบของคุณ..."
              style={{
                width: "100%", boxSizing: "border-box",
                border: `2px solid ${answers["q" + i] ? COLORS.jade : COLORS.slateLight}`,
                borderRadius: 10, padding: "10px 14px", fontSize: 15,
                fontFamily: "inherit", background: COLORS.navyMid, color: COLORS.textPrimary,
                outline: "none", transition: "border .15s",
              }}
            />
          </div>
        </Card>
      ))}

      <Button onClick={handleSubmit} disabled={loading} variant="jade" style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "14px 0" }}>
        {loading ? "กำลังตรวจคำตอบด้วย AI..." : "ส่งแบบฝึกหัด"}
      </Button>
    </div>
  );
}

// ── Results (teacher) ──────────────────────────────────────────────────────
function Results({ user, exercises, submissions, onDeleteSubmission, onDeleteExercise }) {
  const myExercises = exercises.filter(e => e.authorId === user.id);
  const myExerciseIds = myExercises.map(ex => ex.id);
  const teacherSubmissions = submissions.filter(s => myExerciseIds.includes(s.exerciseId));
  const [selectedEx, setSelectedEx] = useState(myExercises[0] || null);

  const exSubs = submissions.filter(s => s.exerciseId === selectedEx?.id);
  const averageScore = teacherSubmissions.length
    ? Math.round(teacherSubmissions.reduce((sum, s) => sum + s.percentage, 0) / teacherSubmissions.length)
    : 0;
  const highestScore = teacherSubmissions.length
    ? Math.max(...teacherSubmissions.map(s => s.percentage))
    : 0;
  const selectedAverage = exSubs.length
    ? Math.round(exSubs.reduce((sum, s) => sum + s.percentage, 0) / exSubs.length)
    : 0;

  const stats = [
    { label: "แบบฝึกหัดของฉัน", value: myExercises.length, color: COLORS.saffron },
    { label: "ผู้ส่งทั้งหมด", value: teacherSubmissions.length, color: COLORS.jade },
    { label: "คะแนนเฉลี่ย", value: `${averageScore}%`, color: COLORS.navyLight },
    { label: "คะแนนสูงสุด", value: `${highestScore}%`, color: COLORS.green },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: 0, letterSpacing:"-0.3px" }}>แดชบอร์ดคะแนนแบบฝึกหัด</h2>
          <p style={{ color: COLORS.textSecondary, margin: "6px 0 0", fontSize: 14 }}>
            รวบรวมผลการทำแบบฝึกหัดและรายชื่อนักเรียนที่ส่งงานแล้ว
          </p>
        </div>
      </div>

      <div className="grid-4col" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 20 }}>
        {stats.map(stat => (
          <Card key={stat.label} accent={stat.color}>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: 700 }}>{stat.label}</span>
              </div>
              <div style={{ color: COLORS.textPrimary, fontSize: 28, fontWeight: 900, fontFamily: "monospace" }}>{stat.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid-sidebar-results" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <Card>
          <div style={{ padding: 18 }}>
            <h3 style={{ color: COLORS.textPrimary, margin: "0 0 14px", fontSize: 16 }}>รายการแบบฝึกหัด</h3>
            {myExercises.length === 0 ? (
              <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>ยังไม่มีแบบฝึกหัดที่สร้างไว้</div>
            ) : myExercises.map(ex => {
              const sentCount = submissions.filter(s => s.exerciseId === ex.id).length;
              return (
                <button key={ex.id} onClick={() => setSelectedEx(ex)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "inherit", marginBottom: 8,
                  background: selectedEx?.id === ex.id ? COLORS.saffronLight : COLORS.bg,
                  color: COLORS.textPrimary,
                  fontWeight: selectedEx?.id === ex.id ? 800 : 600,
                  borderLeft: `4px solid ${selectedEx?.id === ex.id ? COLORS.saffron : COLORS.slateLight}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.4 }}>{ex.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>{ex.subject} · ส่งแล้ว {sentCount} คน</div>
                </button>
              );
            })}
          </div>
        </Card>

        {selectedEx ? (
          <div>
            <Card accent={COLORS.jade} style={{ marginBottom: 16 }}>
              <div style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div>
                    <h3 style={{ margin: "0 0 6px", color: COLORS.textPrimary }}>{selectedEx.title}</h3>
                    <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>{selectedEx.subject} · ครบกำหนด {selectedEx.dueDate}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ background: COLORS.bg, borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 88 }}>
                      <div style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 700 }}>ผู้ส่ง</div>
                      <div style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: 900 }}>{exSubs.length}</div>
                    </div>
                    <div style={{ background: COLORS.bg, borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 88 }}>
                      <div style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 700 }}>เฉลี่ย</div>
                      <div style={{ color: selectedAverage >= 70 ? COLORS.green : COLORS.red, fontSize: 20, fontWeight: 900 }}>{selectedAverage}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: 22 }}>
                <h3 style={{ color: COLORS.textPrimary, margin: "0 0 16px", fontSize: 16 }}>รายชื่อนักเรียนที่ทำแบบฝึกหัด</h3>
                {exSubs.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: COLORS.textSecondary, background: COLORS.bg, borderRadius: 12 }}>
                    ยังไม่มีนักเรียนส่งแบบฝึกหัดนี้
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                      <thead>
                        <tr style={{ background: COLORS.bg }}>
                          {["นักเรียน", "วันที่ส่ง", "คะแนน", "เปอร์เซ็นต์", "สถานะ"].map(head => (
                            <th key={head} style={{ textAlign: "left", padding: "12px 14px", color: COLORS.textSecondary, fontSize: 13, fontWeight: 800 }}>
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exSubs.map(s => (
                          <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.slateLight}` }}>
                            <td style={{ padding: "14px", color: COLORS.textPrimary, fontWeight: 700 }}>{s.studentName}</td>
                            <td style={{ padding: "14px", color: COLORS.textSecondary, fontSize: 14 }}>{s.date}</td>
                            <td style={{ padding: "14px", color: COLORS.textPrimary, fontWeight: 700 }}>{s.score}/{s.maxScore}</td>
                            <td style={{ padding: "14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1, height: 8, background: COLORS.slateLight, borderRadius: 999, overflow: "hidden", minWidth: 90 }}>
                                  <div style={{
                                    width: `${s.percentage}%`, height: "100%",
                                    background: s.percentage >= 70 ? COLORS.green : COLORS.red,
                                  }} />
                                </div>
                                <strong style={{ color: s.percentage >= 70 ? COLORS.green : COLORS.red, fontFamily: "monospace" }}>{s.percentage}%</strong>
                              </div>
                            </td>
                            <td style={{ padding: "14px" }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800,
                                color: s.percentage >= 70 ? COLORS.green : COLORS.red,
                                background: s.percentage >= 70 ? COLORS.greenLight : COLORS.redLight,
                              }}>
                                {s.percentage >= 70 ? "ผ่าน" : "ควรปรับปรุง"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <div style={{ padding: 40, textAlign: "center", color: COLORS.textSecondary }}>
              เลือกแบบฝึกหัดเพื่อดูรายชื่อและคะแนน
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── My Scores (student) ────────────────────────────────────────────────────
function MyScores({ user, submissions, exercises }) {
  const mySubmissions = submissions.filter(s => s.studentId === user.id);
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: "0 0 20px", letterSpacing:"-0.3px" }}> คะแนนของฉัน</h2>
      {mySubmissions.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: COLORS.textSecondary }}>ยังไม่มีการส่งแบบฝึกหัด</div></Card>
      ) : (
        mySubmissions.map(s => {
          const ex = exercises.find(e => e.id === s.exerciseId);
          return (
            <Card key={s.id} accent={s.percentage >= 70 ? COLORS.green : COLORS.red} style={{ marginBottom: 14 }}>
              <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: 16 }}>{ex?.title || "แบบฝึกหัด"}</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{ex?.subject} · ส่ง: {s.date}</div>
                  {s.comment && <div style={{ fontSize: 13, color: COLORS.jade, marginTop: 6, fontStyle: "italic" }}> {s.comment}</div>}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: s.percentage >= 70 ? COLORS.greenLight : COLORS.redLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: 20, fontFamily: "monospace",
                    color: s.percentage >= 70 ? COLORS.green : COLORS.red,
                  }}>{s.percentage}%</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>{s.score}/{s.maxScore}</div>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────
function Settings({ user, onSave }) {
  const isTeacher = user.role === "teacher";
  const splitName = (user.name || "").trim().split(/\s+/);
  const [firstName, setFirstName] = useState(splitName[0] || "");
  const [lastName, setLastName] = useState(splitName.slice(1).join(" "));
  const [department, setDepartment] = useState(user.department || "");
  const [level, setLevel] = useState(user.level || user.class || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const parts = (user.name || "").trim().split(/\s+/);
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" "));
    setDepartment(user.department || "");
    setLevel(user.level || user.class || "");
  }, [user]);

  const handleSave = async () => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim() || user.name;
    const nextUser = {
      ...user,
      name,
      department: department.trim(),
      ...(isTeacher ? {} : { level: level.trim(), class: level.trim() }),
    };

    setSaving(true);
    setError("");

    if (supabase) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          department: department.trim(),
          ...(isTeacher ? {} : { level: level.trim(), classroom: level.trim() }),
        })
        .eq("id", user.id);

      if (updateError) {
        setError("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ใน Supabase");
        setSaving(false);
        return;
      }
    }

    // Reload profile from Supabase to confirm saved
    if (supabase) {
      const { data: refreshed } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (refreshed) {
        const updatedUser = profileToUser(refreshed, { email: user.email });
        onSave(updatedUser);
      } else { onSave(nextUser); }
    } else { onSave(nextUser); }
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: "0 0 20px", letterSpacing:"-0.3px" }}>
        ตั้งค่าข้อมูลส่วนตัว
      </h2>

      <div className="grid-sidebar-settings" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 20 }}>
        <Card accent={isTeacher ? COLORS.saffron : COLORS.jade}>
          <div style={{ padding: 24 }}>
            <h3 style={{ color: COLORS.textPrimary, margin: "0 0 18px", fontSize: 18 }}>
              {isTeacher ? "ข้อมูลครู" : "ข้อมูลนักเรียนนักศึกษา"}
            </h3>

            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="ชื่อ" value={firstName} onChange={setFirstName} placeholder="ชื่อ" />
              <Input label="นามสกุล" value={lastName} onChange={setLastName} placeholder="นามสกุล" />
            </div>

            <Input
              label="แผนกวิชา"
              value={department}
              onChange={setDepartment}
              placeholder={isTeacher ? "เช่น แผนกวิชาคอมพิวเตอร์ธุรกิจ" : "เช่น แผนกวิชาการบัญชี"}
            />

            {!isTeacher && (
              <Input
                label="ระดับชั้น"
                value={level}
                onChange={setLevel}
                placeholder="เช่น ปวช.1 หรือ ปวส.2"
              />
            )}

            {saved && (
              <div style={{ background: COLORS.greenLight, color: COLORS.green, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontWeight: 700 }}>
                บันทึกข้อมูลเรียบร้อยแล้ว
              </div>
            )}
            {error && (
              <div style={{ background: COLORS.redLight, color: COLORS.red, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontWeight: 700 }}>
                {error}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} variant={isTeacher ? "saffron" : "jade"}>
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </Button>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 22 }}>
            <div style={{
              width: 58, height: 58, borderRadius: "50%",
              background: isTeacher ? G.amber : G.emerald,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 800, color: isTeacher ? COLORS.navy : COLORS.white,
              marginBottom: 14,
            }}>
              {(firstName || user.name).charAt(0)}
            </div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>
              {`${firstName} ${lastName}`.trim() || user.name}
            </div>
            <div style={{ marginTop: 8 }}><RoleBadge role={user.role} /></div>
            <div style={{ marginTop: 18, color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              <div><strong style={{ color: COLORS.textPrimary }}>แผนก:</strong> {department || "-"}</div>
              {!isTeacher && <div><strong style={{ color: COLORS.textPrimary }}>ระดับชั้น:</strong> {level || "-"}</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Learning Content (เนื้อหาการเรียน) ──────────────────────────────────────
function LearningContent({ user, lessons, onAdd, onDelete }) {
  const isTeacher = user.role === "teacher";
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("ขนาดไฟล์ต้องไม่เกิน 10MB"); return; }
    setFileObj(file);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onAdd({ title, description, subject: user.subject, author: user.name, authorId: user.id, videoUrl, file: fileObj });
    setTitle(""); setDescription(""); setVideoUrl(""); setFileObj(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(false); setSaving(false);
  };

  // คลิกที่การ์ด: วิดีโอ → เปิด YouTube ตรงในแท็บใหม่ / รูปภาพ → เปิด lightbox / อื่นๆ → เข้าหน้ารายละเอียด
  const handleCardClick = (l) => {
    if (l.videoUrl) {
      window.open(l.videoUrl, "_blank", "noopener,noreferrer");
    } else if (l.fileUrl && isImageFile(l.fileName)) {
      setImagePreview(l);
    } else {
      setSelected(l);
    }
  };

  // Lightbox สำหรับรูปภาพ
  if (imagePreview) {
    return (
      <div onClick={() => setImagePreview(null)} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        cursor: "zoom-out",
      }}>
        <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", textAlign: "center" }}>
          <img src={imagePreview.fileUrl} alt={imagePreview.title} style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12, objectFit: "contain" }} />
          <div style={{ color: COLORS.white, marginTop: 14, fontSize: 15, fontWeight: 600 }}>{imagePreview.title}</div>
          <button onClick={() => setImagePreview(null)} style={{
            marginTop: 14, padding: "8px 20px", borderRadius: 10, border: "none",
            background: "rgba(255,255,255,0.15)", color: COLORS.white, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
          }}>ปิด</button>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div>
        <Button onClick={() => setSelected(null)} variant="ghost" size="sm" style={{ marginBottom: 20 }}>← กลับ</Button>
        <Card>
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>{selected.subject} · {selected.author}</div>
            <h2 style={{ color: COLORS.textPrimary, margin: "0 0 14px" }}>{selected.title}</h2>

            {selected.description && (
              <p style={{ color: COLORS.textSecondary, lineHeight: 1.7, margin: "0 0 18px" }}>{selected.description}</p>
            )}

            {selected.videoUrl && (
              <a href={selected.videoUrl} target="_blank" rel="noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 10, marginBottom: 12,
                background: COLORS.blueLight, color: COLORS.blue,
                fontWeight: 600, fontSize: 14, textDecoration: "none",
              }}>
                เปิดวิดีโอบทเรียน →
              </a>
            )}

            {selected.fileUrl && isImageFile(selected.fileName) ? (
              <img src={selected.fileUrl} alt={selected.title} onClick={() => setImagePreview(selected)}
                style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 12, cursor: "zoom-in", background: COLORS.navyMid, display: "block" }} />
            ) : selected.fileUrl && (
              <a href={selected.fileUrl} target="_blank" rel="noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 10,
                background: COLORS.blueLight, color: COLORS.blue,
                fontWeight: 600, fontSize: 14, textDecoration: "none",
              }}>
                ดาวน์โหลดเอกสาร: {selected.fileName || "ไฟล์ประกอบบทเรียน"}
              </a>
            )}

            {isTeacher && selected.authorId === user.id && (
              <div style={{ marginTop: 20 }}>
                <Button onClick={() => { if (window.confirm("ลบบทเรียนนี้?")) { onDelete(selected.id); setSelected(null); } }} variant="danger" size="sm">ลบบทเรียน</Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: 0, letterSpacing:"-0.3px" }}>เนื้อหาการเรียน</h2>
        {isTeacher && <Button onClick={() => setShowForm(!showForm)} variant="saffron">เพิ่มบทเรียน</Button>}
      </div>

      {isTeacher && showForm && (
        <Card accent={COLORS.saffron} style={{ marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: COLORS.textPrimary }}>เพิ่มบทเรียนใหม่</h3>
            <Input label="ชื่อบทเรียน" value={title} onChange={setTitle} placeholder="เช่น บทที่ 1 ความรู้เบื้องต้น" />
            <Textarea label="คำอธิบาย" value={description} onChange={setDescription} placeholder="รายละเอียดบทเรียน..." rows={3} />
            <Input label="ลิงก์วิดีโอ (YouTube)" value={videoUrl} onChange={setVideoUrl} placeholder="https://youtube.com/watch?v=..." />

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6, fontSize: 13 }}>ไฟล์เอกสารหรือรูปภาพประกอบ (ไม่บังคับ)</label>
              <button onClick={() => fileInputRef.current?.click()} style={{
                width: "100%", padding: "12px", border: `1.5px dashed ${COLORS.glassBorderBright}`, borderRadius: 10,
                background: COLORS.navyMid, color: COLORS.textSecondary, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              }}>
                {fileObj ? fileObj.name : "เลือกไฟล์ (PDF, DOCX, PPTX, JPG, PNG สูงสุด 10MB)"}
              </button>
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={handleCreate} variant="saffron" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost">ยกเลิก</Button>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {lessons.length === 0 ? (
          <Card><div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted }}>ยังไม่มีบทเรียน</div></Card>
        ) : lessons.map(l => {
          const ytThumb = getYoutubeThumbnail(l.videoUrl);
          const isImg = l.fileUrl && isImageFile(l.fileName);

          return (
            <Card key={l.id} style={{ cursor: "pointer", overflow: "hidden" }} onClick={() => handleCardClick(l)}>
              {ytThumb ? (
                <div style={{ position: "relative", height: 150, background: COLORS.navyMid, overflow: "hidden" }}>
                  <img src={ytThumb} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.25)",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.9)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent",
                        borderLeft: `14px solid ${COLORS.navy}`, marginLeft: 3,
                      }} />
                    </div>
                  </div>
                </div>
              ) : isImg ? (
                <div style={{ height: 150, background: COLORS.navyMid, overflow: "hidden" }}>
                  <img src={l.fileUrl} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ) : (
                <div style={{ height: 150, background: COLORS.glassMid, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 13 }}>
                  เอกสารบทเรียน
                </div>
              )}
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>{l.subject} · {l.author}</div>
                <h3 style={{ margin: "0 0 6px", color: COLORS.textPrimary, fontSize: 15, fontWeight: 700 }}>{l.title}</h3>
                <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {l.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── User Management (ผู้ใช้งาน — ครูจัดการรายชื่อ) ───────────────────────────
function UserManagement({ profiles, loading, onCreateStudent }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const filtered = profiles.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || p.role === filterRole;
    return matchSearch && matchRole;
  });

  const resetForm = () => {
    setEmail(""); setPassword(""); setFirstName(""); setLastName("");
    setDepartment(""); setLevel(""); setFormError(""); setFormSuccess("");
  };

  const handleCreate = async () => {
    setFormError(""); setFormSuccess("");
    if (!email.trim() || !password.trim()) { setFormError("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    if (password.length < 6) { setFormError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }

    setCreating(true);
    const result = await onCreateStudent({ email: email.trim(), password, firstName, lastName, department, level });
    setCreating(false);

    if (result?.error) {
      setFormError(result.error);
    } else {
      setFormSuccess(`สร้างบัญชีนักเรียน ${email} สำเร็จแล้ว`);
      setEmail(""); setPassword(""); setFirstName(""); setLastName(""); setDepartment(""); setLevel("");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: 0, letterSpacing:"-0.3px" }}>ผู้ใช้งานในระบบ</h2>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }} variant="saffron">เพิ่มบัญชีนักเรียน</Button>
      </div>

      {showForm && (
        <Card accent={COLORS.saffron} style={{ marginBottom: 20 }}>
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: COLORS.textPrimary }}>สร้างบัญชีนักเรียนใหม่</h3>

            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="ชื่อ" value={firstName} onChange={setFirstName} placeholder="ชื่อ" />
              <Input label="นามสกุล" value={lastName} onChange={setLastName} placeholder="นามสกุล" />
            </div>

            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="แผนกวิชา" value={department} onChange={setDepartment} placeholder="เช่น แผนกวิชาคอมพิวเตอร์ธุรกิจ" />
              <Input label="ระดับชั้น" value={level} onChange={setLevel} placeholder="เช่น ปวช.1" />
            </div>

            <Input label="อีเมล" value={email} onChange={setEmail} placeholder="student@school.ac.th" />
            <Input label="รหัสผ่าน" value={password} onChange={setPassword} type="password" placeholder="อย่างน้อย 6 ตัวอักษร" />

            {formError && (
              <div style={{ background: COLORS.redLight, color: COLORS.red, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ background: COLORS.greenLight, color: COLORS.green, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                {formSuccess}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={handleCreate} variant="saffron" disabled={creating}>{creating ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost">ปิด</Button>
            </div>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20 }}>
        <div style={{ padding: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล..."
              style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.glassBorder}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", background: COLORS.navyMid, color: COLORS.textPrimary, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["all", "ทั้งหมด"], ["teacher", "ครู"], ["student", "นักเรียน"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilterRole(val)} style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                background: filterRole === val ? COLORS.blue : COLORS.glassMid,
                color: filterRole === val ? COLORS.white : COLORS.textSecondary,
              }}>{label}</button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ padding: 14 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted }}>กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted }}>ไม่พบผู้ใช้งาน</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map(p => {
                const isTeacherRow = p.role === "teacher";
                const detailLine = isTeacherRow
                  ? (p.department || "-")
                  : [p.level || null, p.department || null].filter(Boolean).join(" ");

                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 12,
                    background: COLORS.navyMid,
                    border: `1px solid ${COLORS.glassBorder}`,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: isTeacherRow ? G.amber : G.emerald,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, color: COLORS.white, fontSize: 17,
                    }}>{p.name.charAt(0)}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                        {p.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <RoleBadge role={p.role} />
                        {detailLine && (
                          <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>{detailLine}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ color: COLORS.textMuted, fontSize: 12.5, textAlign: "right", flexShrink: 0 }}>
                      {p.email}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Help Center (ศูนย์ช่วยเหลือ) ─────────────────────────────────────────────
function HelpCenter({ user }) {
  const [openIdx, setOpenIdx] = useState(null);

  const faqsCommon = [
    { q: "ลืมรหัสผ่านต้องทำอย่างไร?", a: "กรุณาติดต่อผู้ดูแลระบบหรือครูประจำวิชา เพื่อให้รีเซ็ตรหัสผ่านให้ใหม่ ระบบยังไม่มีฟังก์ชันลืมรหัสผ่านอัตโนมัติ" },
    { q: "แก้ไขข้อมูลส่วนตัว เช่น ชื่อ แผนกวิชา ได้ที่ไหน?", a: "ไปที่เมนู \"ตั้งค่า\" ด้านซ้าย จะสามารถแก้ไขชื่อ นามสกุล แผนกวิชา และระดับชั้นได้" },
    { q: "ข้อมูลที่บันทึกไว้จะหายไหมถ้าออกจากระบบ?", a: "ไม่หาย ข้อมูลทั้งหมดถูกบันทึกลงฐานข้อมูลถาวร เมื่อเข้าสู่ระบบใหม่จะเห็นข้อมูลเดิมครบถ้วน" },
  ];

  const faqsTeacher = [
    { q: "สร้างแบบฝึกหัดใหม่อย่างไร?", a: "ไปที่เมนู \"แบบฝึกหัด\" แล้วกดปุ่ม \"สร้างแบบฝึกหัด\" กรอกชื่อ คำอธิบาย วันครบกำหนด และคำถาม-เฉลย จากนั้นกดบันทึก" },
    { q: "ดูผลคะแนนของนักเรียนได้ที่ไหน?", a: "ไปที่เมนู \"ผลการทำแบบฝึกหัด\" เลือกแบบฝึกหัดที่ต้องการดู จะเห็นรายชื่อนักเรียนพร้อมคะแนนและสถานะ" },
    { q: "ลบประกาศหรือแบบฝึกหัดที่โพสต์ผิดได้ไหม?", a: "ได้ เฉพาะประกาศหรือแบบฝึกหัดที่ท่านเป็นผู้สร้างเท่านั้น กดไอคอนถังขยะที่การ์ดนั้น ๆ" },
  ];

  const faqsStudent = [
    { q: "ทำแบบฝึกหัดอย่างไร?", a: "ไปที่เมนู \"แบบฝึกหัด\" เลือกชิ้นที่ต้องการทำ กรอกคำตอบให้ครบทุกข้อ แล้วกดส่ง ระบบจะตรวจให้อัตโนมัติ" },
    { q: "ดูคะแนนของตัวเองได้ที่ไหน?", a: "ไปที่เมนู \"คะแนนของฉัน\" จะเห็นประวัติคะแนนทุกแบบฝึกหัดที่เคยส่งไปแล้ว" },
    { q: "โพสต์ประกาศได้ไหม?", a: "ได้ แต่ไม่สามารถแนบรูปภาพหรือปักหมุดประกาศได้ สิทธิ์เหล่านี้สงวนไว้สำหรับครูผู้สอนเท่านั้น" },
  ];

  const faqs = [...faqsCommon, ...(user.role === "teacher" ? faqsTeacher : faqsStudent)];

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.textPrimary, margin: "0 0 8px", letterSpacing:"-0.3px" }}>ศูนย์ช่วยเหลือ</h2>
      <p style={{ color: COLORS.textSecondary, margin: "0 0 24px", fontSize: 14 }}>คำถามที่พบบ่อยและวิธีใช้งานระบบ</p>

      {faqs.map((f, i) => (
        <Card key={i} style={{ marginBottom: 10 }}>
          <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{
            width: "100%", textAlign: "left", background: "none", border: "none",
            padding: "16px 18px", cursor: "pointer", fontFamily: "inherit",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          }}>
            <span style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 14.5 }}>{f.q}</span>
            <span style={{ color: COLORS.textMuted, fontSize: 18, transform: openIdx === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
          </button>
          {openIdx === i && (
            <div style={{ padding: "0 18px 18px", color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7 }}>
              {f.a}
            </div>
          )}
        </Card>
      ))}

      <Card style={{ marginTop: 20 }}>
        <div style={{ padding: 20, textAlign: "center" }}>
          <div style={{ color: COLORS.textPrimary, fontWeight: 700, marginBottom: 6, fontSize: 14.5 }}>ต้องการความช่วยเหลือเพิ่มเติม?</div>
          <div style={{ color: COLORS.textSecondary, fontSize: 13.5 }}>ติดต่อผู้ดูแลระบบหรือครูประจำวิชาของท่าน</div>
        </div>
      </Card>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [announcements, setAnnouncements] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [messages, setMessages] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Load data from Supabase ──────────────────────────────────────────────
  const loadData = async () => {
    if (!supabase) return;
    const [annRes, exRes, subRes, msgRes, likeRes, commentRes, lessonRes] = await Promise.all([
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("exercises").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("*").order("created_at", { ascending: true }),
      supabase.from("announcement_likes").select("*"),
      supabase.from("announcement_comments").select("*").order("created_at", { ascending: true }),
      supabase.from("lessons").select("*").order("created_at", { ascending: false }),
    ]);
    if (annRes.data) setAnnouncements(annRes.data.map(dbToAnnouncement));
    if (exRes.data) setExercises(exRes.data.map(dbToExercise));
    if (subRes.data) setSubmissions(subRes.data.map(dbToSubmission));
    if (msgRes.data) setMessages(msgRes.data.map(dbToMessage));
    if (likeRes.data) setLikes(likeRes.data);
    if (commentRes.data) setComments(commentRes.data.map(dbToComment));
    if (lessonRes.data) setLessons(lessonRes.data.map(dbToLesson));
  };

  // ── โหลดแจ้งเตือนของผู้ใช้ปัจจุบัน ────────────────────────────────────────
  const loadNotifications = async (userId) => {
    if (!supabase || !userId) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error && data) setNotifications(data.map(dbToNotification));
  };

  // ── โหลดรายชื่อผู้ใช้งานทั้งหมด (สำหรับครู) ───────────────────────────────
  const loadProfiles = async () => {
    if (!supabase) return;
    setProfilesLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("role");
    if (!error && data) {
      setProfiles(data.map(p => ({
        id: p.id,
        name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "(ไม่มีชื่อ)",
        role: p.role, subject: p.subject || "", department: p.department || "",
        level: p.level || "", email: p.email || "",
      })));
    }
    setProfilesLoading(false);
  };


  // ── Auth session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadUserProfile(session.user);
        if (profile) {
          setUser(profile); await loadData();
          await loadProfiles();
          await loadNotifications(profile.id);
        }
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await loadUserProfile(session.user);
        if (profile) {
          setUser(profile); await loadData();
          await loadProfiles();
          await loadNotifications(profile.id);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null); setPage("dashboard"); setActiveExercise(null);
        setAnnouncements([]); setExercises([]); setSubmissions([]);
        setNotifications([]);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setActiveExercise(null); setPage("dashboard");
  };

  // ── Messages CRUD ──────────────────────────────────────────────────────────
  const handleSendMessage = async (text, toLabel, msgType) => {
    const newMsg = {
      from_id: user.id, from_name: user.name,
      to_label: toLabel, text, msg_type: msgType,
    };
    if (supabase) {
      const { data, error } = await supabase.from("messages").insert([newMsg]).select().single();
      if (!error && data) { setMessages(prev => [...prev, dbToMessage(data)]); return; }
    }
    setMessages(prev => [...prev, {
      id: "m" + Date.now(), from: user.name, fromId: user.id,
      to: toLabel, text, date: "วันนี้", type: msgType,
    }]);
  };

  // ── Announcements CRUD ────────────────────────────────────────────────────
  // ── Notifications ──────────────────────────────────────────────────────────
  const handleMarkNotificationRead = async (id) => {
    if (!supabase) return;
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!supabase || !user) return;
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleAddAnnouncement = async (ann) => {
    if (!supabase) return;
    const { data, error } = await supabase.from("announcements").insert([{
      author_id: ann.authorId, author_name: ann.author,
      subject: ann.subject, body: ann.body, pinned: ann.pinned,
      is_special: ann.isSpecial || false,
      image_url: ann.imageUrl || null,
    }]).select().single();

    if (error) {
      console.error("เพิ่มประกาศไม่สำเร็จ:", error.message);
      return;
    }

    if (data) {
      setAnnouncements(prev => [dbToAnnouncement(data), ...prev]);

      // ── ถ้าเป็นประกาศพิเศษ: สร้างแจ้งเตือนให้นักเรียนทุกคน ──────────────────
      if (ann.isSpecial) {
        const studentIds = profiles.filter(p => p.role === "student" && p.id !== ann.authorId).map(p => p.id);
        if (studentIds.length > 0) {
          const rows = studentIds.map(uid => ({
            user_id: uid, announcement_id: data.id,
            title: "ประกาศพิเศษ", body: ann.subject,
          }));
          // ไม่ใช้ .select() ตรงนี้ เพราะ RLS อนุญาตอ่านได้แค่แจ้งเตือนของตัวเอง
          // ครูจึงอ่านกลับ (select) แจ้งเตือนที่สร้างให้นักเรียนคนอื่นไม่ได้ แม้ insert จะสำเร็จก็ตาม
          const { error: notifErr } = await supabase.from("notifications").insert(rows);
          if (notifErr) {
            console.error("สร้างแจ้งเตือนไม่สำเร็จ:", notifErr.message);
          }
        } else {
          console.warn("ไม่พบรายชื่อนักเรียนใน profiles — แจ้งเตือนจึงไม่ถูกสร้าง");
        }
      }
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!supabase) return;
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setLikes(prev => prev.filter(l => l.announcement_id !== id));
    setComments(prev => prev.filter(c => c.announcementId !== id));
  };

  // ── Lessons CRUD (เนื้อหาการเรียน) ───────────────────────────────────────────
  const handleAddLesson = async (lesson) => {
    if (!supabase) return;
    let fileUrl = "", fileName = "";
    if (lesson.file) {
      const ext = lesson.file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("lesson-files").upload(path, lesson.file, { upsert: false });
      if (!upErr) {
        const { data } = supabase.storage.from("lesson-files").getPublicUrl(path);
        fileUrl = data?.publicUrl || "";
        fileName = lesson.file.name;
      }
    }
    const { data, error } = await supabase.from("lessons").insert([{
      author_id: lesson.authorId, author_name: lesson.author,
      title: lesson.title, subject: lesson.subject, description: lesson.description,
      video_url: lesson.videoUrl, file_url: fileUrl, file_name: fileName,
    }]).select().single();
    if (!error && data) setLessons(prev => [dbToLesson(data), ...prev]);
  };

  const handleDeleteLesson = async (id) => {
    if (!supabase) return;
    await supabase.from("lessons").delete().eq("id", id);
    setLessons(prev => prev.filter(l => l.id !== id));
  };

  // ── สร้างบัญชีนักเรียนใหม่ (เรียก Edge Function) ────────────────────────────
  const handleCreateStudent = async (studentData) => {
    if (!supabase) return { error: "ระบบยังไม่ได้ตั้งค่า Supabase" };
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return { error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" };

      const { data, error } = await supabase.functions.invoke("create-student", {
        body: studentData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) return { error: error.message || "สร้างบัญชีไม่สำเร็จ" };
      if (data?.error) return { error: data.error };

      await loadProfiles();
      return { success: true };
    } catch (err) {
      return { error: err.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ" };
    }
  };

  // ── Likes ──────────────────────────────────────────────────────────────────
  const handleToggleLike = async (announcementId) => {
    if (!supabase) return;
    const existing = likes.find(l => l.announcement_id === announcementId && l.user_id === user.id);
    if (existing) {
      await supabase.from("announcement_likes").delete().eq("id", existing.id);
      setLikes(prev => prev.filter(l => l.id !== existing.id));
    } else {
      const { data, error } = await supabase.from("announcement_likes").insert([{
        announcement_id: announcementId, user_id: user.id, user_name: user.name,
      }]).select().single();
      if (!error && data) setLikes(prev => [...prev, data]);
    }
  };

  // ── Comments ───────────────────────────────────────────────────────────────
  const handleAddComment = async (announcementId, text) => {
    if (!supabase || !text.trim()) return;
    const { data, error } = await supabase.from("announcement_comments").insert([{
      announcement_id: announcementId, user_id: user.id,
      user_name: user.name, user_role: user.role, text: text.trim(),
    }]).select().single();
    if (!error && data) setComments(prev => [...prev, dbToComment(data)]);
  };

  const handleDeleteComment = async (id) => {
    if (!supabase) return;
    await supabase.from("announcement_comments").delete().eq("id", id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  // ── Exercises CRUD ────────────────────────────────────────────────────────
  const handleAddExercise = async (ex) => {
    if (!supabase) return;
    const { data, error } = await supabase.from("exercises").insert([{
      author_id: ex.authorId, author_name: ex.author,
      title: ex.title, subject: ex.subject,
      description: ex.description, due_date: ex.dueDate,
      questions: ex.questions,
    }]).select().single();
    if (!error && data) setExercises(prev => [dbToExercise(data), ...prev]);
  };

  const handleDeleteExercise = async (id) => {
    if (!supabase) return;
    await supabase.from("exercises").delete().eq("id", id);
    setExercises(prev => prev.filter(e => e.id !== id));
    setSubmissions(prev => prev.filter(s => s.exerciseId !== id));
  };

  // ── Submissions ───────────────────────────────────────────────────────────
  const handleSubmitExercise = async (exId, answers, score, maxScore, percentage, comment, results) => {
    const newSub = {
      exercise_id: exId, student_id: user.id, student_name: user.name,
      answers, score, max_score: maxScore, percentage, comment, results,
    };
    if (supabase) {
      const { data, error } = await supabase.from("submissions").insert([newSub]).select().single();
      if (!error && data) { setSubmissions(prev => [...prev, dbToSubmission(data)]); return; }
    }
    setSubmissions(prev => [...prev, {
      id: "sub" + Date.now(), exerciseId: exId,
      studentId: user.id, studentName: user.name,
      answers, score, maxScore, percentage, comment, results, date: "วันนี้",
    }]);
  };

  const handleDeleteSubmission = async (id) => {
    if (!supabase) return;
    await supabase.from("submissions").delete().eq("id", id);
    setSubmissions(prev => prev.filter(s => s.id !== id));
  };

  if (authLoading) return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: COLORS.blue,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, fontWeight: 800, color: COLORS.white,
      }}>E</div>
      <div style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 600 }}>กำลังโหลด...</div>
      <div style={{ display:"flex", gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:7, height:7, borderRadius:"50%",
            background: COLORS.blue,
            opacity: 0.5,
            animation: `loadingDot 1s ${i*0.15}s infinite ease-in-out`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes loadingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );

  if (!user) return <LoginScreen onLogin={async (u) => {
    setUser(u); setPage("dashboard"); await loadData();
    await loadProfiles();
    await loadNotifications(u.id);
  }} />;

  const isTeacher = user.role === "teacher";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: G.mesh, fontFamily: "'Plus Jakarta Sans','Noto Sans Thai', system-ui, sans-serif" }}>
      <Sidebar user={user} page={activeExercise ? "exercises" : page} setPage={p => { setPage(p); setActiveExercise(null); }}
        onLogout={handleLogout}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content */}
      <main style={{ marginLeft: 260, flex: 1, padding: "36px 32px", minHeight: "100vh", position:"relative" }}>
        <div>
        {/* Mobile hamburger */}
        <button className="mobile-hamburger" onClick={() => setMobileOpen(true)} style={{
          display: "none", position: "fixed", top: 16, left: 16, zIndex: 80,
          background: COLORS.navy, border: "none", borderRadius: 10, padding: "8px 14px",
          color: COLORS.white, cursor: "pointer", fontSize: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>≡</button>

        {/* แถบบนสุด: กระดิ่งแจ้งเตือน */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <NotificationBell
            notifications={notifications}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onGoToAnnouncement={() => { setPage("announcements"); setActiveExercise(null); }}
          />
        </div>

        {page === "dashboard" && !activeExercise && (
          <Dashboard user={user} announcements={announcements} exercises={exercises}
            submissions={submissions} messages={messages} setPage={setPage} />
        )}
        {page === "announcements" && !activeExercise && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <Announcements user={user} announcements={announcements}
              onAdd={handleAddAnnouncement} onDelete={handleDeleteAnnouncement}
              likes={likes} comments={comments}
              onToggleLike={handleToggleLike} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} />
          </>
        )}
        {page === "messages" && !activeExercise && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <Messages user={user} messages={messages} onSend={handleSendMessage} profiles={profiles} />
          </>
        )}
        {page === "exercises" && !activeExercise && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <ExerciseList user={user} exercises={exercises}
              onAdd={handleAddExercise} onDelete={handleDeleteExercise}
              submissions={submissions}
              onOpenExercise={ex => setActiveExercise(ex)} />
          </>
        )}
        {page === "exercises" && activeExercise && (
          <ExerciseAttempt user={user} exercise={activeExercise}
            onSubmit={handleSubmitExercise}
            onBack={() => setActiveExercise(null)} />
        )}
        {page === "lessons" && !activeExercise && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <LearningContent user={user} lessons={lessons}
              onAdd={handleAddLesson} onDelete={handleDeleteLesson} />
          </>
        )}
        {page === "results" && isTeacher && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <Results user={user} exercises={exercises} submissions={submissions}
              onDeleteSubmission={handleDeleteSubmission} onDeleteExercise={handleDeleteExercise} />
          </>
        )}
        {page === "myscores" && !isTeacher && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <MyScores user={user} submissions={submissions} exercises={exercises} />
          </>
        )}
        {page === "users" && isTeacher && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <UserManagement profiles={profiles} loading={profilesLoading} onCreateStudent={handleCreateStudent} />
          </>
        )}
        {page === "help" && !activeExercise && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <HelpCenter user={user} />
          </>
        )}
        {page === "settings" && !activeExercise && (
          <>
            <BackButton onClick={() => setPage("dashboard")} />
            <Settings user={user} onSave={setUser} />
          </>
        )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        input::placeholder, textarea::placeholder { color: #94A3B8; }

        /* ── Mobile responsive ── */
        @media (max-width: 700px) {
          main { margin-left: 0 !important; padding: 72px 14px 24px !important; }
          .mobile-hamburger { display: flex !important; }
          .app-sidebar { transform: translateX(-100%); }
          .app-sidebar.mobile-open { transform: translateX(0) !important; }

          /* Stack 2-column grids into 1 column on mobile */
          .grid-2col { grid-template-columns: 1fr !important; }
          .grid-4col { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-sidebar-results { grid-template-columns: 1fr !important; }
          .grid-sidebar-settings { grid-template-columns: 1fr !important; }

          /* Reduce heading sizes slightly */
          h1 { font-size: 22px !important; }
          h2 { font-size: 19px !important; }

          /* Tables scroll horizontally instead of breaking layout */
          table { min-width: 560px !important; }
        }

        @media (max-width: 480px) {
          .grid-4col { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          main { padding: 64px 10px 20px !important; }
        }
      `}</style>
    </div>
  );
}
