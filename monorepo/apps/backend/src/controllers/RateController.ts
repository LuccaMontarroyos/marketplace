import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class RateController extends BaseController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      const idProduto = Number(req.params.idProduto);
      if (isNaN(idProduto)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const avaliacoes = await this.prisma.avaliacao.findMany({
        where: { idProduto },
        orderBy: { dataAvaliacao: 'desc' },
        include: { produto: true }
      });

      if (avaliacoes.length === 0) {
        return this.sendError(res, 404, 'Não foi encontrada nenhuma avaliação sobre este produto');
      }

      return this.sendSuccess(res, 200, { avaliacoes });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar pelas avaliações do produto', error);
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const avaliacao = await this.prisma.avaliacao.findUnique({
        where: { id },
        include: { produto: true }
      });

      if (!avaliacao) {
        return this.sendError(res, 404, 'Avaliação não encontrada');
      }

      return this.sendSuccess(res, 200, avaliacao);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar avaliação', error);
    }
  }

  async store(req: Request, res: Response): Promise<Response> {
    try {
      const { idProduto, avaliacao, comentario } = req.body;

      if (avaliacao < 0 || avaliacao > 5) {
        return this.sendError(res, 400, 'A avaliação deve estar entre 0 à 5');
      }

      const usuario = this.getUsuario(req);

      const produtoExiste = await this.prisma.produto.findUnique({
        where: { id: idProduto }
      });

      if (!produtoExiste) {
        return this.sendError(res, 404, 'Não foi possível encontrar o produto');
      }

      const novaAvaliacao = await this.prisma.avaliacao.create({
        data: {
          idProduto,
          idUsuario: usuario.id,
          avaliacao,
          comentario
        },
        include: { produto: true }
      });

      return this.sendSuccess(res, 201, { avaliacao: novaAvaliacao }, 'Avaliação feita com sucesso!');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao criar avaliação', error);
    }
  }

  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const usuario = this.getUsuario(req);

      const avaliacao = await this.prisma.avaliacao.findUnique({
        where: { id },
        include: { produto: true }
      });

      if (!avaliacao) {
        return this.sendError(res, 404, 'Não foi possível encontrar avaliacao');
      }

      if (usuario.id !== avaliacao.idUsuario && !usuario.isAdmin) {
        return this.sendError(res, 403, 'Você não tem permissão para excluir essa avaliação');
      }

      await this.prisma.avaliacao.delete({
        where: { id }
      });

      return this.sendSuccess(res, 200, { avaliacao }, 'Avaliação excluída com sucesso!');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao excluir avaliação', error);
    }
  }
}

