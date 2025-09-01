import { usuarioAutenticado } from "../middlewares/auth";
import { Request, Response } from "express";
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = Router();

router.post('/mensagens', usuarioAutenticado, async (req: Request, res: Response) => {
  const { idUsuarioReceptor, mensagem } = req.body;

  try {

    const usuario = (req as any).usuario;

    const usuarioReceptorExiste = await prisma.usuario.findUnique({
      where: {
        id: idUsuarioReceptor
      }
    })

    if (!usuarioReceptorExiste) {
      return res.status(404).json({ message: 'Não foi possível enviar a mensagem pois não há usuário receptor' })
    }

    const mensagemEnviada = await prisma.mensagem.create({
      data: {
        idUsuarioEmissor: usuario.id,
        idUsuarioReceptor,
        mensagem
      }
    })

    return res.status(201).json({ message: 'Mensagem enviada com sucesso!', mensagemEnviada })
  } catch (error) {
    return res.status(500).json({ message: `Erro ao enviar mensagem: ${error instanceof Error ? error.message : error}` });
  }
})

router.get('/mensagens', usuarioAutenticado, async (req: Request, res: Response) => {

  try {
    const usuario = (req as any).usuario;
    const mensagens = await prisma.mensagem.findMany({
      where: {
        OR: [
          { idUsuarioReceptor: usuario.id },
          { idUsuarioEmissor: usuario.id }
        ]
      },
      include: {
        usuarioEmissor: { select: { id: true, nome: true, email: true, } },
        usuarioReceptor: { select: { id: true, nome: true, email: true, } }
      },
      orderBy: {
        dataEnvio: 'desc'
      }
    })

    return res.status(200).json({ mensagens });

  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno do servidor' });
  }
})

router.get('/mensagens/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }
    const usuario = (req as any).usuario;

    const mensagem = await prisma.mensagem.findUnique({
      where: {
        id
      }
    })

    if (!mensagem || (mensagem.idUsuarioEmissor !== usuario.id && mensagem.idUsuarioReceptor !== usuario.id && !usuario.isAdmin)) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar essa mensagem' });
    }


    return res.status(200).json({ mensagem });

  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar a mensagem: ${error instanceof Error ? error.message : error}` });

  }
})

router
.delete('/mensagens/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }
    const usuario = (req as any).usuario;

    const mensagem = await prisma.mensagem.findUnique({
      where: {
        id
      }
    })

    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem não foi encontrada' });
    }

    if ((mensagem.idUsuarioEmissor !== usuario.id && mensagem.idUsuarioReceptor !== usuario.id && !usuario.isAdmin)) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar essa mensagem' });
    }


    return res.status(200).json({ message: 'Mensagem excluída com sucesso', mensagem })

  } catch (error) {
    return res.status(500).json({ message: `Erro ao excluir mensagem: ${error instanceof Error ? error.message : error}` });
  }
})

export default router;