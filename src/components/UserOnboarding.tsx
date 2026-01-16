"use client";

import { useState, useEffect } from "react";
import { X, Mail, User, Phone, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface UserData {
    name: string;
    email: string;
    phone: string;
}

export const USER_DATA_KEY = 'batoo_user_data';

export function UserOnboarding({ onComplete }: { onComplete?: (data: UserData) => void }) {
    const t = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        // Check if user data exists
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(USER_DATA_KEY);
            if (!stored) {
                // Delay slightly for smooth entrance
                setTimeout(() => setIsOpen(true), 1500);
            } else {
                if (onComplete) onComplete(JSON.parse(stored));
            }
        }
    }, [onComplete]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: UserData = { name, email, phone };
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));

        setSubmitted(true);
        setTimeout(() => {
            setIsOpen(false);
            if (onComplete) onComplete(data);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">

                {/* Decorative Background */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-brand-secondary to-brand-primary opacity-10" />

                {/* Content */}
                <div className="relative z-10">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-primary">
                            <User size={32} />
                        </div>
                        <h2 className="text-2xl font-apfel font-bold text-brand-dark mb-2">{t.onboardingTitle}</h2>
                        <p className="text-neutral-500 font-inter text-sm">
                            {t.onboardingSubtitle}
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={t.placeholderName}
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-inter"
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input
                                    type="email"
                                    placeholder={t.placeholderEmail}
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-inter"
                                />
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input
                                    type="tel"
                                    placeholder={t.placeholderPhone}
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-inter"
                                />
                            </div>

                            <div className="flex items-start gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="privacy"
                                    required
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                />
                                <label htmlFor="privacy" className="text-xs text-neutral-500 text-left leading-tight">
                                    {t.dataPrivacy} <span className="underline cursor-pointer">Privacy Policy</span>.
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 mt-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t.submitButton}
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                <Check size={40} strokeWidth={3} />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-800">{t.successTitle}</h3>
                            <p className="text-neutral-500">{t.successSubtitle}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
