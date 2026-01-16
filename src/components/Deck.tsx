"use client";

import { useState, useEffect } from "react";
import { Boat } from "@/lib/types";
import { BoatCard } from "./BoatCard";
import { getBoats, contactBroker } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, Loader2 } from "lucide-react";
import { recordSwipe, resetAnalytics, getAnalytics } from "@/lib/analytics";
import { UserOnboarding, USER_DATA_KEY } from "./UserOnboarding";
import { useLanguage } from "@/lib/i18n";

interface DeckProps {
    initialBoats: Boat[];
}

export function Deck({ initialBoats }: DeckProps) {
    const t = useLanguage();
    const [boats, setBoats] = useState<Boat[]>(initialBoats);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [lastDirection, setLastDirection] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [seenBoatIds] = useState<Set<string>>(new Set(initialBoats.map(b => b.BoatID)));

    // Daily Limit State
    const [dailyLikes, setDailyLikes] = useState(0);
    const [limitReached, setLimitReached] = useState(false);
    const DAILY_LIMIT = 10;

    // Check Daily Limit on Mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().split('T')[0];
            const stored = localStorage.getItem('batoo_daily_likes');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.date === today) {
                    setDailyLikes(data.count);
                    if (data.count >= DAILY_LIMIT) setLimitReached(true);
                } else {
                    // Reset for new day
                    localStorage.setItem('batoo_daily_likes', JSON.stringify({ date: today, count: 0 }));
                    setDailyLikes(0);
                }
            }
        }
    }, []);

    // ... (rest of loading effect) ...
    // Fetch more boats logic
    useEffect(() => {
        const remaining = boats.length - currentIndex;

        if (remaining < 5 && !loading && hasMore) {
            setLoading(true);
            const nextPage = page + 1;
            console.log(`Loading more boats (Page ${nextPage})...`);

            getBoats(nextPage, 50).then((newBoats) => {
                if (newBoats && newBoats.length > 0) {
                    // Filter duplicates
                    const uniqueBoats = newBoats.filter(boat => {
                        if (seenBoatIds.has(boat.BoatID)) return false;
                        seenBoatIds.add(boat.BoatID);
                        return true;
                    });

                    if (uniqueBoats.length > 0) {
                        setBoats(prev => [...prev, ...uniqueBoats]);
                    }
                    setPage(nextPage);
                } else {
                    console.log('No more boats available.');
                    setHasMore(false);
                }
                setLoading(false);
            }).catch((err) => {
                console.error("Error loading boats:", err);
                setLoading(false);
            });
        }
    }, [currentIndex, boats.length, loading, page, hasMore, seenBoatIds]);

    const handleSwipe = (direction: "left" | "right") => {

        // CHECK LIMIT
        if (direction === 'right') {
            if (dailyLikes >= DAILY_LIMIT) {
                setLimitReached(true);
                return; // Block swipe
            }
        }

        setLastDirection(direction);
        const currentBoat = boats[currentIndex];

        if (!currentBoat) return;

        // Record for future smart algorithm
        recordSwipe(currentBoat, direction);

        if (direction === "right") {
            // Update Limit
            const newCount = dailyLikes + 1;
            setDailyLikes(newCount);
            if (typeof window !== 'undefined') {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('batoo_daily_likes', JSON.stringify({ date: today, count: newCount }));
            }
            if (newCount >= DAILY_LIMIT) {
                setLimitReached(true);
                // Don't return here, let the animation finish for this last swipe
            }

            // === AUTO-EMAIL LOGIC ===
            let userData = null;
            if (typeof window !== 'undefined') {
                try {
                    const stored = localStorage.getItem(USER_DATA_KEY);
                    if (stored) userData = JSON.parse(stored);
                } catch (e) { console.error("Error reading user data", e); }
            }

            if (userData) {
                const brokerEmail = currentBoat.AgencyEmail || 'info@batoo.it';
                console.log(`📨 [MOCK EMAIL] To: ${brokerEmail}`);
                console.log(`Subject: New Lead for ${currentBoat.Builder} ${currentBoat.Model}`);
                console.log(`Body: User ${userData.name} (${userData.email}, ${userData.phone}) is interested in this boat.`);

                // Trigger API call here
                contactBroker(currentBoat, userData);
            } else {
                console.warn("⚠️ User liked a boat but no contact info found (Onboarding skipped?)");
            }
        }

        // Advance
        setCurrentIndex(prev => prev + 1);
    };

    const currentBoat = boats[currentIndex];
    const nextBoat = boats[currentIndex + 1];

    if (!currentBoat) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-neutral-50 p-4">
                <Loader2 className="animate-spin text-brand-primary mb-4" size={48} />
                <p className="font-apfel text-xl text-neutral-600">{t.loading}</p>
            </div>
        );
    }

    // LIMIT REACHED OVERLAY
    if (limitReached) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-neutral-50 p-8 text-center animate-in fade-in">
                <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6 text-brand-primary">
                    <Heart size={40} className="fill-brand-primary" />
                </div>
                <h2 className="text-2xl font-bold font-apfel mb-2 text-neutral-800">{t.limitReachedTitle}</h2>
                <p className="text-neutral-500 mb-8 font-inter">{t.limitReachedSubtitle}</p>
                <div className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Batoo Match</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center h-full w-full max-w-md mx-auto relative pt-0 pb-8">
            {/* Onboarding Modal */}
            <UserOnboarding />

            {/* Header / Logo */}
            <div className="w-full h-20 flex items-center justify-center mb-6">
                <img src="/batoo-logo-dark.svg" alt="Batoo Logo" className="h-8 object-contain" />
            </div>

            {/* Cards Stack */}
            <div className="relative w-full h-[650px] flex justify-center items-center perspective-1000">
                {/* Next Card (Behind) */}
                {nextBoat && (
                    <div className="absolute top-0 w-full flex justify-center scale-95 opacity-60 pointer-events-none transform translate-y-6">
                        <BoatCard
                            boat={nextBoat}
                            onSwipe={() => { }}
                            drag={false}
                        />
                    </div>
                )}

                {/* Current Card (Top) */}
                <div className="absolute top-0 w-full flex justify-center z-10 transition-transform">
                    <BoatCard
                        key={currentBoat.BoatID}
                        boat={currentBoat}
                        onSwipe={handleSwipe}
                        drag={true}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mt-10">
                <button
                    onClick={() => handleSwipe("left")}
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-xl text-[#ef4444] hover:bg-neutral-50 hover:scale-110 active:scale-95 transition-all duration-200 border border-neutral-100"
                >
                    <X size={32} strokeWidth={2.5} />
                </button>

                <button
                    onClick={() => handleSwipe("right")}
                    className="flex items-center justify-center w-20 h-20 rounded-full bg-[#ec4899] shadow-xl shadow-[#ec4899]/30 text-white hover:bg-[#ec4899]/90 hover:scale-110 active:scale-95 transition-all duration-200"
                >
                    <Heart size={36} fill="currentColor" className="drop-shadow-sm" />
                </button>
            </div>

            <div className="mt-6 text-center text-xs text-neutral-300 font-inter">
                {currentIndex + 1} / {boats.length} {t.progress} {loading && `• ${t.loadingSmall}`}
            </div>

            {/* Stats Button - Optional */}
            <button
                onClick={() => {
                    const stats = getAnalytics ? getAnalytics() : { totalSwipes: 0, likes: 0, likeRate: 0, passes: 0 };
                    // Calculate rate safely
                    const rate = stats.totalSwipes > 0 ? ((stats.likes / stats.totalSwipes) * 100).toFixed(1) : "0.0";
                    alert(t.statsAlert(stats.totalSwipes, stats.likes, rate));
                }}
                className="mt-2 text-[10px] text-neutral-200 hover:text-white transition-colors"
            >
                {/* Hidden stats trigger */}
            </button>
        </div>
    );
}
