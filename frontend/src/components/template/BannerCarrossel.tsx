"use client";
import { useState } from "react";
import Image from "next/image";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

const banners = ["/imagem1.jpg", "/imagem2.jpg", "/imagem3.jpg"];

export default function BannerCarousel() {
    const [index, setIndex] = useState(0);

    const prevSlide = () => {
        setIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const nextSlide = () => {
        setIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="relative w-full h-72 md:h-96 overflow-hidden">
            <div className="w-full h-full relative transition-transform duration-700 ease-in-out">
                {banners.map((banner, i) => (
                    <Image
                        key={i}
                        src={banner}
                        alt={`Banner ${i + 1}`}
                        width={1920}
                        height={400}
                        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${index === i ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                    />
                ))}
            </div>

            {/* Sombreado fluido inferior */}
            <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white via-white/80 to-transparent z-20 pointer-events-none" />

            {/* Indicadores de slide */}
            {/* Indicadores de slide clicáveis */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
                {banners.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === i ? "bg-verde scale-110" : "bg-gray-300"
                            }`}
                        aria-label={`Ir para o slide ${i + 1}`}
                    />
                ))}
            </div>


            {/* Botões de navegação */}
            <button
                onClick={prevSlide}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/50 p-2 rounded-full text-white z-30 hover:bg-black/70 transition"
            >
                <IconArrowLeft size={24} />
            </button>

            <button
                onClick={nextSlide}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/50 p-2 rounded-full text-white z-30 hover:bg-black/70 transition"
            >
                <IconArrowRight size={24} />
            </button>
        </div>
    );
}
