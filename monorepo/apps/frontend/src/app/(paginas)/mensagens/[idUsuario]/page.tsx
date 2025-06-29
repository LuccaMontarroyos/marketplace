// "use client";
// import { useState, useEffect } from "react";
// import { useParams } from "next/navigation";

// interface Mensagem {
//   id: number;
//   conteudo: string;
//   remetenteId: number;
//   destinatarioId: number;
//   criadoEm: string;
// }

// export default function TelaDeMensagens() {
//   const params = useParams();
//   const idOutroUsuario = Number(params.idOutroUsuario);
//   const [mensagens, setMensagens] = useState<Mensagem[]>([]);
//   const [novaMensagem, setNovaMensagem] = useState("");

//   // Suponha que esse é o ID do usuário logado
//   const idUsuarioLogado = 1;

//   const carregarMensagens = async () => {
//     const res = await fetch(`http://localhost:3001/mensagens/${idUsuarioLogado}/${idOutroUsuario}`);
//     const data = await res.json();
//     setMensagens(data);
//   };

//   const enviarMensagem = async () => {
//     if (!novaMensagem.trim()) return;

//     await fetch("http://localhost:3001/mensagens", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         remetenteId: idUsuarioLogado,
//         destinatarioId: idOutroUsuario,
//         conteudo: novaMensagem,
//       }),
//     });

//     setNovaMensagem("");
//     carregarMensagens(); // Atualiza a lista
//   };

//   useEffect(() => {
//     carregarMensagens();
//     const interval = setInterval(carregarMensagens, 3000); // polling simples
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
//       <div className="bg-gray-100 rounded-lg p-4 h-[500px] overflow-y-auto flex flex-col gap-2">
//         {mensagens.map((msg) => (
//           <div
//             key={msg.id}
//             className={`p-2 rounded-md max-w-[70%] ${
//               msg.remetenteId === idUsuarioLogado
//                 ? "bg-blue-500 text-white self-end"
//                 : "bg-gray-300 self-start"
//             }`}
//           >
//             {msg.conteudo}
//           </div>
//         ))}
//       </div>

//       <div className="flex gap-2">
//         <input
//           type="text"
//           className="flex-1 border rounded-md p-2"
//           placeholder="Digite sua mensagem..."
//           value={novaMensagem}
//           onChange={(e) => setNovaMensagem(e.target.value)}
//         />
//         <button
//           onClick={enviarMensagem}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           Enviar
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface Mensagem {
  id: number;
  conteudo: string;
  remetenteId: number;
  destinatarioId: number;
  criadoEm: string;
}

export default function TelaDeMensagens() {
  const params = useParams();
  const idOutroUsuario = Number(params.idOutroUsuario ?? 2);
  const idUsuarioLogado = 1;

  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: 1,
      conteudo: "Oi! Tudo bem?",
      remetenteId: 2,
      destinatarioId: 1,
      criadoEm: "2025-05-08T10:00:00Z",
    },
    {
      id: 2,
      conteudo: "Tudo ótimo, e você?",
      remetenteId: 1,
      destinatarioId: 2,
      criadoEm: "2025-05-08T10:01:00Z",
    },
    {
      id: 3,
      conteudo: "Tô bem também! Você viu meu novo produto?",
      remetenteId: 2,
      destinatarioId: 1,
      criadoEm: "2025-05-08T10:02:00Z",
    },
  ]);

  const [novaMensagem, setNovaMensagem] = useState("");

  const enviarMensagem = () => {
    if (!novaMensagem.trim()) return;

    const nova: Mensagem = {
      id: mensagens.length + 1,
      conteudo: novaMensagem,
      remetenteId: idUsuarioLogado,
      destinatarioId: idOutroUsuario,
      criadoEm: new Date().toISOString(),
    };

    setMensagens((prev) => [...prev, nova]);
    setNovaMensagem("");
  };

  return (
    <div className="bg-gray-200">
      <header className="bg-white py-5 pl-10 flex gap-5 items-center">
        <div>
        <div className="w-[70px] h-[70px] rounded-full overflow-hidden border-verde">
          <Image src={"/foto-perfil.jpg"} alt={"Foto de perfil do usuário"} width={50} height={50} className="object-cover w-full h-full" />
        </div>
        <p className="texto-azul text-lg font-semibold">Nome do meliante</p>
        </div>
      </header>
      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4 ">
        <div className="bg-gray-100 rounded-lg p-4 h-[500px] overflow-y-auto flex flex-col gap-2">
          {mensagens.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-md max-w-[70%] ${msg.remetenteId === idUsuarioLogado
                ? "bg-azul text-white self-end"
                : "bg-gray-400 self-start"
                }`}
            >
              {msg.conteudo}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-md p-2 bg-white"
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
          />
          <button
            onClick={enviarMensagem}
            className="add-carrinho text-white px-4 py-2 rounded"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
