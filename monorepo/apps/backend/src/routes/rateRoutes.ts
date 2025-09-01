import { Router, Request, Response } from "express"
import { PrismaClient } from "@prisma/client";
import { usuarioAutenticado } from "../middlewares/auth";

const prisma = new PrismaClient();

const router = Router();

router.post('/avaliacoes', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const { idProduto, avaliacao, comentario } = req.body;

    if (avaliacao < 0 || avaliacao > 5) {
      return res.status(400).json({ message: 'A avaliação deve estar entre 0 à 5' });
    }

    const usuario = (req as any).usuario;

    const produtoExiste = await prisma.produto.findUnique({
      where: {
        id: idProduto
      }
    })

    if (!produtoExiste) {
      return res.status(404).json({ message: 'Não foi possível encontrar o produto' })
    }

    const novaAvaliacao = await prisma.avaliacao.create({
      data: {
        idProduto,
        idUsuario: usuario.id,
        avaliacao,
        comentario
      },
      include: {
        produto: true
      }

    })
    return res.status(201).json({ message: "Avaliação feita com sucesso!", avaliacao: novaAvaliacao });
  } catch (error) {
    return res.status(500).json({ message: `Erro ao criar avaliação: ${error instanceof Error ? error.message : error}` });
  }
})

router.get('/avaliacoes/:idProduto', usuarioAutenticado, async (req: Request, res: Response) => {
  const idProduto = Number(req.params.idProduto);
  if (isNaN(idProduto)) {
    return res.status(400).json({ message: 'ID inválido' })
  }
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        idProduto
      },
      orderBy: {
        dataAvaliacao: 'desc'
      },
      include: {
        produto: true
      }
    })
    if (avaliacoes.length === 0) {
      return res.status(404).json({ message: 'Não foi encontrada nenhuma avaliação sobre este produto' })
    }
    return res.status(200).json({ avaliacoes })
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar pelas avaliações do produto: ${error instanceof Error ? error.message : error}` });
  }
})

router
.delete('/avaliacoes/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }
    const usuario = (req as any).usuario;

    const avaliacao = await prisma.avaliacao.findUnique({
      where: {
        id
      },
      include: {
        produto: true
      }
    })

    if (!avaliacao) {
      return res.status(404).json({ message: 'Não foi possível encontrar avaliacao' })
    }

    if (usuario.id !== avaliacao.idUsuario && !usuario.isAdmin) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir essa avaliação' });
    }

    return res.status(200).json({ message: 'Avaliação excluída com sucesso!', avaliacao })
  } catch (error) {
    return res.status(500).json({ message: `Erro ao excluir avaliação: ${error instanceof Error ? error.message : error}` });
  }
})

export default router;