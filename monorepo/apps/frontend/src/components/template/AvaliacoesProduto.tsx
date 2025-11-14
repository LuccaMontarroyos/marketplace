"use client";
import { useEffect, useState } from "react";
import { buscarAvaliacoesPorProduto, criarAvaliacao, excluirAvaliacao, Avaliacao } from "@/services/avaliacao";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { IconStar, IconStarFilled, IconTrash } from "@tabler/icons-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AvaliacoesProdutoProps {
  idProduto: number;
}

export default function AvaliacoesProduto({ idProduto }: AvaliacoesProdutoProps) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [avaliacao, setAvaliacao] = useState(5);
  const [comentario, setComentario] = useState("");
  const { usuario } = useAuth();

  useEffect(() => {
    carregarAvaliacoes();
  }, [idProduto]);

  const carregarAvaliacoes = async () => {
    try {
      setLoading(true);
      const dados = await buscarAvaliacoesPorProduto(idProduto);
      setAvaliacoes(dados);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error("Erro ao carregar avaliações");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCriarAvaliacao = async () => {
    if (!usuario) {
      toast.error("Você precisa estar logado para avaliar");
      return;
    }

    try {
      await criarAvaliacao({
        idProduto,
        avaliacao,
        comentario: comentario || undefined,
      });
      toast.success("Avaliação criada com sucesso!");
      setComentario("");
      setAvaliacao(5);
      setMostrarFormulario(false);
      carregarAvaliacoes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao criar avaliação");
      console.error(error);
    }
  };

  const handleExcluirAvaliacao = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta avaliação?")) {
      return;
    }

    try {
      await excluirAvaliacao(id);
      toast.success("Avaliação excluída com sucesso!");
      carregarAvaliacoes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao excluir avaliação");
      console.error(error);
    }
  };

  const mediaAvaliacoes =
    avaliacoes.length > 0
      ? avaliacoes.reduce((acc, av) => acc + av.avaliacao, 0) / avaliacoes.length
      : 0;

  if (loading) {
    return <div className="mt-8">Carregando avaliações...</div>;
  }

  return (
    <div className="mt-8 border-t border-gray-300 pt-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 texto-azul">Avaliações</h2>
          {avaliacoes.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconStarFilled
                    key={star}
                    size={20}
                    className={
                      star <= Math.round(mediaAvaliacoes)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-lg font-semibold texto-azul">
                {mediaAvaliacoes.toFixed(1)} ({avaliacoes.length} avaliações)
              </span>
            </div>
          )}
        </div>
        {usuario && !mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="botao-verde px-4 py-2 rounded-lg"
          >
            Avaliar Produto
          </button>
        )}
      </div>

      {mostrarFormulario && usuario && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-4 texto-azul">Deixe sua avaliação</h3>
          <div className="mb-4">
            <label className="block mb-2 texto-azul">Nota:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setAvaliacao(star)}
                  className="focus:outline-none"
                >
                  {star <= avaliacao ? (
                    <IconStarFilled
                      size={30}
                      className="text-yellow-400 cursor-pointer"
                    />
                  ) : (
                    <IconStar
                      size={30}
                      className="text-gray-300 cursor-pointer hover:text-yellow-400"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 texto-azul">Comentário (opcional):</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-2 border rounded-lg texto-azul placeholder:text-gray-400 focus:border-verde focus:outline-none"
              rows={4}
              placeholder="Deixe um comentário sobre o produto..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCriarAvaliacao}
              className="botao-verde px-4 py-2 rounded-lg"
            >
              Enviar Avaliação
            </button>
            <button
              onClick={() => {
                setMostrarFormulario(false);
                setComentario("");
                setAvaliacao(5);
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {avaliacoes.length === 0 ? (
        <p className="texto-azul">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map((avaliacao) => (
            <div
              key={avaliacao.id}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconStarFilled
                          key={star}
                          size={16}
                          className={
                            star <= avaliacao.avaliacao
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm texto-azul opacity-70">
                      {format(new Date(avaliacao.dataAvaliacao), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {avaliacao.comentario && (
                    <p className="texto-azul">{avaliacao.comentario}</p>
                  )}
                </div>
                {usuario && (usuario.id === avaliacao.idUsuario || usuario.isAdmin) && (
                  <button
                    onClick={() => handleExcluirAvaliacao(avaliacao.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Excluir avaliação"
                  >
                    <IconTrash size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

