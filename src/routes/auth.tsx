import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { isValidIranMobile, sendOTP, verifyOTP } from "@/services/sms";
import { ADMIN_PASSWORD, ADMIN_PHONE, isPhoneBlocked, upsertUser } from "@/lib/admin-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "ورود / ثبت‌نام | پارس گلس" },
      { name: "description", content: "ورود یا ثبت‌نام در پارس گلس با شماره موبایل." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? (s.redirect as string) : undefined,
  }),
  component: AuthPage,
});

type Step = "phone" | "adminpass" | "otp" | "profile";

type StoredUser = {
  phone: string;
  name: string;
  family: string;
  role: "admin" | "partner";
  createdAt: string;
};

const USER_KEY = "parsglass_user";
const CART_KEY = "parsglass_cart_v1";
const GUEST_CART_KEY = "parsglass_cart_guest_v1";

function getUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

function mergeGuestCart() {
  try {
    const guest = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    const cur = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(guest) || guest.length === 0) return;
    const merged = [...cur];
    for (const g of guest) {
      const idx = merged.findIndex(
        (x: { productId: string; modelName: string }) =>
          x.productId === g.productId && x.modelName === g.modelName,
      );
      if (idx >= 0) merged[idx] = { ...merged[idx], qty: g.qty };
      else merged.push(g);
    }
    localStorage.setItem(CART_KEY, JSON.stringify(merged));
    localStorage.removeItem(GUEST_CART_KEY);
    window.dispatchEvent(new Event("cart-updated"));
  } catch {
    /* ignore */
  }
}

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const redirectTo = search.redirect;
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in and redirect=cart, go straight to /cart
  useEffect(() => {
    if (redirectTo === "cart") {
      const u = getUser();
      if (u) navigate({ to: "/cart" });
    }
  }, [redirectTo, navigate]);

  function finishLogin(user: StoredUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.role !== "admin") {
      upsertUser({
        phone: user.phone,
        name: user.name,
        family: user.family,
        joinedAt: user.createdAt,
      });
    }
    mergeGuestCart();
    if (redirectTo === "cart") {
      navigate({ to: "/cart" });
      return;
    }
    if (user.role === "admin") {
      navigate({ to: "/admin" as any });
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidIranMobile(phone)) {
      setError("شماره موبایل معتبر نیست (مثال: 09121234567)");
      return;
    }
    if (isPhoneBlocked(phone)) {
      setError("این شماره مسدود شده است");
      return;
    }
    if (phone === ADMIN_PHONE) {
      setStep("adminpass");
      return;
    }
    setLoading(true);
    const res = await sendOTP(phone);
    setLoading(false);
    if (res.success) setStep("otp");
    else setError(res.message || "خطا در ارسال کد");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {redirectTo === "cart" && (
        <div
          dir="rtl"
          className="mb-4 w-full max-w-md rounded-xl border border-yellow-400/40 bg-yellow-400/15 px-4 py-3 text-center text-sm font-bold text-yellow-200"
        >
          ⚠️ برای تکمیل سفارش، ابتدا وارد حساب کاربری خود شوید
        </div>
      )}
      <div className="w-full max-w-md rounded-3xl glass-strong border border-white/10 p-6 md:p-8 shadow-2xl shadow-primary/10">
        {step === "phone" && (
          <PhoneStep
            phone={phone}
            setPhone={setPhone}
            onSubmit={handleSendOtp}
            loading={loading}
            error={error}
          />
        )}
        {step === "adminpass" && (
          <AdminPassStep
            phone={phone}
            onBack={() => setStep("phone")}
            onOk={() =>
              finishLogin({
                phone,
                name: "مدیر",
                family: "سیستم",
                role: "admin",
                createdAt: new Date().toISOString(),
              })
            }
          />
        )}
        {step === "otp" && (
          <OtpStep
            phone={phone}
            onBack={() => setStep("phone")}
            onVerified={(isNew) => {
              if (phone === "09120000000") {
                finishLogin({
                  phone,
                  name: "مدیر",
                  family: "سیستم",
                  role: "admin",
                  createdAt: new Date().toISOString(),
                });
                return;
              }
              const existing = getUser();
              if (existing && existing.phone === phone && !isNew) {
                finishLogin(existing);
              } else {
                setStep("profile");
              }
            }}
          />
        )}
        {step === "profile" && (
          <ProfileStep
            onSubmit={(name, family) => {
              finishLogin({
                phone,
                name,
                family,
                role: "partner",
                createdAt: new Date().toISOString(),
              });
            }}
          />
        )}
      </div>
    </div>
  );
}

function PhoneStep({
  phone,
  setPhone,
  onSubmit,
  loading,
  error,
}: {
  phone: string;
  setPhone: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">ورود / ثبت‌نام</h1>
        <p className="mt-2 text-sm text-foreground/70">
          شماره موبایل خود را وارد کنید
        </p>
      </div>
      <div>
        <input
          type="tel"
          inputMode="numeric"
          dir="ltr"
          maxLength={11}
          placeholder="09xxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center text-lg tracking-widest font-mono focus:outline-none focus:border-primary"
        />
        {error && <p className="mt-2 text-xs text-destructive text-center">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl btn-primary-gradient py-3 text-base font-bold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "در حال ارسال..." : "ارسال کد"}
      </button>
    </form>
  );
}

function OtpStep({
  phone,
  onBack,
  onVerified,
}: {
  phone: string;
  onBack: () => void;
  onVerified: (isNewUser: boolean) => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [seconds, setSeconds] = useState(120);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  function setDigit(i: number, v: string) {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 3) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 4) {
      setError("کد ۴ رقمی را کامل وارد کنید");
      return;
    }
    setVerifying(true);
    setError(null);
    const res = await verifyOTP(phone, code);
    setVerifying(false);
    if (!res.success) {
      setError(res.message || "کد نامعتبر است");
      return;
    }
    const existing = (() => {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();
    const isNew = !existing || existing.phone !== phone;
    onVerified(isNew);
  }

  async function handleResend() {
    setSeconds(120);
    setDigits(["", "", "", ""]);
    setError(null);
    await sendOTP(phone);
    refs.current[0]?.focus();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">کد تایید</h1>
        <p className="mt-2 text-sm text-foreground/70">
          کد ۴ رقمی ارسال شده به <span className="font-mono" dir="ltr">{phone}</span> را وارد کنید
        </p>
      </div>
      <div className="flex justify-center gap-3" dir="ltr">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            className="h-14 w-12 rounded-xl bg-white/5 border border-white/10 text-center text-xl font-bold focus:outline-none focus:border-primary"
          />
        ))}
      </div>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
      <div className="flex items-center justify-between text-xs text-foreground/70">
        <button
          type="button"
          onClick={handleResend}
          disabled={seconds > 0}
          className="text-primary disabled:text-foreground/40 disabled:cursor-not-allowed"
        >
          ارسال مجدد
        </button>
        <span className="font-mono" dir="ltr">
          {mm}:{ss}
        </span>
      </div>
      <button
        type="submit"
        disabled={verifying}
        className="w-full rounded-xl btn-primary-gradient py-3 text-base font-bold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
      >
        {verifying ? "در حال بررسی..." : "تایید"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-xs text-foreground/60 hover:text-foreground"
      >
        تغییر شماره موبایل
      </button>
    </form>
  );
}

function ProfileStep({
  onSubmit,
}: {
  onSubmit: (name: string, family: string) => void;
}) {
  const [name, setName] = useState("");
  const [family, setFamily] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !family.trim()) {
      setError("نام و نام خانوادگی الزامی است");
      return;
    }
    onSubmit(name.trim(), family.trim());
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">تکمیل پروفایل</h1>
        <p className="mt-2 text-sm text-foreground/70">
          برای ادامه اطلاعات خود را وارد کنید
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-foreground/70">نام</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/70">نام خانوادگی</label>
          <input
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 focus:outline-none focus:border-primary"
          />
        </div>
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>
      <button
        type="submit"
        className="w-full rounded-xl btn-primary-gradient py-3 text-base font-bold shadow-lg shadow-primary/30 hover:opacity-90"
      >
        ثبت و ورود
      </button>
    </form>
  );
}

function AdminPassStep({
  phone,
  onBack,
  onOk,
}: {
  phone: string;
  onBack: () => void;
  onOk: () => void;
}) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) onOk();
    else setErr("رمز عبور اشتباه است");
  }
  return (
    <form onSubmit={submit} dir="rtl" className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">ورود مدیر</h1>
        <p className="mt-2 text-sm text-foreground/70">
          رمز عبور را برای <span dir="ltr" className="font-mono">{phone}</span> وارد کنید
        </p>
      </div>
      <input
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        autoFocus
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center text-lg tracking-widest font-mono focus:outline-none focus:border-primary"
      />
      {err && <p className="text-xs text-destructive text-center">{err}</p>}
      <button
        type="submit"
        className="w-full rounded-xl btn-primary-gradient py-3 text-base font-bold shadow-lg shadow-primary/30 hover:opacity-90"
      >
        ورود
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-xs text-foreground/60 hover:text-foreground"
      >
        تغییر شماره
      </button>
    </form>
  );
}
