import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class MessageController extends BaseController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);

      const mensagens = await this.prisma.mensagem.findMany({
        where: {
          OR: [
            { idUsuarioReceptor: usuario.id },
            { idUsuarioEmissor: usuario.id }
          ]
        },
        include: {
          usuarioEmissor: { select: { id: true, nome: true, email: true } },
          usuarioReceptor: { select: { id: true, nome: true, email: true } }
        },
        orderBy: { dataEnvio: 'desc' }
      });

      return this.sendSuccess(res, 200, { mensagens });

    } catch (error) {
      return this.sendError(res, 500, 'Erro interno do servidor', error);
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const usuario = this.getUsuario(req);

      const mensagem = await this.prisma.mensagem.findUnique({
        where: { id }
      });

      if (!mensagem || (mensagem.idUsuarioEmissor !== usuario.id && mensagem.idUsuarioReceptor !== usuario.id && !usuario.isAdmin)) {
        return this.sendError(res, 403, 'Você não tem permissão para acessar essa mensagem');
      }

      return this.sendSuccess(res, 200, { mensagem });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar a mensagem', error);
    }
  }

  async store(req: Request, res: Response): Promise<Response> {
    try {
      const { idUsuarioReceptor, mensagem } = req.body;
      const usuario = this.getUsuario(req);

      const usuarioReceptorExiste = await this.prisma.usuario.findUnique({
        where: { id: idUsuarioReceptor }
      });

      if (!usuarioReceptorExiste) {
        return this.sendError(res, 404, 'Não foi possível enviar a mensagem pois não há usuário receptor');
      }

      const mensagemEnviada = await this.prisma.mensagem.create({
        data: {
          idUsuarioEmissor: usuario.id,
          idUsuarioReceptor,
          mensagem
        }
      });

      return this.sendSuccess(res, 201, { mensagemEnviada }, 'Mensagem enviada com sucesso!');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao enviar mensagem', error);
    }
  }

  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const usuario = this.getUsuario(req);

      const mensagem = await this.prisma.mensagem.findUnique({
        where: { id }
      });

      if (!mensagem) {
        return this.sendError(res, 404, 'Mensagem não foi encontrada');
      }

      if ((mensagem.idUsuarioEmissor !== usuario.id && mensagem.idUsuarioReceptor !== usuario.id && !usuario.isAdmin)) {
        return this.sendError(res, 403, 'Você não tem permissão para acessar essa mensagem');
      }

      await this.prisma.mensagem.delete({
        where: { id }
      });

      return this.sendSuccess(res, 200, { mensagem }, 'Mensagem excluída com sucesso');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao excluir mensagem', error);
    }
  }

  async getConversation(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);
      const idOutroUsuario = Number(req.params.idOutroUsuario);

      if (isNaN(idOutroUsuario)) {
        return this.sendError(res, 400, 'ID de usuário inválido');
      }

      const mensagens = await this.prisma.mensagem.findMany({
        where: {
          OR: [
            { idUsuarioEmissor: usuario.id, idUsuarioReceptor: idOutroUsuario },
            { idUsuarioEmissor: idOutroUsuario, idUsuarioReceptor: usuario.id }
          ]
        },
        include: {
          usuarioEmissor: { select: { id: true, nome: true, email: true } },
          usuarioReceptor: { select: { id: true, nome: true, email: true } }
        },
        orderBy: { dataEnvio: 'asc' }
      });

      return this.sendSuccess(res, 200, { mensagens });

    } catch (error) {
      return this.sendError(res, 500, 'Erro interno do servidor', error);
    }
  }
}

