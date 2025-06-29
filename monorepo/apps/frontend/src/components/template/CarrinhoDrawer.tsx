// "use client";
// import { IconXboxX } from '@tabler/icons-react';
// import Image from "next/image";
// interface Props {
//   aberto: boolean;
//   onFechar: () => void;
// }

// export default function CarrinhoDrawer({ aberto, onFechar }: Props) {
//   return (
//     <div className={`fixed top-0 right-0 h-full w-80 text-black bg-white shadow-lg z-50 transition-transform duration-300 ${aberto ? "translate-x-0" : "translate-x-full"}`}>

//       <div className="flex justify-between items-center p-4 border-b">
//         <h2 className="text-lg font-semibold">Seu Carrinho</h2>
//         <button onClick={onFechar}>x</button>
//       </div>

//       {/* Conteúdo do carrinho */}
//       <div className="p-4">
//         <p className="pb-8">Produtos adicionados...</p>
//         <section className="flex flex-col gap-5">
//           {/* map dos produtos adicionados */}
//           <div className="flex flex-rol align-center justify-between pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex flex-rol align-center justify-between  pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex flex-rol align-center justify-between  pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex flex-rol align-center justify-between  pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex flex-rol align-center justify-between  pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex flex-rol align-center justify-between  pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex flex-rol align-center justify-between  pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex flex-rol align-center justify-between  pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex flex-rol align-center justify-between  pb-5 border-b-1 border-black">
//             <Image src={"/imagem1.jpg"} alt={"imagemTeste"} width={50} height={50}/>
//             <div>
//             <p>Nome do produto</p>
//             <p className='text-gray-600'>R$ 19.00</p>
//             </div>
//             <button><IconXboxX size={20}/></button>
//           </div>
//           <div className="flex justify-between px-2">
//             <p>TOTAL</p>
//             <strong>R$ 23.99</strong>
//           </div>
//           <button className="botao-verde">Confirmar</button>
//         </section>
//       </div>
//     </div>
//   );
// }
"use client";
import { IconXboxX } from '@tabler/icons-react';
import Image from "next/image";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export default function CarrinhoDrawer({ aberto, onFechar }: Props) {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 text-black bg-white shadow-lg z-50 transition-transform duration-300 ${
        aberto ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Seu Carrinho</h2>
        <button onClick={onFechar}>x</button>
      </div>

      {/* Corpo com scroll */}
      <div className="flex flex-col h-[calc(100%-64px)]"> {/* 64px = altura do header */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="pb-8">Produtos adicionados...</p>
          <section className="flex flex-col gap-5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between pb-5 border-b border-black"
              >
                <Image
                  src={"/imagem1.jpg"}
                  alt={"imagemTeste"}
                  width={50}
                  height={50}
                />
                <div>
                  <p>Nome do produto</p>
                  <p className="text-gray-600">R$ 19.00</p>
                </div>
                <button>
                  <IconXboxX size={20} />
                </button>
              </div>
            ))}
          </section>
        </div>

        {/* Rodapé fixo */}
        <div className="p-4 border-t bg-white">
          <div className="flex justify-between mb-4 px-2">
            <p>TOTAL</p>
            <strong>R$ 23.99</strong>
          </div>
          <button className="botao-verde w-full">Confirmar</button>
        </div>
      </div>
    </div>
  );
}
