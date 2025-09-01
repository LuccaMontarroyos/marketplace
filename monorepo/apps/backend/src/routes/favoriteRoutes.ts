import { Router, Request, Response } from "express";
import { z } from "zod";
import { usuarioAutenticado } from "../middlewares/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = Router();

const favoritoSchema = z.object({
    idProduto: z.number().int().positive(),
});

router.post('/favoritos', usuarioAutenticado, async (req: Request, res: Response) => {
    try {
        const usuario = (req as any).usuario;

        const parseResult = favoritoSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ message: 'Dados inválidos', errors: parseResult.error.format() });
        }

        const { idProduto } = parseResult.data;

        const favoritoExistente = await prisma.favorito.findFirst({
            where: {
                idUsuario: usuario.id,
                idProduto,
            },
        });

        if (favoritoExistente) {
            return res.status(400).json({ message: 'Produto já está nos favoritos' });
        }

        const novoFavorito = await prisma.favorito.create({
            data: {
                idUsuario: usuario.id,
                idProduto,
            },
        });

        return res.status(201).json({ message: 'Produto adicionado aos favoritos', favorito: novoFavorito });
    } catch (error) {
        return res.status(500).json({ message: `Erro ao adicionar produot aos favoritos: ${error instanceof Error ? error.message : error}` });

    }
});

router.get('/favoritos', usuarioAutenticado, async (req: Request, res: Response) => {
    try {
        const usuario = (req as any).usuario;

        const favoritos = await prisma.favorito.findMany({
            where: { idUsuario: usuario.id },
            include: { produto: true },
        });

        return res.status(200).json({ message: 'Favoritos encontrados', favoritos });
    } catch (error) {
        return res.status(500).json({ message: `Erro ao buscar produtos favoritos: ${error instanceof Error ? error.message : error}` });
    }
});

router.delete('/favoritos/:idProduto', usuarioAutenticado, async (req: Request, res: Response) => {
    try {
        const usuario = (req as any).usuario;
        const idProduto = Number(req.params.idProduto);

        if (isNaN(idProduto)) {
            return res.status(400).json({ message: 'ID de produto inválido' });
        }


        const favorito = await prisma.favorito.findFirst({
            where: {
                idUsuario: usuario.id,
                idProduto,
            },
        });

        if (!favorito) {
            return res.status(404).json({ message: 'Produto não encontrado nos favoritos' });
        }


        await prisma.favorito.delete({
            where: {
                id: favorito.id,
            },
        });

        return res.status(200).json({ message: 'Produto removido dos favoritos' });
    } catch (error) {
        return res.status(500).json({ message: `Erro ao remover produto dos favoritos: ${error instanceof Error ? error.message : error}` });
    }
});


export default router;