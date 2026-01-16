import { useState, useEffect } from 'react';

type Language = 'it' | 'en';

const translations = {
    it: {
        loading: "Preparando le migliori barche per te...",
        loadingSmall: "Cerco altre barche...",
        onboardingTitle: "Trova la barca dei tuoi sogni",
        onboardingSubtitle: "Inserisci i tuoi dati per iniziare. Per ogni barca che ti piace (Like), invieremo una richiesta automatica al broker.",
        nameLabel: "Nome e Cognome",
        emailLabel: "Email",
        phoneLabel: "Telefono",
        privacyLabel: "Accetto la Privacy Policy e dichiaro che ogni Like equivale a una richiesta di contatto al broker.",
        submitButton: "Inizia il Match",
        progress: "scoperte",
        viewMore: "Vedi Immagini",
        statsTitle: "Tue Statistiche",
        statsAlert: (total: number, likes: number, rate: string) => `Hai visto ${total} barche e ne hai salvate ${likes}.\nIl tuo tasso di interesse è del ${rate}%.`,
        limitReachedTitle: "Limite Giornaliero Raggiunto",
        limitReachedSubtitle: "Hai espresso interesse per 10 barche oggi. Torna domani per scoprirne di nuove!"
    },
    en: {
        loading: "Preparing the best boats for you...",
        loadingSmall: "Finding more boats...",
        onboardingTitle: "Find your dream boat",
        onboardingSubtitle: "Enter your details to start. For every boat you like, we will send an automatic request to the broker.",
        nameLabel: "Full Name",
        emailLabel: "Email",
        phoneLabel: "Phone Number",
        privacyLabel: "I accept the Privacy Policy and understand that every Like counts as a contact request to the broker.",
        submitButton: "Start Matching",
        progress: "discovered",
        viewMore: "View Images",
        statsTitle: "Your Statistics",
        statsAlert: (total: number, likes: number, rate: string) => `You've seen ${total} boats and saved ${likes}.\nYour interest rate is ${rate}%.`,
        limitReachedTitle: "Daily Limit Reached",
        limitReachedSubtitle: "You've liked 10 boats today. Come back tomorrow to discover more!"
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
