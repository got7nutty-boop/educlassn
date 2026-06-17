import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ── Design tokens ──────────────────────────────────────────────────────────
// Palette: deep navy (#0F1B3C) + warm saffron (#F5A623) + soft jade (#3DBCA1)
// + off-white (#F7F4EE) + slate (#5C6B8A)
// Type: system-ui body, heavier weights for display, mono for scores/numbers
// Signature: colour-coded role "badge bar" along the top edge of every card

const COLORS = {
  navy: "#0F1B3C",
  navyLight: "#1A2E5A",
  saffron: "#F5A623",
  saffronLight: "#FDE8B8",
  jade: "#3DBCA1",
  jadeLight: "#C8EEE8",
  bg: "#F7F4EE",
  white: "#FFFFFF",
  slate: "#5C6B8A",
  slateLight: "#E8ECF4",
  red: "#E84C4C",
  redLight: "#FDEAEA",
  green: "#27AE60",
  greenLight: "#D4EDDA",
};

// ── Mock data ──────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const USERS = {
  teacher: [
    { id: "t1", name: "อาจารย์สมชาย ใจดี", role: "teacher", subject: "คณิตศาสตร์", department: "แผนกวิชาสามัญสัมพันธ์", username: "teacher1", password: "1234" },
    { id: "t2", name: "อาจารย์สุมาลี รักเรียนดี", role: "teacher", subject: "ภาษาไทย", department: "แผนกวิชาสามัญสัมพันธ์", username: "teacher2", password: "1234" },
  ],
  student: [
    { id: "s1", name: "นายกิตติ มานะ", role: "student", department: "แผนกวิชาคอมพิวเตอร์ธุรกิจ", level: "ปวช.1", class: "ปวช.1/1", username: "student1", password: "1234" },
    { id: "s2", name: "นางสาวนิดา สุขใจ", role: "student", department: "แผนกวิชาการบัญชี", level: "ปวช.1", class: "ปวช.1/1", username: "student2", password: "1234" },
    { id: "s3", name: "นายภูมิ วิชาดี", role: "student", department: "แผนกวิชาเทคโนโลยีสารสนเทศ", level: "ปวช.2", class: "ปวช.2/1", username: "student3", password: "1234" },
  ],
};

// eslint-disable-next-line no-unused-vars
const INITIAL_ANNOUNCEMENTS = [
  { id: "a1", author: "อาจารย์สมชาย ใจดี", authorId: "t1", subject: "📢 หยุดเรียนวันพรุ่งนี้", body: "เนื่องจากมีกิจกรรมวันไหว้ครู นักเรียนทุกคนหยุดเรียนในวันพรุ่งนี้ค่ะ/ครับ", date: "15 มิ.ย. 2568", pinned: true },
  { id: "a2", author: "อาจารย์สุมาลี รักเรียน", authorId: "t2", subject: "📝 ส่งงานภาษาไทย", body: "ขอให้นักเรียนส่งงานเรื่องการแต่งกลอนสุภาพภายในวันศุกร์นี้นะคะ", date: "14 มิ.ย. 2568", pinned: false },
];

// eslint-disable-next-line no-unused-vars
const INITIAL_EXERCISES = [
  {
    id: "ex1",
    title: "แบบฝึกหัดคณิตศาสตร์ บทที่ 1",
    subject: "คณิตศาสตร์",
    author: "อาจารย์สมชาย ใจดี",
    authorId: "t1",
    dueDate: "20 มิ.ย. 2568",
    description: "ฝึกทักษะพีชคณิตเบื้องต้น",
    questions: [
      { id: "q1", text: "ถ้า x + 5 = 12 แล้ว x มีค่าเท่าใด?", answer: "7", hint: "ลบ 5 ออกจากทั้งสองข้าง" },
      { id: "q2", text: "2x - 3 = 9 แล้ว x มีค่าเท่าใด?", answer: "6", hint: "บวก 3 แล้วหาร 2" },
      { id: "q3", text: "พื้นที่สี่เหลี่ยมที่มีด้านยาว 8 ซม. และกว้าง 5 ซม. มีค่าเท่าใด?", answer: "40", hint: "พื้นที่ = กว้าง × ยาว" },
    ],
  },
  {
    id: "ex2",
    title: "แบบฝึกหัดภาษาไทย บทที่ 2",
    subject: "ภาษาไทย",
    author: "อาจารย์สุมาลี รักเรียน",
    authorId: "t2",
    dueDate: "18 มิ.ย. 2568",
    description: "ทบทวนไวยากรณ์ภาษาไทย",
    questions: [
      { id: "q1", text: "คำว่า 'กอไผ่' มีกี่พยางค์?", answer: "2", hint: "นับพยางค์: กอ-ไผ่" },
      { id: "q2", text: "คำว่า 'สวรรค์' เป็นคำประเภทใด?", answer: "คำนาม", hint: "พิจารณาว่าเป็นชื่อสิ่งใด" },
      { id: "q3", text: "ประโยค 'แมวกินปลา' มีกี่ส่วนประกอบหลัก?", answer: "3", hint: "ประธาน กริยา กรรม" },
    ],
  },
];

const INITIAL_MESSAGES = [
  { id: "m1", from: "อาจารย์สมชาย ใจดี", fromId: "t1", to: "นักเรียนทุกคน", text: "วันนี้เรียนออนไลน์ผ่าน Zoom นะครับ ลิงก์ส่งทาง Line แล้ว", date: "15 มิ.ย.", type: "broadcast" },
];

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
  date: formatDate(r.created_at),
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

// ── Components ─────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const isTeacher = role === "teacher";
  return (
    <span style={{
      background: isTeacher ? COLORS.saffron : COLORS.jade,
      color: isTeacher ? COLORS.navy : COLORS.white,
      fontSize: 11, fontWeight: 700, letterSpacing: 1,
      padding: "2px 10px", borderRadius: 20, textTransform: "uppercase",
    }}>
      {isTeacher ? "ครู" : "นักเรียน"}
    </span>
  );
}

function Card({ children, style, accent }) {
  return (
    <div style={{
      background: COLORS.white,
      borderRadius: 16,
      boxShadow: "0 2px 12px rgba(15,27,60,0.08)",
      overflow: "hidden",
      ...style,
    }}>
      {accent && <div style={{ height: 4, background: accent }} />}
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md", disabled, style }) {
  const base = {
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 10, fontWeight: 600, transition: "all .18s",
    fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
    opacity: disabled ? 0.55 : 1,
    fontSize: size === "sm" ? 13 : 15,
    padding: size === "sm" ? "6px 14px" : "10px 22px",
    ...style,
  };
  const variants = {
    primary: { background: COLORS.navy, color: COLORS.white },
    saffron: { background: COLORS.saffron, color: COLORS.navy },
    jade: { background: COLORS.jade, color: COLORS.white },
    ghost: { background: COLORS.slateLight, color: COLORS.navy },
    danger: { background: COLORS.red, color: COLORS.white },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontWeight: 600, color: COLORS.navy, marginBottom: 6, fontSize: 14 }}>{label}</label>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          border: `1.5px solid ${COLORS.slateLight}`, borderRadius: 10,
          padding: "10px 14px", fontSize: 15, fontFamily: "inherit",
          background: COLORS.bg, color: COLORS.navy,
          outline: "none", transition: "border .15s",
        }}
        onFocus={e => e.target.style.borderColor = COLORS.saffron}
        onBlur={e => e.target.style.borderColor = COLORS.slateLight}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontWeight: 600, color: COLORS.navy, marginBottom: 6, fontSize: 14 }}>{label}</label>}
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{
          width: "100%", boxSizing: "border-box",
          border: `1.5px solid ${COLORS.slateLight}`, borderRadius: 10,
          padding: "10px 14px", fontSize: 15, fontFamily: "inherit",
          background: COLORS.bg, color: COLORS.navy, resize: "vertical",
          outline: "none",
        }}
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

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 60%, #223A70 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: COLORS.saffron, margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, boxShadow: "0 8px 32px rgba(245,166,35,0.35)",
          }}>🏫</div>
          <h1 style={{ color: COLORS.white, fontSize: 28, fontWeight: 800, margin: 0 }}>EduClass</h1>
          <p style={{ color: COLORS.slate, margin: "6px 0 0", fontSize: 15 }}>ระบบจัดการการเรียนการสอน</p>
        </div>

        <Card accent={role === "teacher" ? COLORS.saffron : COLORS.jade}>
          <div style={{ padding: 32 }}>
            {/* Role toggle */}
            <div style={{
              display: "flex", background: COLORS.slateLight,
              borderRadius: 12, padding: 4, marginBottom: 28,
            }}>
              {["student", "teacher"].map(r => (
                <button key={r} onClick={() => { setRole(r); setError(""); setUsername(""); setPassword(""); }}
                  style={{
                    flex: 1, padding: "9px 0", border: "none", cursor: "pointer",
                    borderRadius: 9, fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                    transition: "all .2s",
                    background: role === r ? (r === "teacher" ? COLORS.saffron : COLORS.jade) : "transparent",
                    color: role === r ? (r === "teacher" ? COLORS.navy : COLORS.white) : COLORS.slate,
                    boxShadow: role === r ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  }}>
                  {r === "student" ? "🎒 นักเรียน" : "📚 ครูผู้สอน"}
                </button>
              ))}
            </div>

            <Input label="อีเมล" value={username} onChange={setUsername} placeholder={role === "teacher" ? "teacher1@example.com" : "student1@example.com"} />
            <Input label="รหัสผ่าน" value={password} onChange={setPassword} type="password" placeholder="••••" />

            {error && (
              <div style={{ background: COLORS.redLight, color: COLORS.red, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}

            <Button onClick={handleLogin} disabled={loading} variant={role === "teacher" ? "saffron" : "jade"} style={{ width: "100%", justifyContent: "center", fontSize: 16 }}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>

            <div style={{ marginTop: 20, padding: 14, background: COLORS.bg, borderRadius: 10, fontSize: 12, color: COLORS.slate }}>
              <strong>Supabase:</strong> ใช้อีเมลและรหัสผ่านจาก Authentication แล้วกำหนดบทบาทในตาราง profiles
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ user, page, setPage, onLogout, mobileOpen, setMobileOpen }) {
  const isTeacher = user.role === "teacher";
  const nav = [
    { id: "dashboard", icon: "🏠", label: "แดชบอร์ด" },
    { id: "announcements", icon: "📢", label: "ประกาศ/ข่าวสาร" },
    { id: "messages", icon: "💬", label: "ส่งข้อความ" },
    { id: "exercises", icon: "✏️", label: "แบบฝึกหัด" },
    ...(isTeacher ? [{ id: "results", icon: "📊", label: "ผลการทำแบบฝึกหัด" }] : [{ id: "myscores", icon: "⭐", label: "คะแนนของฉัน" }]),
    { id: "settings", icon: "⚙️", label: "ตั้งค่า" },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 90,
        }} />
      )}
      <aside style={{
        width: 240, background: COLORS.navy, display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        transform: mobileOpen ? "translateX(0)" : undefined,
        transition: "transform .25s",
        boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${COLORS.navyLight}` }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🏫</div>
          <div style={{ fontWeight: 800, color: COLORS.white, fontSize: 18 }}>EduClass</div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: isTeacher ? COLORS.saffron : COLORS.jade,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, color: isTeacher ? COLORS.navy : COLORS.white, fontSize: 15,
            }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <div style={{ color: COLORS.white, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                {user.name.length > 16 ? user.name.slice(0, 16) + "…" : user.name}
              </div>
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setMobileOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "11px 14px", borderRadius: 10,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                fontWeight: page === n.id ? 700 : 500, fontSize: 14,
                marginBottom: 4,
                background: page === n.id ? (isTeacher ? COLORS.saffron : COLORS.jade) : "transparent",
                color: page === n.id ? (isTeacher ? COLORS.navy : COLORS.white) : "#A8B8D0",
                textAlign: "left", transition: "all .15s",
              }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.navyLight}` }}>
          <Button onClick={onLogout} variant="ghost" size="sm" style={{ width: "100%", justifyContent: "center", color: COLORS.slate }}>
            🚪 ออกจากระบบ
          </Button>
        </div>
      </aside>
    </>
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
        { label: "แบบฝึกหัดที่มอบหมาย", value: exercises.filter(e => e.authorId === user.id).length, icon: "📝", color: COLORS.saffron },
        { label: "ส่งงานแล้ว", value: teacherSubmissions.length, icon: "✅", color: COLORS.jade },
        { label: "ประกาศทั้งหมด", value: announcements.filter(a => a.authorId === user.id).length, icon: "📢", color: COLORS.navyLight },
      ]
    : [
        { label: "แบบฝึกหัดทั้งหมด", value: totalExercises, icon: "📝", color: COLORS.navy },
        { label: "ส่งแล้ว", value: doneCount, icon: "✅", color: COLORS.jade },
        { label: "คะแนนเฉลี่ย", value: avgScore + "%", icon: "⭐", color: COLORS.saffron },
      ];

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.navy, margin: "0 0 6px" }}>
        สวัสดี, {user.name} 👋
      </h2>
      <p style={{ color: COLORS.slate, margin: "0 0 28px", fontSize: 15 }}>
        {isTeacher ? `วิชา: ${user.subject}` : `ห้อง: ${user.class}`}
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <Card key={i} accent={s.color}>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.navy, fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ color: COLORS.slate, fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Latest announcements */}
        <Card accent={COLORS.jade}>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 14, fontSize: 15, display: "flex", justifyContent: "space-between" }}>
              📢 ประกาศล่าสุด
              <button onClick={() => setPage("announcements")} style={{ background: "none", border: "none", color: COLORS.jade, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>ดูทั้งหมด →</button>
            </div>
            {announcements.slice(0, 3).map(a => (
              <div key={a.id} style={{ borderLeft: `3px solid ${a.pinned ? COLORS.saffron : COLORS.slateLight}`, paddingLeft: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}>{a.subject}</div>
                <div style={{ fontSize: 12, color: COLORS.slate }}>{a.author} · {a.date}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming exercises */}
        <Card accent={COLORS.saffron}>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 14, fontSize: 15, display: "flex", justifyContent: "space-between" }}>
              ✏️ แบบฝึกหัดที่ยังไม่ส่ง
              <button onClick={() => setPage("exercises")} style={{ background: "none", border: "none", color: COLORS.saffron, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>ดูทั้งหมด →</button>
            </div>
            {exercises.filter(e => !mySubmissions.find(s => s.exerciseId === e.id)).slice(0, 3).map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 10px", background: COLORS.bg, borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.slate }}>ครบกำหนด: {e.dueDate}</div>
                </div>
                <span style={{ fontSize: 18 }}>📌</span>
              </div>
            ))}
            {exercises.filter(e => !mySubmissions.find(s => s.exerciseId === e.id)).length === 0 && (
              <div style={{ color: COLORS.green, fontWeight: 600, fontSize: 14 }}>✅ ส่งงานครบทุกชิ้นแล้ว!</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Announcements ──────────────────────────────────────────────────────────
function Announcements({ user, announcements, onAdd, onDelete }) {
  const isTeacher = user.role === "teacher";
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePost = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSaving(true);
    await onAdd({ author: user.name, authorId: user.id, subject, body, pinned });
    setSubject(""); setBody(""); setPinned(false); setShowForm(false);
    setSaving(false);
  };

  const handleDelete = (id) => onDelete(id);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, margin: 0 }}>📢 ประกาศ / ข่าวสาร</h2>
        {isTeacher && <Button onClick={() => setShowForm(!showForm)} variant="saffron">+ โพสต์ประกาศ</Button>}
      </div>

      {isTeacher && showForm && (
        <Card accent={COLORS.saffron} style={{ marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: COLORS.navy }}>✍️ เขียนประกาศใหม่</h3>
            <Input label="หัวข้อประกาศ" value={subject} onChange={setSubject} placeholder="เช่น หยุดเรียนพิเศษ..." />
            <Textarea label="รายละเอียด" value={body} onChange={setBody} placeholder="เนื้อหาประกาศ..." />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <input type="checkbox" id="pin" checked={pinned} onChange={e => setPinned(e.target.checked)} />
              <label htmlFor="pin" style={{ fontWeight: 600, color: COLORS.navy, cursor: "pointer" }}>📌 ปักหมุดประกาศนี้</label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={handlePost} variant="saffron" disabled={saving}>{saving ? "กำลังบันทึก..." : "โพสต์"}</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost">ยกเลิก</Button>
            </div>
          </div>
        </Card>
      )}

      {announcements.map(a => (
        <Card key={a.id} accent={a.pinned ? COLORS.saffron : COLORS.slateLight} style={{ marginBottom: 16 }}>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                {a.pinned && <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.saffron, letterSpacing: 1 }}>📌 ปักหมุด  </span>}
                <h3 style={{ margin: "4px 0 8px", color: COLORS.navy, fontSize: 17 }}>{a.subject}</h3>
                <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 10 }}>{a.author} · {a.date}</div>
                <p style={{ margin: 0, color: "#334", lineHeight: 1.7 }}>{a.body}</p>
              </div>
              {isTeacher && a.authorId === user.id && (
                <Button onClick={() => handleDelete(a.id)} variant="danger" size="sm">🗑</Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Messages ───────────────────────────────────────────────────────────────
function Messages({ user, messages, setMessages }) {
  const [text, setText] = useState("");
  const [toAll, setToAll] = useState(true);
  const [target, setTarget] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    const msg = {
      id: "m" + Date.now(), from: user.name, fromId: user.id,
      to: toAll ? "นักเรียนทุกคน" : target,
      text, date: "วันนี้",
      type: toAll ? "broadcast" : "direct",
    };
    setMessages([...messages, msg]);
    setText("");
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, margin: "0 0 20px" }}>💬 ส่งข้อความ</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Message list */}
        <Card accent={COLORS.jade} style={{ marginBottom: 20 }}>
          <div style={{ padding: 20, maxHeight: 380, overflowY: "auto" }}>
            {messages.map(m => {
              const isMe = m.fromId === user.id;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 16 }}>
                  <div style={{ maxWidth: "75%" }}>
                    {!isMe && <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 4 }}>{m.from}</div>}
                    <div style={{
                      background: isMe ? COLORS.jade : COLORS.slateLight,
                      color: isMe ? COLORS.white : COLORS.navy,
                      padding: "10px 14px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      fontSize: 15, lineHeight: 1.6,
                    }}>
                      {m.type === "broadcast" && <span style={{ fontSize: 11, fontWeight: 700, opacity: .8, display: "block", marginBottom: 2 }}>→ {m.to}</span>}
                      {m.text}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.slate, marginTop: 4, textAlign: isMe ? "right" : "left" }}>{m.date}</div>
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
                }}>📣 ส่งถึงทุกคน</button>
                <button onClick={() => setToAll(false)} style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                  background: !toAll ? COLORS.saffron : COLORS.slateLight,
                  color: !toAll ? COLORS.navy : COLORS.slate,
                }}>👤 ส่งถึงนักเรียนคนเดิม</button>
              </div>
            )}
            {!toAll && <Input value={target} onChange={setTarget} placeholder="ชื่อนักเรียน..." />}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="พิมพ์ข้อความ..." style={{
                  flex: 1, border: `1.5px solid ${COLORS.slateLight}`, borderRadius: 10,
                  padding: "10px 14px", fontSize: 15, fontFamily: "inherit",
                  background: COLORS.bg, color: COLORS.navy, outline: "none",
                }} />
              <Button onClick={handleSend} variant="jade">ส่ง ➤</Button>
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
        <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, margin: 0 }}>✏️ แบบฝึกหัด</h2>
        {isTeacher && <Button onClick={() => setShowForm(!showForm)} variant="saffron">+ สร้างแบบฝึกหัด</Button>}
      </div>

      {isTeacher && showForm && (
        <Card accent={COLORS.saffron} style={{ marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: COLORS.navy }}>📝 สร้างแบบฝึกหัดใหม่</h3>
            <Input label="ชื่อแบบฝึกหัด" value={title} onChange={setTitle} placeholder="เช่น แบบฝึกหัดคณิตศาสตร์ บทที่ 1" />
            <Textarea label="คำอธิบาย" value={description} onChange={setDescription} placeholder="รายละเอียดแบบฝึกหัด..." rows={2} />
            <Input label="วันครบกำหนด" value={dueDate} onChange={setDueDate} placeholder="เช่น 25 มิ.ย. 2568" />
            <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 12 }}>คำถาม (กรอกคำถามและเฉลย)</div>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={qTexts[i]} onChange={e => { const a = [...qTexts]; a[i] = e.target.value; setQTexts(a); }}
                  placeholder={`คำถามที่ ${i + 1}`} style={{ border: `1.5px solid ${COLORS.slateLight}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", background: COLORS.bg, color: COLORS.navy, outline: "none" }} />
                <input value={qAnswers[i]} onChange={e => { const a = [...qAnswers]; a[i] = e.target.value; setQAnswers(a); }}
                  placeholder="เฉลย" style={{ border: `1.5px solid ${COLORS.slateLight}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, fontFamily: "inherit", background: COLORS.bg, color: COLORS.navy, outline: "none" }} />
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
                <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 6 }}>{ex.subject} · {ex.author}</div>
                <h3 style={{ margin: "0 0 8px", color: COLORS.navy, fontSize: 16 }}>{ex.title}</h3>
                <p style={{ margin: "0 0 12px", color: COLORS.slate, fontSize: 14 }}>{ex.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: COLORS.slate }}>📅 {ex.dueDate}</span>
                  {mySubmit
                    ? <span style={{ background: COLORS.greenLight, color: COLORS.green, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>✅ {mySubmit.percentage}%</span>
                    : <span style={{ background: COLORS.saffronLight, color: COLORS.navy, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>ยังไม่ส่ง</span>}
                </div>
                {!isTeacher && !mySubmit && (
                  <Button onClick={e => { e.stopPropagation(); onOpenExercise(ex); }} variant="saffron" size="sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>ทำแบบฝึกหัด →</Button>
                )}
                {isTeacher && ex.authorId === user.id && (
                  <Button onClick={e => { e.stopPropagation(); if(window.confirm("ลบแบบฝึกหัดนี้?")) onDelete(ex.id); }} variant="danger" size="sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>🗑 ลบแบบฝึกหัด</Button>
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
            <div style={{ fontSize: 64 }}>{result.percentage >= 80 ? "🌟" : result.percentage >= 60 ? "😊" : "💪"}</div>
            <h2 style={{ color: COLORS.navy, fontSize: 28, margin: "12px 0 4px" }}>คะแนนของคุณ</h2>
            <div style={{ fontSize: 56, fontWeight: 900, color: result.percentage >= 70 ? COLORS.green : COLORS.red, fontFamily: "monospace" }}>
              {result.percentage}%
            </div>
            <div style={{ color: COLORS.slate, fontSize: 18, marginBottom: 8 }}>{result.totalScore} / {result.maxScore} ข้อ</div>
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: 16, marginTop: 16, color: COLORS.navy, lineHeight: 1.7 }}>
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
                    <span style={{ fontSize: 20 }}>{r.correct ? "✅" : "❌"}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: COLORS.navy, marginBottom: 4 }}>ข้อ {i + 1}: {q.text}</div>
                      <div style={{ fontSize: 14, color: COLORS.slate }}>คำตอบของคุณ: <strong>{answers["q" + i] || "(ไม่ได้ตอบ)"}</strong></div>
                      {!r.correct && <div style={{ fontSize: 14, color: COLORS.green, marginTop: 2 }}>เฉลย: <strong>{q.answer}</strong></div>}
                      <div style={{ fontSize: 13, color: COLORS.slate, marginTop: 4, fontStyle: "italic" }}>{r.feedback}</div>
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
          <h2 style={{ color: COLORS.navy, margin: "0 0 6px" }}>{exercise.title}</h2>
          <div style={{ color: COLORS.slate, fontSize: 14 }}>👨‍🏫 {exercise.author} · 📅 ครบกำหนด {exercise.dueDate}</div>
          {exercise.description && <p style={{ margin: "10px 0 0", color: COLORS.navy }}>{exercise.description}</p>}
        </div>
      </Card>

      {exercise.questions.map((q, i) => (
        <Card key={i} style={{ marginBottom: 16 }}>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 12 }}>ข้อ {i + 1}. {q.text}</div>
            {q.hint && <div style={{ fontSize: 13, color: COLORS.jade, marginBottom: 10 }}>💡 คำใบ้: {q.hint}</div>}
            <input
              value={answers["q" + i] || ""}
              onChange={e => setAnswers({ ...answers, ["q" + i]: e.target.value })}
              placeholder="พิมพ์คำตอบของคุณ..."
              style={{
                width: "100%", boxSizing: "border-box",
                border: `2px solid ${answers["q" + i] ? COLORS.jade : COLORS.slateLight}`,
                borderRadius: 10, padding: "10px 14px", fontSize: 15,
                fontFamily: "inherit", background: COLORS.bg, color: COLORS.navy,
                outline: "none", transition: "border .15s",
              }}
            />
          </div>
        </Card>
      ))}

      <Button onClick={handleSubmit} disabled={loading} variant="jade" style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "14px 0" }}>
        {loading ? "⏳ กำลังตรวจคำตอบด้วย AI..." : "📤 ส่งแบบฝึกหัด"}
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
    { label: "แบบฝึกหัดของฉัน", value: myExercises.length, icon: "📝", color: COLORS.saffron },
    { label: "ผู้ส่งทั้งหมด", value: teacherSubmissions.length, icon: "✅", color: COLORS.jade },
    { label: "คะแนนเฉลี่ย", value: `${averageScore}%`, icon: "📈", color: COLORS.navyLight },
    { label: "คะแนนสูงสุด", value: `${highestScore}%`, icon: "🏆", color: COLORS.green },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, margin: 0 }}>📊 แดชบอร์ดคะแนนแบบฝึกหัด</h2>
          <p style={{ color: COLORS.slate, margin: "6px 0 0", fontSize: 14 }}>
            รวบรวมผลการทำแบบฝึกหัดและรายชื่อนักเรียนที่ส่งงานแล้ว
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 20 }}>
        {stats.map(stat => (
          <Card key={stat.label} accent={stat.color}>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: COLORS.slate, fontSize: 13, fontWeight: 700 }}>{stat.label}</span>
                <span style={{ fontSize: 22 }}>{stat.icon}</span>
              </div>
              <div style={{ color: COLORS.navy, fontSize: 28, fontWeight: 900, fontFamily: "monospace" }}>{stat.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <Card>
          <div style={{ padding: 18 }}>
            <h3 style={{ color: COLORS.navy, margin: "0 0 14px", fontSize: 16 }}>รายการแบบฝึกหัด</h3>
            {myExercises.length === 0 ? (
              <div style={{ color: COLORS.slate, fontSize: 14 }}>ยังไม่มีแบบฝึกหัดที่สร้างไว้</div>
            ) : myExercises.map(ex => {
              const sentCount = submissions.filter(s => s.exerciseId === ex.id).length;
              return (
                <button key={ex.id} onClick={() => setSelectedEx(ex)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "inherit", marginBottom: 8,
                  background: selectedEx?.id === ex.id ? COLORS.saffronLight : COLORS.bg,
                  color: COLORS.navy,
                  fontWeight: selectedEx?.id === ex.id ? 800 : 600,
                  borderLeft: `4px solid ${selectedEx?.id === ex.id ? COLORS.saffron : COLORS.slateLight}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.4 }}>{ex.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>{ex.subject} · ส่งแล้ว {sentCount} คน</div>
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
                    <h3 style={{ margin: "0 0 6px", color: COLORS.navy }}>{selectedEx.title}</h3>
                    <div style={{ color: COLORS.slate, fontSize: 14 }}>{selectedEx.subject} · ครบกำหนด {selectedEx.dueDate}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ background: COLORS.bg, borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 88 }}>
                      <div style={{ color: COLORS.slate, fontSize: 12, fontWeight: 700 }}>ผู้ส่ง</div>
                      <div style={{ color: COLORS.navy, fontSize: 20, fontWeight: 900 }}>{exSubs.length}</div>
                    </div>
                    <div style={{ background: COLORS.bg, borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 88 }}>
                      <div style={{ color: COLORS.slate, fontSize: 12, fontWeight: 700 }}>เฉลี่ย</div>
                      <div style={{ color: selectedAverage >= 70 ? COLORS.green : COLORS.red, fontSize: 20, fontWeight: 900 }}>{selectedAverage}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: 22 }}>
                <h3 style={{ color: COLORS.navy, margin: "0 0 16px", fontSize: 16 }}>รายชื่อนักเรียนที่ทำแบบฝึกหัด</h3>
                {exSubs.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: COLORS.slate, background: COLORS.bg, borderRadius: 12 }}>
                    ยังไม่มีนักเรียนส่งแบบฝึกหัดนี้
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                      <thead>
                        <tr style={{ background: COLORS.bg }}>
                          {["นักเรียน", "วันที่ส่ง", "คะแนน", "เปอร์เซ็นต์", "สถานะ"].map(head => (
                            <th key={head} style={{ textAlign: "left", padding: "12px 14px", color: COLORS.slate, fontSize: 13, fontWeight: 800 }}>
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exSubs.map(s => (
                          <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.slateLight}` }}>
                            <td style={{ padding: "14px", color: COLORS.navy, fontWeight: 700 }}>{s.studentName}</td>
                            <td style={{ padding: "14px", color: COLORS.slate, fontSize: 14 }}>{s.date}</td>
                            <td style={{ padding: "14px", color: COLORS.navy, fontWeight: 700 }}>{s.score}/{s.maxScore}</td>
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
            <div style={{ padding: 40, textAlign: "center", color: COLORS.slate }}>
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
      <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, margin: "0 0 20px" }}>⭐ คะแนนของฉัน</h2>
      {mySubmissions.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: COLORS.slate }}>ยังไม่มีการส่งแบบฝึกหัด</div></Card>
      ) : (
        mySubmissions.map(s => {
          const ex = exercises.find(e => e.id === s.exerciseId);
          return (
            <Card key={s.id} accent={s.percentage >= 70 ? COLORS.green : COLORS.red} style={{ marginBottom: 14 }}>
              <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 16 }}>{ex?.title || "แบบฝึกหัด"}</div>
                  <div style={{ fontSize: 13, color: COLORS.slate }}>{ex?.subject} · ส่ง: {s.date}</div>
                  {s.comment && <div style={{ fontSize: 13, color: COLORS.jade, marginTop: 6, fontStyle: "italic" }}>💬 {s.comment}</div>}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: s.percentage >= 70 ? COLORS.greenLight : COLORS.redLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: 20, fontFamily: "monospace",
                    color: s.percentage >= 70 ? COLORS.green : COLORS.red,
                  }}>{s.percentage}%</div>
                  <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>{s.score}/{s.maxScore}</div>
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

    onSave(nextUser);
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, margin: "0 0 20px" }}>
        ⚙️ ตั้งค่าข้อมูลส่วนตัว
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 20 }}>
        <Card accent={isTeacher ? COLORS.saffron : COLORS.jade}>
          <div style={{ padding: 24 }}>
            <h3 style={{ color: COLORS.navy, margin: "0 0 18px", fontSize: 18 }}>
              {isTeacher ? "ข้อมูลครู" : "ข้อมูลนักเรียนนักศึกษา"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
                ✅ บันทึกข้อมูลเรียบร้อยแล้ว
              </div>
            )}
            {error && (
              <div style={{ background: COLORS.redLight, color: COLORS.red, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontWeight: 700 }}>
                ⚠️ {error}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} variant={isTeacher ? "saffron" : "jade"}>
              {saving ? "กำลังบันทึก..." : "💾 บันทึกการแก้ไข"}
            </Button>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 22 }}>
            <div style={{
              width: 58, height: 58, borderRadius: "50%",
              background: isTeacher ? COLORS.saffron : COLORS.jade,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 800, color: isTeacher ? COLORS.navy : COLORS.white,
              marginBottom: 14,
            }}>
              {(firstName || user.name).charAt(0)}
            </div>
            <div style={{ color: COLORS.navy, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>
              {`${firstName} ${lastName}`.trim() || user.name}
            </div>
            <div style={{ marginTop: 8 }}><RoleBadge role={user.role} /></div>
            <div style={{ marginTop: 18, color: COLORS.slate, fontSize: 14, lineHeight: 1.8 }}>
              <div><strong style={{ color: COLORS.navy }}>แผนก:</strong> {department || "-"}</div>
              {!isTeacher && <div><strong style={{ color: COLORS.navy }}>ระดับชั้น:</strong> {level || "-"}</div>}
              {isTeacher && <div><strong style={{ color: COLORS.navy }}>วิชา:</strong> {user.subject || "-"}</div>}
            </div>
          </div>
        </Card>
      </div>
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
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [submissions, setSubmissions] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Load data from Supabase ──────────────────────────────────────────────
  const loadData = async () => {
    if (!supabase) return;
    const [annRes, exRes, subRes] = await Promise.all([
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("exercises").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("*").order("created_at", { ascending: false }),
    ]);
    if (annRes.data) setAnnouncements(annRes.data.map(dbToAnnouncement));
    if (exRes.data) setExercises(exRes.data.map(dbToExercise));
    if (subRes.data) setSubmissions(subRes.data.map(dbToSubmission));
  };

  // ── Auth session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadUserProfile(session.user);
        if (profile) { setUser(profile); await loadData(); }
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await loadUserProfile(session.user);
        if (profile) { setUser(profile); await loadData(); }
      } else if (event === "SIGNED_OUT") {
        setUser(null); setPage("dashboard"); setActiveExercise(null);
        setAnnouncements([]); setExercises([]); setSubmissions([]);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setActiveExercise(null); setPage("dashboard");
  };

  // ── Announcements CRUD ────────────────────────────────────────────────────
  const handleAddAnnouncement = async (ann) => {
    if (!supabase) return;
    const { data, error } = await supabase.from("announcements").insert([{
      author_id: ann.authorId, author_name: ann.author,
      subject: ann.subject, body: ann.body, pinned: ann.pinned,
    }]).select().single();
    if (!error && data) setAnnouncements(prev => [dbToAnnouncement(data), ...prev]);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!supabase) return;
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
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
      minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>🏫</div>
      <div style={{ color: COLORS.white, fontSize: 18, fontWeight: 600 }}>กำลังโหลด...</div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={u => { setUser(u); setPage("dashboard"); loadData(); }} />;

  const isTeacher = user.role === "teacher";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Sarabun', system-ui, sans-serif" }}>
      <Sidebar user={user} page={activeExercise ? "exercises" : page} setPage={p => { setPage(p); setActiveExercise(null); }}
        onLogout={handleLogout}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: "32px 28px", minHeight: "100vh" }}>
        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(true)} style={{
          display: "none", position: "fixed", top: 16, left: 16, zIndex: 80,
          background: COLORS.navy, border: "none", borderRadius: 10, padding: "8px 12px",
          color: COLORS.white, cursor: "pointer", fontSize: 20,
        }}>☰</button>

        {page === "dashboard" && !activeExercise && (
          <Dashboard user={user} announcements={announcements} exercises={exercises}
            submissions={submissions} messages={messages} setPage={setPage} />
        )}
        {page === "announcements" && !activeExercise && (
          <Announcements user={user} announcements={announcements}
            onAdd={handleAddAnnouncement} onDelete={handleDeleteAnnouncement} />
        )}
        {page === "messages" && !activeExercise && (
          <Messages user={user} messages={messages} setMessages={setMessages} />
        )}
        {page === "exercises" && !activeExercise && (
          <ExerciseList user={user} exercises={exercises}
            onAdd={handleAddExercise} onDelete={handleDeleteExercise}
            submissions={submissions}
            onOpenExercise={ex => setActiveExercise(ex)} />
        )}
        {page === "exercises" && activeExercise && (
          <ExerciseAttempt user={user} exercise={activeExercise}
            onSubmit={handleSubmitExercise}
            onBack={() => setActiveExercise(null)} />
        )}
        {page === "results" && isTeacher && (
          <Results user={user} exercises={exercises} submissions={submissions}
            onDeleteSubmission={handleDeleteSubmission} onDeleteExercise={handleDeleteExercise} />
        )}
        {page === "myscores" && !isTeacher && (
          <MyScores user={user} submissions={submissions} exercises={exercises} />
        )}
        {page === "settings" && !activeExercise && (
          <Settings user={user} onSave={setUser} />
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media (max-width: 700px) {
          main { margin-left: 0 !important; padding: 20px 14px !important; }
          button[aria-label="menu"] { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
