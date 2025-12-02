"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Send } from "lucide-react";
import { buscarConversa, enviarMensagem, Mensagem, DadosMensagem } from "@/services/mensagem";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function TelaDeMensagens() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { usuario } = useAuth();

  const idOutroUsuario = Number(params.idUsuario);
  const idUsuarioLogado = usuario?.id;

  const nomeDestinatario = searchParams.get("nome") || "Usuário";
  const fotoDestinatario = searchParams.get("foto") || "/icone-perfil.png";

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!usuario) {
      router.push("/login");
      return;
    }

    const carregarMensagens = async () => {
      if (!idOutroUsuario) return;
      try {
        const data = await buscarConversa(idOutroUsuario);
        setMensagens(data);
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarMensagens();

    const interval = setInterval(carregarMensagens, 5000);
    return () => clearInterval(interval);
  }, [idOutroUsuario, usuario, router]);

  const rolarParaBaixo = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    rolarParaBaixo();
  }, [mensagens]);

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim() || !idUsuarioLogado) return;

    const dados: DadosMensagem = {
      idUsuarioReceptor: idOutroUsuario,
      mensagem: novaMensagem,
    };

    try {
      setEnviando(true);
      const msgTemporaria: Mensagem = {
        id: Math.random(),
        idUsuarioEmissor: idUsuarioLogado,
        idUsuarioReceptor: idOutroUsuario,
        mensagem: novaMensagem,
        dataEnvio: new Date(),
      };
      
      setMensagens((prev) => [...prev, msgTemporaria]);
      setNovaMensagem(""); 

      await enviarMensagem(dados);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Não foi possível enviar sua mensagem.");
      setMensagens((prev) => prev.slice(0, -1));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">

      <header className="bg-white px-4 md:px-8 py-4 flex gap-3 items-center shadow-md z-10 sticky top-0">
        <Image
          src={fotoDestinatario}
          alt={`Foto de ${nomeDestinatario}`}
          width={48}
          height={48}
          className="object-cover w-12 h-12 rounded-full"
        />
        <p className="font-semibold text-lg texto-azul">{nomeDestinatario}</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-16 py-6 space-y-4">
        {carregando && <p className="text-center texto-azul opacity-70">Carregando mensagens...</p>}

        {!carregando && mensagens.length === 0 && (
          <p className="text-center texto-azul opacity-70">Envie a primeira mensagem!</p>
        )}

        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.idUsuarioEmissor === idUsuarioLogado ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[75%] shadow-sm ${msg.idUsuarioEmissor === idUsuarioLogado
                  ? "bg-verde text-white rounded-br-none"
                  : "bg-white texto-azul rounded-bl-none border border-gray-100"
                }`}
            >
              {msg.mensagem}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white px-4 md:px-16 py-4 shadow-inner sticky bottom-0">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            className="flex-1 border-none rounded-full py-3 px-5 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-verde texto-azul placeholder:text-gray-400"
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEnviarMensagem();
              }
            }}
          />
          <button
            onClick={handleEnviarMensagem}
            disabled={enviando || !novaMensagem.trim()}
            className="bg-verde text-white rounded-full p-3 hover:bg-azul transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={22} />
          </button>
        </div>
      </footer>
    </div>
  );
}