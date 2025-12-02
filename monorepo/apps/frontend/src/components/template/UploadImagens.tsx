"use client";

import { IconPhoto } from "@tabler/icons-react";
import Image from "next/image";
import { useRef } from "react";

export interface UploadImagensProps {
  value?: File[];
  onChangeImagens: (imagens: File[]) => void;
}

export default function UploadImagens({ value = [], onChangeImagens }: UploadImagensProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const novosArquivos = Array.from(files).slice(0, 6 - value.length);
    onChangeImagens([...value, ...novosArquivos]);

    event.target.value = "";
  };

  const removerImagem = (index: number) => {
    const novas = value.filter((_, i) => i !== index);
    onChangeImagens(novas);
  };

  const handleUploadClick = () => {
    if (value.length < 6) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full bg-white max-w-140 rounded-xl border-2 border-gray-400 p-4">
      <div className="grid grid-cols-3 gap-4 min-h-45 max-h-45 overflow-y-auto">
        {value.map((file, index) => (
          <div key={index} className="relative group">
            <Image
              src={URL.createObjectURL(file)}
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
        {value.length < 6 && (
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
