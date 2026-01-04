"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Send } from "lucide-react";
import { buscarConversa, enviarMensagem, Mensagem, DadosMensagem } from "@/services/mensagem";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { toast } from "react-toastify";

export default function TelaDeMensagens() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const { socket, isConnected } = useWebSocket();

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
      } finally {
        setCarregando(false);
      }
    };

    carregarMensagens();
  }, [idOutroUsuario, usuario, router]);

  useEffect(() => {
    if (!socket || !isConnected || !idOutroUsuario) return;

    socket.emit('join_conversation', { otherUserId: idOutroUsuario });

    const handleNewMessage = (message: Mensagem) => {
      setMensagens((prev) => {
        const exists = prev.some((msg) => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleMessageSent = (message: Mensagem) => {
      setMensagens((prev) => {
        const tempIndex = prev.findIndex((msg) => msg.id === Math.floor(message.id));
        if (tempIndex !== -1 && prev[tempIndex].id < 0) {
          const newMessages = [...prev];
          newMessages[tempIndex] = message;
          return newMessages;
        }
        return prev;
      });
    };

    const handleMessageReceived = (message: Mensagem) => {
      setMensagens((prev) => {
        const exists = prev.some((msg) => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleMessageDeleted = (data: { messageId: number }) => {
      setMensagens((prev) => prev.filter((msg) => msg.id !== data.messageId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_received', handleMessageReceived);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.emit('leave_conversation', { otherUserId: idOutroUsuario });
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_received', handleMessageReceived);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, isConnected, idOutroUsuario]);

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

    const msgTemporaria: Mensagem = {
      id: -Math.random(),
      idUsuarioEmissor: idUsuarioLogado,
      idUsuarioReceptor: idOutroUsuario,
      mensagem: novaMensagem,
      dataEnvio: new Date(),
    };

    try {
      setEnviando(true);
      setMensagens((prev) => [...prev, msgTemporaria]);
      setNovaMensagem(""); 

      await enviarMensagem(dados);
    } catch (error) {
      toast.error("Não foi possível enviar sua mensagem.");
      setMensagens((prev) => prev.filter((msg) => msg.id !== msgTemporaria.id));
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
        <div className="flex-1">
          <p className="font-semibold text-lg texto-azul">{nomeDestinatario}</p>
          <p className="text-xs texto-azul opacity-60">
            {isConnected ? '● Online' : '○ Offline'}
          </p>
        </div>
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
            disabled={!isConnected}
          />
          <button
            onClick={handleEnviarMensagem}
            disabled={enviando || !novaMensagem.trim() || !isConnected}
            className="bg-verde text-white rounded-full p-3 hover:bg-azul transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={22} />
          </button>
        </div>
      </footer>
    </div>
  );
}
