"use client";

import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
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
                className="absolute h-[520px] sm:h-[640px] w-full max-w-[340px] sm:max-w-sm rounded-[32px] bg-white shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none border border-neutral-100"
            >
                {/* Indicators */}
                {drag && (
                    <>
                        <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-20 border-4 border-[#22c55e] rounded-xl px-4 py-1 -rotate-12 bg-white/20 backdrop-blur-sm">
                            <span className="text-3xl font-apfel font-bold text-[#22c55e] uppercase tracking-wide">LIKE</span>
                        </motion.div>
                        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 z-20 border-4 border-[#ef4444] rounded-xl px-4 py-1 rotate-12 bg-white/20 backdrop-blur-sm">
                            <span className="text-3xl font-apfel font-bold text-[#ef4444] uppercase tracking-wide">NOPE</span>
                        </motion.div>
                    </>
                )}

                {/* Image Container */}
                <div className="relative h-full w-full bg-neutral-900 overflow-hidden group">
                    {/* Blurry Background */}
                    <div
                        className="absolute inset-0 opacity-50 blur-3xl scale-125 transition-transform duration-700"
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
                        className="relative h-full w-full object-contain pointer-events-none z-10"
                        draggable={false}
                    />

                    {/* Gradients */}
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-20" />
                    <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-brand-secondary via-brand-secondary/80 to-transparent z-20" />

                    {/* View More Button */}
                    <div className="absolute top-4 left-4 z-40">
                        <button
                            onClick={handleViewMore}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 transition-all text-white text-[10px] sm:text-xs font-semibold shadow-lg cursor-pointer"
                        >
                            {loadingGallery ? <Loader2 size={14} className="animate-spin" /> : <Images size={14} />}
                            <span>{t.viewMore}</span>
                        </button>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
                        {boat.New && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary text-white shadow-lg font-inter">
                                NEW
                            </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-lg font-inter">
                            {boat.YearBuilt}
                        </span>
                    </div>

                </div>

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end pb-8 z-30">
                    <div className="flex flex-col gap-0.5 mb-2">
                        <h2 className="text-2xl sm:text-3xl font-bold font-apfel text-white leading-tight drop-shadow-md">
                            {boat.Builder} <span className="font-normal opacity-90">{boat.Model}</span>
                        </h2>
                        <p className="text-xl sm:text-2xl font-bold text-sky-400 drop-shadow-md font-inter tracking-tight">
                            {boat.SellPrice && boat.SellPrice > 0
                                ? `€ ${boat.SellPrice.toLocaleString()}`
                                : "Price on Request"}
                        </p>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:text-sm text-white/90 font-inter mt-2">
                        {/* Row 1 */}
                        {(boat.Length || 0) > 0 && (
                            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                                <Ruler size={12} className="text-brand-primary-light" />
                                <span className="truncate">{boat.Length}m Length</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                            <Calendar size={12} className="text-brand-primary-light" />
                            <span>{boat.YearBuilt}</span>
                        </div>

                        {/* Row 2 */}
                        {(boat.Country || boat.City) && (
                            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10 truncate">
                                <MapPin size={12} className="text-brand-primary-light" />
                                <span className="truncate">{boat.City || boat.Country}</span>
                            </div>
                        )}

                        {(boat.Cabins || 0) > 0 && (
                            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                                <Anchor size={12} className="text-brand-primary-light" />
                                <span>{boat.Cabins} Cabins</span>
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

            {/* Main Image */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                <div className="relative w-full h-full flex items-center justify-center p-2">
                    <img
                        src={images[index].url}
                        alt=""
                        className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-all"
                >
                    <ChevronLeft size={32} />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-all"
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
