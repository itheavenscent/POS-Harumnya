import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    IconShieldLock,
    IconLoader2,
    IconArrowRight,
    IconArrowLeft,
    IconRefresh,
    IconClock,
} from "@tabler/icons-react";

const LEN = 6;

export default function VerifyOtp({ email, expiresAt, ttlSeconds = 60, status }) {
    const { data, setData, post, processing, errors, reset } = useForm({ code: "" });
    const [resending, setResending] = useState(false);
    const inputsRef = useRef([]);

    // ── Countdown berdasarkan expiresAt dari server ──
    const targetTs = useMemo(
        () => (expiresAt ? new Date(expiresAt).getTime() : Date.now() + ttlSeconds * 1000),
        [expiresAt, ttlSeconds]
    );
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const timeLeft = Math.max(0, Math.ceil((targetTs - now) / 1000));
    const expired = timeLeft <= 0;

    const digits = data.code.padEnd(LEN, " ").slice(0, LEN).split("");

    const setDigit = (i, val) => {
        const clean = val.replace(/\D/g, "").slice(-1);
        const arr = data.code.padEnd(LEN, " ").slice(0, LEN).split("");
        arr[i] = clean || " ";
        setData("code", arr.join("").replace(/\s/g, ""));
        if (clean && i < LEN - 1) inputsRef.current[i + 1]?.focus();
    };

    const onKeyDown = (i, e) => {
        if (e.key === "Backspace" && !digits[i].trim() && i > 0) {
            inputsRef.current[i - 1]?.focus();
        }
    };

    const onPaste = (e) => {
        e.preventDefault();
        const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, LEN);
        if (text) {
            setData("code", text);
            inputsRef.current[Math.min(text.length, LEN - 1)]?.focus();
        }
    };

    const submit = (e) => {
        e?.preventDefault();
        post(route("otp.verify"));
    };

    // Auto-submit saat 6 digit terisi
    useEffect(() => {
        if (data.code.length === LEN && !processing) submit();
    }, [data.code]);

    const resend = () => {
        setResending(true);
        router.post(
            route("otp.resend"),
            {},
            {
                preserveState: true,
                onFinish: () => setResending(false),
                onSuccess: () => reset("code"),
            }
        );
    };

    const mmss = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;

    return (
        <>
            <Head title="Verifikasi OTP — Harumnya" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                :root {
                    --teal:#56B8C3; --teal-deep:#3A9DAA; --teal-dark:#1A6B77;
                    --teal-ghost:#E4F6F8; --teal-ultra:#F0FAFB;
                    --text:#0D2B30; --muted:#5A8A90; --border:#D5EFF1; --white:#FFFFFF;
                }
                body { font-family:'Plus Jakarta Sans',sans-serif; }
                .lg-root { min-height:100vh; display:flex; align-items:center; justify-content:center;
                    background:#F8FCFD; padding:24px; position:relative; overflow:hidden; }
                .lg-root::before { content:''; position:absolute; inset:0;
                    background-image:radial-gradient(circle at 20% 20%,rgba(86,184,195,0.08) 0%,transparent 50%),
                        radial-gradient(circle at 80% 80%,rgba(58,157,170,0.06) 0%,transparent 50%); pointer-events:none; }
                .lg-card { position:relative; z-index:1; width:100%; max-width:420px; background:var(--white);
                    border-radius:20px; border:1px solid var(--border);
                    box-shadow:0 1px 2px rgba(13,43,48,0.04),0 8px 32px rgba(13,43,48,0.07),0 0 0 1px rgba(86,184,195,0.06);
                    overflow:hidden; animation:cardIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }
                @keyframes cardIn { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
                .lg-stripe { height:3px; background:linear-gradient(90deg,#1A6B77,#56B8C3,#82CDD6); }
                .lg-body { padding:40px 40px 36px; }
                .lg-iconwrap { width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center;
                    background:var(--teal-ultra); border:1px solid rgba(86,184,195,0.25); color:var(--teal-deep); margin-bottom:20px; }
                .lg-title { font-size:20px; font-weight:700; color:var(--text); margin-bottom:6px; letter-spacing:-0.3px; }
                .lg-subtitle { font-size:13px; color:var(--muted); line-height:1.5; margin-bottom:24px; }
                .lg-subtitle b { color:var(--text); }
                .lg-status { display:flex; align-items:center; gap:8px; padding:11px 14px; border-radius:10px; margin-bottom:20px;
                    background:var(--teal-ultra); border:1px solid rgba(86,184,195,0.25); color:var(--teal-deep); font-size:13px; }
                .lg-status-dot { width:6px; height:6px; border-radius:50%; background:var(--teal); flex-shrink:0; }
                .otp-row { display:flex; gap:10px; justify-content:space-between; margin-bottom:8px; }
                .otp-box { width:100%; height:56px; text-align:center; font-size:22px; font-weight:700; color:var(--text);
                    background:#FAFEFE; border:1.5px solid var(--border); border-radius:12px; outline:none;
                    font-family:'Plus Jakarta Sans',sans-serif; transition:border-color .2s,box-shadow .2s,background .2s; }
                .otp-box:focus { background:var(--white); border-color:var(--teal); box-shadow:0 0 0 3px rgba(86,184,195,0.12); }
                .otp-box.err { border-color:#F87171; background:#FFF8F8; }
                .lg-error { font-size:11.5px; color:#EF4444; margin-top:8px; display:flex; align-items:center; gap:4px; }
                .lg-timer { display:flex; align-items:center; justify-content:center; gap:6px; margin:18px 0;
                    font-size:13px; font-weight:600; color:var(--teal-deep); }
                .lg-timer.expired { color:#EF4444; }
                .lg-submit { width:100%; height:48px; border:none; border-radius:12px; cursor:pointer;
                    font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:700; color:white;
                    display:flex; align-items:center; justify-content:center; gap:8px;
                    background:linear-gradient(105deg,#1A6B77 0%,#3A9DAA 40%,#56B8C3 100%);
                    box-shadow:0 4px 16px rgba(86,184,195,0.35); transition:all .25s cubic-bezier(0.16,1,0.3,1); }
                .lg-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(86,184,195,0.45); filter:brightness(1.05); }
                .lg-submit:disabled { opacity:0.6; cursor:not-allowed; }
                @keyframes spin { to{transform:rotate(360deg);} }
                .lg-spin { animation:spin .7s linear infinite; }
                .lg-actions { display:flex; align-items:center; justify-content:space-between; margin-top:22px; }
                .lg-link { font-size:13px; font-weight:600; color:var(--muted); text-decoration:none;
                    display:inline-flex; align-items:center; gap:5px; transition:color .2s; background:none; border:none; cursor:pointer; }
                .lg-link:hover { color:var(--teal-deep); }
                .lg-link:disabled { opacity:0.45; cursor:not-allowed; }
                .lg-footer { display:flex; align-items:center; justify-content:space-between; padding:16px 40px;
                    border-top:1px solid #EEF7F8; background:#FAFEFE; }
                .lg-footer-copy { font-size:11px; color:#B8CACF; }
                .lg-footer-ver { font-size:10.5px; font-weight:700; padding:3px 10px; border-radius:100px;
                    background:var(--teal-ghost); color:var(--teal-deep); border:1px solid rgba(86,184,195,0.2); }
                @media (max-width:480px){ .lg-body{padding:28px 24px 24px;} .lg-footer{padding:14px 24px;} .otp-box{height:50px;font-size:19px;} .otp-row{gap:7px;} }
            `}</style>

            <div className="lg-root">
                <div className="lg-card">
                    <div className="lg-stripe" />

                    <div className="lg-body">
                        <div className="lg-iconwrap"><IconShieldLock size={26} /></div>

                        <h1 className="lg-title">Verifikasi OTP</h1>
                        <p className="lg-subtitle">
                            Kami mengirim 6 digit kode ke <b>{email}</b>. Masukkan kode untuk melanjutkan.
                        </p>

                        {status && (
                            <div className="lg-status">
                                <div className="lg-status-dot" />
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="otp-row" onPaste={onPaste}>
                                {Array.from({ length: LEN }).map((_, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (inputsRef.current[i] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digits[i].trim()}
                                        onChange={(e) => setDigit(i, e.target.value)}
                                        onKeyDown={(e) => onKeyDown(i, e)}
                                        className={`otp-box${errors.code ? " err" : ""}`}
                                        autoFocus={i === 0}
                                        disabled={expired || processing}
                                    />
                                ))}
                            </div>

                            {errors.code && (
                                <div className="lg-error"><span>·</span> {errors.code}</div>
                            )}

                            <div className={`lg-timer${expired ? " expired" : ""}`}>
                                <IconClock size={15} />
                                {expired ? "Kode kadaluarsa — kirim ulang" : `Berlaku ${mmss}`}
                            </div>

                            <button type="submit" disabled={processing || expired || data.code.length < LEN} className="lg-submit">
                                {processing ? (
                                    <><IconLoader2 size={18} className="lg-spin" /> <span>Memverifikasi...</span></>
                                ) : (
                                    <><span>Verifikasi</span> <IconArrowRight size={17} /></>
                                )}
                            </button>
                        </form>

                        <div className="lg-actions">
                            <Link href={route("login")} className="lg-link">
                                <IconArrowLeft size={15} /> Kembali
                            </Link>
                            <button
                                type="button"
                                className="lg-link"
                                onClick={resend}
                                disabled={resending || !expired}
                            >
                                {resending
                                    ? <><IconLoader2 size={15} className="lg-spin" /> Mengirim...</>
                                    : <><IconRefresh size={15} /> Kirim ulang</>
                                }
                            </button>
                        </div>
                    </div>

                    <div className="lg-footer">
                        <span className="lg-footer-copy">© 2026 Harumnya Parfum</span>
                        <span className="lg-footer-ver">v1.0</span>
                    </div>
                </div>
            </div>
        </>
    );
}
