import { IconSearch } from "@tabler/icons-react"
import { useState } from "react";

export interface BarraPesquisaProps {
  onBuscar: (termo: string) => void;
}

export default function BarraPesquisa({ onBuscar }: BarraPesquisaProps) {
  const [termo, setTermo] = useState("");

  const handleBuscar = () => {
    onBuscar(termo);
  }
  return (
    <div className="flex w-full max-w-md shadow-sm">
      <input
        type="text"
        placeholder="Buscar produtos..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        className="px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none rounded-l-md w-full"
      />
      <button
        type="button"
        onClick={handleBuscar}
        className="px-4 py-2 rounded-r-md flex items-center justify-center search-button transition-colors duration-300"
      >
        <IconSearch size={20} />
      </button>
    </div>
    // <div className="flex w-full max-w-md shadow-sm">
    //   <input
    //     type="text"
    //     placeholder="Buscar produtos..."
    //     className="px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none rounded-l-md w-full"
    //   />
    //   <button
    //     type="button"
    //     className=" px-4 py-2 rounded-r-md flex items-center justify-center search-button transition-colors duration-300"
    //   >
    //     <IconSearch size={20} />
    //   </button>
    // </div>
  )
}
