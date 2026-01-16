"use client";

import { Boat } from './types';

const STORAGE_KEY = 'batoo_match_swipes';

export interface SwipeEvent {
    boatId: string;
    direction: 'left' | 'right';
    timestamp: number;
    boat: {
        builder: string;
        model: string;
        price: number;
        boatType?: string;
        boatFamily?: string;
        // Keep specifics minimal if analytics page is gone, 
        // but we need some data for the 'Auto-email' context or algorithm
    };
}

// Minimal Analytics Interface just to satisfy imports/build
export interface SwipeAnalytics {
    totalSwipes: number;
    likes: number;
    passes: number;
    // ... stats optionally
}

// Record a swipe (Essential for Algorithm & Email trigger)
export function recordSwipe(boat: Boat, direction: 'left' | 'right'): void {
    if (typeof window === 'undefined') return;

    const history = getSwipeHistory();
    const event: SwipeEvent = {
        boatId: boat.BoatID,
        direction,
        timestamp: Date.now(),
        boat: {
            builder: boat.Builder,
            model: boat.Model,
            price: boat.SellPrice,
            boatType: boat.BoatType,
            boatFamily: boat.BoatFamilies
        }
    };

    history.push(event);

    // Limit history size
    if (history.length > 500) {
        history.splice(0, history.length - 500);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getSwipeHistory(): SwipeEvent[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

export function resetAnalytics(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Cache cleared');
}

// Kept minimal for Deck.tsx usage (stats button) or just returns basic counts
export function getAnalytics(): any {
    const history = getSwipeHistory();
    const likes = history.filter((e: SwipeEvent) => e.direction === 'right');
    return {
        totalSwipes: history.length,
        likes: likes.length,
        passes: history.length - likes.length,
        likeRate: 0 // placeholder
    };
}

// Essential for Smart Algorithm
export function getLearnedPreferences() {
    const history = getSwipeHistory();
    const likes = history.filter((e: SwipeEvent) => e.direction === 'right');

    if (likes.length < 3) return null;

    // Simple frequency maps
    const likedTypes: Record<string, number> = {};
    const likedFamilies: Record<string, number> = {};

    likes.forEach((like: SwipeEvent) => {
        if (like.boat.boatType) likedTypes[like.boat.boatType] = (likedTypes[like.boat.boatType] || 0) + 1;
        if (like.boat.boatFamily) {
            like.boat.boatFamily.split(',').forEach(f => {
                const ft = f.trim();
                if (ft) likedFamilies[ft] = (likedFamilies[ft] || 0) + 1;
            });
        }
    });

    // Sort logic
    const topTypes = Object.entries(likedTypes).sort(([, a], [, b]) => b - a).map(([k]) => k);
    const topFamilies = Object.entries(likedFamilies).filter(([, c]) => c > 1).sort(([, a], [, b]) => b - a).map(([k]) => k);

    return {
        preferredTypes: topTypes,
        preferredFamilies: topFamilies,
        // Mock averages to satisfy existing api.ts logic without breaking
        averagePrice: 0,
        averageLength: 0,
        averageYear: 0,
        preferredBrands: [],
        dislikedBrandsList: [],
    };
}
