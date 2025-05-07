"use client";
interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export default function CarrinhoDrawer({ aberto, onFechar }: Props) {
  return (
    <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 transition-transform duration-300 ${aberto ? "translate-x-0" : "translate-x-full"}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Seu Carrinho</h2>
        <button onClick={onFechar}>x</button>
      </div>

      {/* Conteúdo do carrinho */}
      <div className="p-4">
        <p>Produtos adicionados...</p>
        {/* Mapear os produtos aqui */}
      </div>
    </div>
  );
}
