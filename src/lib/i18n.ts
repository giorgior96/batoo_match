"use client";

import { useState, useEffect } from 'react';

type Language = 'it' | 'en';

const translations = {
    it: {
        loading: "Sto cercando le barche migliori...",
        noMoreBoats: "Nessuna altra barca disponibile al momento.",
        onboardingTitle: "Benvenuto a Bordo!",
        onboardingSubtitle: "Inserisci i tuoi dati così i broker potranno contattarti quando trovi la barca dei tuoi sogni.",
        placeholderName: "Nome e Cognome",
        placeholderEmail: "Indirizzo Email",
        placeholderPhone: "Numero di Telefono",
        submitButton: "Inizia a Scoprire",
        dataPrivacy: "I tuoi dati saranno condivisi solo con i broker delle barche che ti piacciono.",
        successTitle: "Tutto pronto!",
        successSubtitle: "Goditi la ricerca della tua barca ideale.",
        statsButton: "Vedi Statistiche",
        statsAlert: (swipes: number, likes: number, rate: string) => `Statistiche:\n${swipes} swipate\n${likes} mi piace (${rate}%)\n`,
        progress: "barche",
        loadingSmall: "Caricamento...",
        viewMore: "Vedi Foto",
        photos: "Foto",
        limitReachedTitle: "Hai finito i Like per oggi!",
        limitReachedSubtitle: "Torna domani per scoprire nuove barche."
    },
    en: {
        loading: "Finding the best boats for you...",
        noMoreBoats: "No more boats available at the moment.",
        onboardingTitle: "Welcome Aboard!",
        onboardingSubtitle: "Enter your details so brokers can contact you when you find your dream boat.",
        placeholderName: "Full Name",
        placeholderEmail: "Email Address",
        placeholderPhone: "Phone Number",
        submitButton: "Start Swiping",
        dataPrivacy: "I agree to the Privacy Policy and data sharing with brokers.",
        successTitle: "You're all set!",
        successSubtitle: "Enjoy finding your perfect boat.",
        statsButton: "View Insights",
        statsAlert: (swipes: number, likes: number, rate: string) => `Stats:\n${swipes} swipes\n${likes} likes (${rate}%)\n`,
        progress: "boats",
        loadingSmall: "Loading...",
        viewMore: "View Images",
        photos: "Photos",
        limitReachedTitle: "Daily Limit Reached!",
        limitReachedSubtitle: "Come back tomorrow for more boats."
    }
};

export function useLanguage() {
    const [lang, setLang] = useState<Language>('en');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('it')) {
                setLang('it');
            } else {
                setLang('en');
            }
        }
    }, []);

    return translations[lang];
}
