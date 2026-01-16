"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

export const USER_DATA_KEY = 'batoo_user_onboarding';

export function UserOnboarding() {
    const t = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(USER_DATA_KEY);
        if (!stored) {
            setIsOpen(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.email && formData.phone && acceptedPrivacy) {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(formData));
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl overflow-hidden relative"
                >
                    {/* Brand Accents */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-primary to-sky-400" />

                    <div className="flex flex-col items-center text-center mb-8">
                        <img src="/batoo-logo-dark.svg" alt="Batoo Logo" className="h-8 mb-6" />
                        <h2 className="text-2xl font-bold font-apfel text-neutral-900 mb-2">
                            {t.onboardingTitle}
                        </h2>
                        <p className="text-neutral-500 text-sm font-inter">
                            {t.onboardingSubtitle}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1 ml-2">
                                {t.nameLabel}
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-inter"
                                placeholder="Mario Rossi"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1 ml-2">
                                {t.emailLabel}
                            </label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-inter"
                                placeholder="mario@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1 ml-2">
                                {t.phoneLabel}
                            </label>
                            <input
                                required
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-inter"
                                placeholder="+39 333 1234567"
                            />
                        </div>

                        <div className="flex items-start gap-3 pt-2 mb-2 px-2">
                            <input
                                required
                                type="checkbox"
                                id="privacy"
                                checked={acceptedPrivacy}
                                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                            />
                            <label htmlFor="privacy" className="text-[11px] text-neutral-500 font-inter cursor-pointer leading-relaxed">
                                {t.privacyLabel}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={!acceptedPrivacy}
                            className={`w-full py-4 rounded-2xl font-bold font-apfel text-white shadow-xl transition-all ${acceptedPrivacy ? 'bg-brand-primary hover:scale-[1.02] active:scale-95' : 'bg-neutral-300'}`}
                        >
                            {t.submitButton}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
