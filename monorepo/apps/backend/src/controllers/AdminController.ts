import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class AdminController extends BaseController {
  async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await this.prisma.usuario.findMany({
        include: {
          avaliacoes: true,
          pedidos: true,
          produtos: true
        },
        orderBy: { nome: 'asc' }
      });

      return this.sendSuccess(res, 200, { usuarios });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar por usuários', error);
    }
  }

  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const usuarioExiste = await this.prisma.usuario.findUnique({
        where: { id }
      });

      if (!usuarioExiste) {
        return this.sendError(res, 404, 'Usuário não encontrado');
      }

      const usuarioExcluido = await this.prisma.usuario.delete({
        where: { id }
      });

      return this.sendSuccess(res, 200, { usuario: usuarioExcluido }, 'Usuário excluído com sucesso');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao excluir usuário', error);
    }
  }
}

