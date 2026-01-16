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
    const [acceptedBroker, setAcceptedBroker] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(USER_DATA_KEY);
        if (!stored) {
            setIsOpen(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Broker contact is now optional, only privacy is required
        if (formData.name && formData.email && formData.phone && acceptedPrivacy) {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify({
                ...formData,
                acceptedBroker // Store preference
            }));
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
                    {/* Brand Accent */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-[#121A54]" />

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
                                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#121A54]/20 focus:border-[#121A54] transition-all font-inter text-neutral-900"
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
                                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#121A54]/20 focus:border-[#121A54] transition-all font-inter text-neutral-900"
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
                                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#121A54]/20 focus:border-[#121A54] transition-all font-inter text-neutral-900"
                                placeholder="+39 333 1234567"
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            {/* Privacy Checkbox (REQUIRED) */}
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-neutral-200 transition-colors">
                                <div className="flex items-center h-5">
                                    <input
                                        required
                                        type="checkbox"
                                        id="privacy"
                                        checked={acceptedPrivacy}
                                        onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                        className="h-5 w-5 rounded border-neutral-300 text-[#121A54] focus:ring-[#121A54] cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="privacy" className="text-[11px] text-neutral-600 font-inter cursor-pointer leading-tight">
                                    {t.privacyAgreement}
                                </label>
                            </div>

                            {/* Broker Checkbox (OPTIONAL) */}
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#121A54]/5 border border-[#121A54]/10 hover:border-[#121A54]/20 transition-colors">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        id="broker"
                                        checked={acceptedBroker}
                                        onChange={(e) => setAcceptedBroker(e.target.checked)}
                                        className="h-5 w-5 rounded border-neutral-300 text-[#121A54] focus:ring-[#121A54] cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="broker" className="text-[11px] text-[#121A54] font-semibold font-inter cursor-pointer leading-tight">
                                    {t.brokerAgreement}
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!acceptedPrivacy}
                            className={`w-full py-4 rounded-2xl font-bold font-apfel text-white shadow-xl transition-all duration-300 mt-2 ${acceptedPrivacy
                                    ? 'bg-[#121A54] hover:bg-[#1a2575] hover:scale-[1.02] active:scale-95 shadow-[#121A54]/30'
                                    : 'bg-neutral-200 cursor-not-allowed text-neutral-400 shadow-none'
                                }`}
                        >
                            {t.submitButton}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
