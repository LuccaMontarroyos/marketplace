import { Request, Response } from 'express';
import { z } from 'zod';
import { BaseController } from './BaseController';

const favoritoSchema = z.object({
  idProduto: z.number().int().positive(),
});

export class FavoriteController extends BaseController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);

      const favoritos = await this.prisma.favorito.findMany({
        where: { idUsuario: usuario.id },
        include: { produto: true }
      });

      return this.sendSuccess(res, 200, { favoritos }, 'Favoritos encontrados');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar produtos favoritos', error);
    }
  }

  async store(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);

      const parseResult = favoritoSchema.safeParse(req.body);
      if (!parseResult.success) {
        return this.sendError(res, 400, 'Dados inválidos', parseResult.error.format());
      }

      const { idProduto } = parseResult.data;

      const favoritoExistente = await this.prisma.favorito.findFirst({
        where: {
          idUsuario: usuario.id,
          idProduto
        }
      });

      if (favoritoExistente) {
        return this.sendError(res, 400, 'Produto já está nos favoritos');
      }

      const novoFavorito = await this.prisma.favorito.create({
        data: {
          idUsuario: usuario.id,
          idProduto
        }
      });

      return this.sendSuccess(res, 201, { favorito: novoFavorito }, 'Produto adicionado aos favoritos');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao adicionar produto aos favoritos', error);
    }
  }

  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);
      const idProduto = Number(req.params.idProduto);

      if (isNaN(idProduto)) {
        return this.sendError(res, 400, 'ID de produto inválido');
      }

      const favorito = await this.prisma.favorito.findFirst({
        where: {
          idUsuario: usuario.id,
          idProduto
        }
      });

      if (!favorito) {
        return this.sendError(res, 404, 'Produto não encontrado nos favoritos');
      }

      await this.prisma.favorito.delete({
        where: { id: favorito.id }
      });

      return this.sendSuccess(res, 200, null, 'Produto removido dos favoritos');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao remover produto dos favoritos', error);
    }
  }
}

