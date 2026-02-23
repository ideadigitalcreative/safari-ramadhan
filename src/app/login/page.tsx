"use client";

import { useSearchParams } from "next/navigation";
import { login } from "@/app/auth/actions";
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const [pending, setPending] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-indigo-50">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)]"></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-3xl shadow-xl shadow-primary-200 flex items-center justify-center mx-auto mb-6 transform hover:rotate-6 transition-transform">
                        <LogIn className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-dark-900 tracking-tight">
                        Selamat <span className="gradient-text">Datang</span>
                    </h1>
                    <p className="text-dark-500 mt-2">Silakan masuk ke panel manajemen SR</p>
                </div>

                <div className="glass-card-static p-8 shadow-2xl shadow-primary-100/50 border-white/50">
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <form action={async (formData) => {
                        setPending(true);
                        await login(formData);
                        setPending(false);
                    }} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-dark-700 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@example.com"
                                    className="form-input pl-12 h-13 shadow-sm placeholder:text-dark-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-dark-700 ml-1">Katasandi</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="form-input pl-12 h-13 shadow-sm placeholder:text-dark-300"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={pending}
                                className="btn-primary w-full h-13 justify-center text-base font-bold shadow-lg shadow-primary-200 disabled:opacity-70 disabled:cursor-not-allowed group transition-all"
                            >
                                {pending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Masuk Sekarang
                                        <LogIn className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-dark-100 text-center text-xs text-dark-400">
                        &copy; 2026 Management-SR. Palu, Sulawesi Tengah.
                    </div>
                </div>
            </div>
        </div>
    );
}
