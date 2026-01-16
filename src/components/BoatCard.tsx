"use client";

import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Boat } from "@/lib/types";
import { MapPin, Ruler, Images, Loader2, X, ChevronLeft, ChevronRight, Calendar, Anchor } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

interface BoatCardProps {
    boat: Boat;
    onSwipe: (direction: "left" | "right") => void;
    style?: any;
    drag?: boolean;
}

export function BoatCard({ boat, onSwipe, style, drag = false }: BoatCardProps) {
    const t = useLanguage();
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);

    // Overlay opacity for like/nope indicators
    const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            onSwipe("right");
        } else if (info.offset.x < -100) {
            onSwipe("left");
        }
    };

    const secureUrl = (url: string | undefined) => {
        if (!url) return "/placeholder.jpg";
        // Use internal proxy to bypass SSL/Mixed Content issues
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    };

    const image = secureUrl(boat.ImagesList?.[0]?.ImageUrl);

    const [showGallery, setShowGallery] = useState(false);
    const [galleryImages, setGalleryImages] = useState<any[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(false);

    const handleViewMore = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent drag/swipe
        setLoadingGallery(true);
        try {
            const { getBoatDetail } = await import("@/lib/api");
            const details = await getBoatDetail(boat.BoatID);

            if (details && details.Images) {
                // Normalize images: append .2048.jpg for Ultra HD
                const imgs = details.Images.map(img => ({
                    url: secureUrl(`${img.ImageUrl}.2048.jpg`)
                }));
                setGalleryImages(imgs);
            } else {
                // Fallback to current image list
                setGalleryImages(boat.ImagesList?.map(img => ({ url: secureUrl(img.ImageUrl) })) || []);
            }
            setShowGallery(true);
        } catch (err) {
            console.error("Failed to load gallery", err);
        } finally {
            setLoadingGallery(false);
        }
    };

    return (
        <>
            <motion.div
                style={{ x, rotate, ...style }}
                drag={drag && !showGallery ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                className="absolute h-[520px] sm:h-[640px] w-full max-w-[340px] sm:max-w-sm rounded-[32px] bg-white shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none border border-neutral-100 flex flex-col"
            >
                {/* Indicators - Moved to top z-index for clarity */}
                {drag && (
                    <>
                        <motion.div
                            style={{ opacity: likeOpacity }}
                            className="absolute top-12 left-8 z-[60] border-[6px] border-[#007fff] rounded-2xl px-6 py-2 -rotate-12 bg-white/40 backdrop-blur-md shadow-2xl pointer-events-none"
                        >
                            <span className="text-5xl font-apfel font-extrabold text-[#007fff] uppercase tracking-widest drop-shadow-sm">LIKE</span>
                        </motion.div>
                        <motion.div
                            style={{ opacity: nopeOpacity }}
                            className="absolute top-12 right-8 z-[60] border-[6px] border-[#121A54] rounded-2xl px-6 py-2 rotate-12 bg-white/40 backdrop-blur-md shadow-2xl pointer-events-none"
                        >
                            <span className="text-5xl font-apfel font-extrabold text-[#121A54] uppercase tracking-widest drop-shadow-sm">NOPE</span>
                        </motion.div>
                    </>
                )}

                {/* Image Section (Top) */}
                <div className="relative h-[60%] w-full bg-neutral-50 overflow-hidden group border-b border-neutral-50">
                    {/* Blurry Background */}
                    <div
                        className="absolute inset-0 opacity-20 blur-2xl scale-125 pointer-events-none"
                        style={{
                            backgroundImage: `url(${image})`,
                            backgroundPosition: 'center',
                            backgroundSize: 'cover'
                        }}
                    />

                    {/* Main Image */}
                    <img
                        src={image}
                        alt={`${boat.Builder} ${boat.Model}`}
                        className="relative h-full w-full object-contain p-2 z-10 pointer-events-none"
                        draggable={false}
                    />

                    {/* Image Actions */}
                    <div className="absolute bottom-4 left-4 right-4 z-40 flex justify-between items-center">
                        <button
                            onClick={handleViewMore}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-all text-white text-[10px] sm:text-xs font-semibold shadow-lg cursor-pointer"
                        >
                            {loadingGallery ? <Loader2 size={14} className="animate-spin" /> : <Images size={14} />}
                            <span>{t.viewMore}</span>
                        </button>

                        <a
                            href={`https://batoo.it/it/barche-usate/${boat.BoatType === 'M' ? 'motoryacht' :
                                    boat.BoatType === 'V' ? 'sailboats' :
                                        boat.BoatType === 'G' ? 'inflatable' : 'barche'
                                }/${(boat.Builder + "-" + boat.Model).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}/${boat.BoatID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-neutral-200 transition-all text-[#121A54] text-[10px] sm:text-xs font-bold shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span>{t.viewDetails}</span>
                        </a>
                    </div>
                </div>

                {/* Content Section (Bottom) */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col bg-white">
                    <div className="flex flex-col gap-0.5 mb-3">
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl sm:text-3xl font-bold font-apfel text-black leading-tight">
                                {boat.Builder}
                            </h2>
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-neutral-100 text-neutral-500 font-inter">
                                {boat.YearBuilt}
                            </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-medium text-neutral-500 font-apfel -mt-1 uppercase tracking-tight">
                            {boat.Model}
                        </h3>
                        <p className="text-xl sm:text-2xl font-black text-black font-inter tracking-tight mt-1">
                            {boat.SellPrice && boat.SellPrice > 0
                                ? `€ ${boat.SellPrice.toLocaleString()}`
                                : "Price on Request"}
                        </p>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-sm text-neutral-600 font-inter mt-auto">
                        {(boat.Length || 0) > 0 && (
                            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-100">
                                <Ruler size={14} className="text-neutral-400" />
                                <span className="truncate">{boat.Length}m</span>
                            </div>
                        )}
                        {(boat.Cabins || 0) > 0 && (
                            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-100">
                                <Anchor size={14} className="text-neutral-400" />
                                <span>{boat.Cabins} Cabins</span>
                            </div>
                        )}
                        {(boat.Country || boat.City) && (
                            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-100 truncate col-span-2">
                                <MapPin size={14} className="text-neutral-400" />
                                <span className="truncate">{boat.City || boat.Country}</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Gallery Overlay */}
            {showGallery && (
                <GalleryOverlay
                    images={galleryImages}
                    onClose={() => setShowGallery(false)}
                    title={`${boat.Builder} ${boat.Model}`}
                />
            )}
        </>
    );
}

function GalleryOverlay({ images, onClose, title }: { images: any[], onClose: () => void, title: string }) {
    const [index, setIndex] = useState(0);

    const next = () => setIndex((i) => (i + 1) % images.length);
    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

    const handleDragEnd = (e: any, info: PanInfo) => {
        if (info.offset.x > 50) {
            prev();
        } else if (info.offset.x < -50) {
            next();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [images.length]);

    if (images.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white"><X /></button>
                <p className="text-white">No images available.</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between px-4 pt-2">
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight">{title}</span>
                    <span className="text-sm text-gray-300">{index + 1} / {images.length}</span>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md">
                    <X size={24} />
                </button>
            </div>

            {/* Main Image with Swipe */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black touch-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                        className="relative w-full h-full flex items-center justify-center p-2"
                    >
                        <img
                            src={images[index].url}
                            alt=""
                            className="max-w-full max-h-full object-contain shadow-2xl pointer-events-none"
                            draggable={false}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Arrow Controls (Hidden on mobile touch but available for desktop) */}
                <button
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-all hidden sm:flex"
                >
                    <ChevronLeft size={32} />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-all hidden sm:flex"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Thumbnails */}
            <div className="h-20 bg-black/90 flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-hide z-20">
                {images.map((img, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`relative flex-shrink-0 h-full aspect-square rounded-md overflow-hidden border-2 transition-all ${i === index ? 'border-brand-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    >
                        <img src={img.url} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                ))}
            </div>
        </div>
    );
}
