"use client";

import { IconPhoto } from "@tabler/icons-react";
import Image from "next/image";
import { useRef, useState } from "react";

export default function UploadImagens() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagens, setImagens] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const novosArquivos = Array.from(files).slice(0, 6 - imagens.length); // limita no máximo 6
    novosArquivos.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagens((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = ""; // reset input pra permitir mesmo arquivo
  };

  const removerImagem = (index: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = () => {
    if (imagens.length < 6) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full bg-white max-w-140 rounded-xl border-2 border-gray-400 p-4">
      <div className="grid grid-cols-3 gap-4 min-h-45 max-h-45 overflow-y-auto">
        {imagens.map((img, index) => (
          <div key={index} className="relative group">
            <Image
              src={img}
              alt={`Imagem ${index + 1}`}
              className="object-cover rounded-md w-full h-32"
              width={120}
              height={120}
            />
            <button
              onClick={() => removerImagem(index)}
              className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
            >
              X
            </button>
          </div>
        ))}
        {imagens.length < 6 && (
          <div
            onClick={handleUploadClick}
            className="flex items-center justify-center w-full h-32 border-2 border-gray-300 rounded-md cursor-pointer hover:border-verde transition"
          >
            <IconPhoto className="text-gray-400 w-8 h-8" />
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
