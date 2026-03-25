import { useEffect, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    IconMail,
    IconLock,
    IconEye,
    IconEyeOff,
    IconLoader2,
    IconArrowRight,
} from "@tabler/icons-react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        return () => reset("password");
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"));
    };

    return (
        <>
            <Head title="Masuk — Harumnya" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                :root {
                    --teal:       #56B8C3;
                    --teal-deep:  #3A9DAA;
                    --teal-dark:  #1A6B77;
                    --teal-light: #82CDD6;
                    --teal-pale:  #B8E8ED;
                    --teal-ghost: #E4F6F8;
                    --teal-ultra: #F0FAFB;
                    --text:       #0D2B30;
                    --muted:      #5A8A90;
                    --border:     #D5EFF1;
                    --white:      #FFFFFF;
                }

                body { font-family: 'Plus Jakarta Sans', sans-serif; }

                .lg-root {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #F8FCFD;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                }

                /* Subtle background pattern */
                .lg-root::before {
                    content: '';
                    position: absolute; inset: 0;
                    background-image:
                        radial-gradient(circle at 20% 20%, rgba(86,184,195,0.08) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(58,157,170,0.06) 0%, transparent 50%);
                    pointer-events: none;
                }

                /* Card */
                .lg-card {
                    position: relative; z-index: 1;
                    width: 100%; max-width: 420px;
                    background: var(--white);
                    border-radius: 20px;
                    border: 1px solid var(--border);
                    box-shadow:
                        0 1px 2px rgba(13,43,48,0.04),
                        0 8px 32px rgba(13,43,48,0.07),
                        0 0 0 1px rgba(86,184,195,0.06);
                    overflow: hidden;
                    animation: cardIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
                }
                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Top accent stripe */
                .lg-stripe {
                    height: 3px;
                    background: linear-gradient(90deg, #1A6B77, #56B8C3, #82CDD6);
                }

                /* Card body */
                .lg-body { padding: 40px 40px 36px; }

                /* Brand */
                .lg-brand {
                    display: flex; align-items: center; gap: 12px;
                    margin-bottom: 36px;
                }
                .lg-logo {
                    width: 44px; height: 44px; border-radius: 12px;
                    overflow: hidden; flex-shrink: 0;
                    border: 1.5px solid rgba(86,184,195,0.25);
                    box-shadow: 0 2px 10px rgba(86,184,195,0.15);
                }
                .lg-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .lg-brand-name {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px; font-weight: 700;
                    color: var(--text); letter-spacing: -0.3px; line-height: 1;
                }
                .lg-brand-sub {
                    font-size: 9px; font-weight: 700;
                    letter-spacing: 1.8px; text-transform: uppercase;
                    color: var(--teal); margin-top: 3px;
                }

                /* Heading */
                .lg-heading { margin-bottom: 28px; }
                .lg-title {
                    font-size: 20px; font-weight: 700;
                    color: var(--text); margin-bottom: 4px; letter-spacing: -0.3px;
                }
                .lg-subtitle {
                    font-size: 13px; color: var(--muted);
                    font-weight: 400; line-height: 1.5;
                }

                /* Status */
                .lg-status {
                    display: flex; align-items: center; gap: 8px;
                    padding: 11px 14px; border-radius: 10px; margin-bottom: 20px;
                    background: var(--teal-ultra);
                    border: 1px solid rgba(86,184,195,0.25);
                    color: var(--teal-deep); font-size: 13px;
                }
                .lg-status-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: var(--teal); flex-shrink: 0;
                }

                /* Fields */
                .lg-field { margin-bottom: 16px; }
                .lg-label {
                    display: block; margin-bottom: 7px;
                    font-size: 11.5px; font-weight: 600;
                    color: var(--text); letter-spacing: 0.2px;
                }
                .lg-input-wrap { position: relative; }
                .lg-input-icon {
                    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
                    color: #B8D8DC; pointer-events: none; display: flex;
                    transition: color 0.2s;
                }
                .lg-input-wrap:focus-within .lg-input-icon { color: var(--teal); }
                .lg-input {
                    width: 100%; height: 48px;
                    padding: 0 44px 0 44px;
                    background: #FAFEFE;
                    border: 1.5px solid var(--border);
                    border-radius: 11px;
                    color: var(--text);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 14px; outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }
                .lg-input::placeholder { color: #B8CACF; }
                .lg-input:focus {
                    background: var(--white);
                    border-color: var(--teal);
                    box-shadow: 0 0 0 3px rgba(86,184,195,0.1);
                }
                .lg-input.err { border-color: #F87171; background: #FFF8F8; }
                .lg-eye {
                    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
                    background: none; border: none; cursor: pointer; padding: 6px;
                    border-radius: 7px; color: #B8D8DC;
                    display: flex; transition: color 0.2s, background 0.2s;
                }
                .lg-eye:hover { color: var(--teal); background: rgba(86,184,195,0.08); }
                .lg-error {
                    font-size: 11.5px; color: #EF4444;
                    margin-top: 5px; display: flex; align-items: center; gap: 4px;
                }

                /* Remember + forgot */
                .lg-options {
                    display: flex; align-items: center; justify-content: space-between;
                    margin: 18px 0 22px;
                }
                .lg-remember { display: flex; align-items: center; gap: 8px; cursor: pointer; }
                .lg-checkbox {
                    width: 18px; height: 18px; border-radius: 5px;
                    border: 1.5px solid var(--border);
                    background: #FAFEFE;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.15s; flex-shrink: 0; position: relative;
                }
                .lg-checkbox input {
                    position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; margin: 0;
                }
                .lg-checkbox:has(input:checked) {
                    background: var(--teal); border-color: var(--teal);
                }
                .lg-check-mark {
                    width: 9px; height: 9px;
                    border-bottom: 2px solid white; border-right: 2px solid white;
                    transform: rotate(45deg) translateY(-1px);
                    opacity: 0; transition: opacity 0.15s; pointer-events: none;
                }
                .lg-checkbox:has(input:checked) .lg-check-mark { opacity: 1; }
                .lg-remember-label { font-size: 13px; color: var(--muted); }
                .lg-forgot {
                    font-size: 13px; font-weight: 600;
                    color: var(--teal-deep); text-decoration: none;
                    transition: color 0.2s;
                }
                .lg-forgot:hover { color: var(--teal); }

                /* Submit */
                .lg-submit {
                    width: 100%; height: 48px;
                    border: none; border-radius: 12px; cursor: pointer;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 14px; font-weight: 700; letter-spacing: 0.1px;
                    color: white;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    background: linear-gradient(105deg, #1A6B77 0%, #3A9DAA 40%, #56B8C3 100%);
                    box-shadow: 0 4px 16px rgba(86,184,195,0.35);
                    transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
                }
                .lg-submit:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(86,184,195,0.45);
                    filter: brightness(1.05);
                }
                .lg-submit:active:not(:disabled) {
                    transform: translateY(0);
                    box-shadow: 0 2px 8px rgba(86,184,195,0.3);
                }
                .lg-submit:disabled { opacity: 0.6; cursor: not-allowed; }
                .lg-arrow { transition: transform 0.25s; }
                .lg-submit:hover .lg-arrow { transform: translateX(4px); }

                @keyframes spin { to { transform: rotate(360deg); } }
                .lg-spin { animation: spin 0.7s linear infinite; }

                /* Divider */
                .lg-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 24px 0 0;
                }
                .lg-divider-line { flex: 1; height: 1px; background: #EEF7F8; }
                .lg-divider-text { font-size: 11px; color: #B8CACF; font-weight: 600; letter-spacing: 0.8px; }

                /* Footer */
                .lg-footer {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 16px 40px;
                    border-top: 1px solid #EEF7F8;
                    background: #FAFEFE;
                }
                .lg-footer-copy { font-size: 11px; color: #B8CACF; }
                .lg-footer-ver {
                    font-size: 10.5px; font-weight: 700;
                    padding: 3px 10px; border-radius: 100px;
                    background: var(--teal-ghost); color: var(--teal-deep);
                    border: 1px solid rgba(86,184,195,0.2);
                }

                @media (max-width: 480px) {
                    .lg-body { padding: 28px 24px 24px; }
                    .lg-footer { padding: 14px 24px; }
                }
            `}</style>

            <div className="lg-root">
                <div className="lg-card">
                    <div className="lg-stripe" />

                    <div className="lg-body">

                        {/* Brand */}
                        <div className="lg-brand">
                            <div className="lg-logo">
                                <img src="/Logo.png" alt="Harumnya" />
                            </div>
                            <div>
                                <div className="lg-brand-name">Harumnya</div>
                                <div className="lg-brand-sub">Parfum · POS System</div>
                            </div>
                        </div>

                        {/* Heading */}
                        <div className="lg-heading">
                            <h1 className="lg-title">Masuk ke Dashboard</h1>
                            <p className="lg-subtitle">Gunakan akun yang sudah didaftarkan oleh admin</p>
                        </div>

                        {/* Status */}
                        {status && (
                            <div className="lg-status">
                                <div className="lg-status-dot" />
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>

                            {/* Email */}
                            <div className="lg-field">
                                <label className="lg-label">Email</label>
                                <div className="lg-input-wrap">
                                    <span className="lg-input-icon"><IconMail size={16} /></span>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                        placeholder="nama@harumnya.com"
                                        className={`lg-input${errors.email ? " err" : ""}`}
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                                {errors.email && (
                                    <div className="lg-error">
                                        <span>·</span> {errors.email}
                                    </div>
                                )}
                            </div>

                            {/* Password */}
                            <div className="lg-field">
                                <label className="lg-label">Password</label>
                                <div className="lg-input-wrap">
                                    <span className="lg-input-icon"><IconLock size={16} /></span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        placeholder="••••••••••"
                                        className={`lg-input${errors.password ? " err" : ""}`}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="lg-eye"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="lg-error">
                                        <span>·</span> {errors.password}
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={processing} className="lg-submit">
                                {processing ? (
                                    <>
                                        <IconLoader2 size={18} className="lg-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Masuk</span>
                                        <span className="lg-arrow"><IconArrowRight size={17} /></span>
                                    </>
                                )}
                            </button>
                        </form>

                    </div>

                    {/* Footer */}
                    <div className="lg-footer">
                        <span className="lg-footer-copy">© 2026 Harumnya Parfum</span>
                        <span className="lg-footer-ver">v1.0</span>
                    </div>
                </div>
            </div>
        </>
    );
}
