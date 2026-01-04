import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { v4 as uuidv4 } from 'uuid';

export class CartController extends BaseController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      let sessionId = this.getSessionId(req);
      const usuario = this.getUsuario(req);

      if (!usuario?.id && !sessionId) {
        sessionId = uuidv4();
        (res as any).cookie("sessionId", sessionId, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
      }

      if (!usuario?.id && !sessionId) {
        return this.sendError(res, 400, 'Usuário não autenticado e sem sessionId válido');
      }

      const agora = new Date();
      const carrinho = await this.prisma.carrinho.findMany({
        where: {
          OR: [
            { idUsuario: usuario?.id || undefined },
            { sessionId: sessionId || undefined }
          ],
          dataExpiracao: { gt: agora }
        },
        include: {
          produto: {
            include: { imagens: true }
          },
          usuario: true
        }
      });

      const carrinhoComImagens = carrinho.map(item => ({
        ...item,
        produto: {
          ...item.produto,
          imagens: item.produto.imagens.map(img => ({
            ...img,
            url: `${process.env.BACKEND_URL}${encodeURI(img.url)}`
          }))
        }
      }));

      return this.sendSuccess(res, 200, carrinhoComImagens);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar produtos do carrinho', error);
    }
  }

  async store(req: Request, res: Response): Promise<Response> {
    try {
      const { idProduto, quantidade } = req.body;
      const sessionId = this.getSessionId(req);
      const idUsuario = this.getUsuario(req)?.id;

      if (!idUsuario && !sessionId) {
        return this.sendError(res, 400, 'Usuário não autenticado e sem sessionId válido');
      }

      const produto = await this.prisma.produto.findUnique({
        where: { id: idProduto }
      });

      if (!produto) {
        return this.sendError(res, 404, 'Produto não encontrado');
      }

      const dataExpiracao = new Date();
      dataExpiracao.setHours(dataExpiracao.getHours() + 24);

      const carrinhoExistente = await this.prisma.carrinho.findFirst({
        where: {
          idProduto,
          OR: [
            ...(idUsuario ? [{ idUsuario }] : []),
            ...(sessionId ? [{ sessionId }] : [])
          ]
        }
      });

      let carrinho;
      if (carrinhoExistente) {
        carrinho = await this.prisma.carrinho.update({
          where: { id: carrinhoExistente.id },
          data: {
            quantidade: { increment: quantidade },
            dataExpiracao
          }
        });
      } else {
        carrinho = await this.prisma.carrinho.create({
          data: {
            idUsuario: idUsuario || null,
            sessionId: sessionId || null,
            idProduto,
            quantidade,
            precoAtual: produto.preco,
            dataExpiracao
          }
        });
      }

      return this.sendSuccess(res, 200, carrinho);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao adicionar produtos no carrinho', error);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { idProduto, quantidade } = req.body;
      const idUsuario = this.getUsuario(req)?.id;
      const sessionId = this.getSessionId(req);

      if (typeof idProduto !== "number" || typeof quantidade !== "number") {
        return this.sendError(res, 400, 'idProduto e quantidade devem ser números');
      }

      if (quantidade < 0) {
        return this.sendError(res, 400, 'Quantidade inválida');
      }

      if (!idUsuario && !sessionId) {
        return this.sendError(res, 400, 'Usuário não autenticado e sem sessionId válido');
      }

      const whereFiltro: any = { idProduto };
      if (idUsuario) {
        whereFiltro.idUsuario = idUsuario;
      } else {
        whereFiltro.sessionId = sessionId;
      }

      const carrinhoExistente = await this.prisma.carrinho.findFirst({
        where: whereFiltro
      });

      if (!carrinhoExistente) {
        return this.sendError(res, 404, 'Item do carrinho não encontrado');
      }

      if (quantidade === 0) {
        await this.prisma.carrinho.delete({
          where: { id: carrinhoExistente.id }
        });
        return this.sendSuccess(res, 200, null, 'Produto removido do carrinho');
      }

      const carrinhoAtualizado = await this.prisma.carrinho.update({
        where: { id: carrinhoExistente.id },
        data: { quantidade }
      });

      return this.sendSuccess(res, 200, carrinhoAtualizado);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao atualizar carrinho', error);
    }
  }

  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);
      const sessionId = this.getSessionId(req);
      const idProduto = Number(req.params.idProduto);

      if (isNaN(idProduto)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      if (!usuario?.id && !sessionId) {
        return this.sendError(res, 400, 'Usuário não autenticado e sem sessionId válido');
      }

      const whereFiltro: any = { idProduto };
      if (usuario?.id) whereFiltro.idUsuario = Number(usuario.id);
      else if (sessionId) whereFiltro.sessionId = sessionId;
      else return this.sendError(res, 400, 'Usuário não autenticado e sem sessionId válido');

      const itemCarrinho = await this.prisma.carrinho.findFirst({ where: whereFiltro });
      if (!itemCarrinho) {
        return this.sendError(res, 404, 'Item do carrinho não encontrado');
      }

      await this.prisma.carrinho.delete({
        where: { id: itemCarrinho.id }
      });

      return this.sendSuccess(res, 200, null, 'Produto removido do carrinho');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao excluir do carrinho', error);
    }
  }

  static async limparCarrinhosExpirados() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const agora = new Date();
      await prisma.carrinho.deleteMany({
        where: {
          dataExpiracao: { lte: agora }
        }
      });
    } catch (error) {
      throw new Error("Erro ao limpar produtos do carrinho.");
    } finally {
      await prisma.$disconnect();
    }
  }
}

