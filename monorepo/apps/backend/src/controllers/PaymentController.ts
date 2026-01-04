import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class PaymentController extends BaseController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      const idPedido = Number(req.params.idPedido);
      const usuario = this.getUsuario(req);

      if (isNaN(idPedido)) {
        return this.sendError(res, 400, 'ID do pedido inválido');
      }

      const where = usuario.isAdmin ? { idPedido } : { idPedido, idUsuario: usuario.id };

      const pagamento = await this.prisma.pagamento.findFirst({
        where
      });

      if (!pagamento) {
        return this.sendError(res, 404, 'Pagamento não encontrado para esse pedido');
      }

      return this.sendSuccess(res, 200, { pagamento });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar pagamento', error);
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const pagamento = await this.prisma.pagamento.findFirst({
        where: { id }
      });

      if (!pagamento) {
        return this.sendError(res, 404, 'Status do pagamento não encontrado.');
      }

      return this.sendSuccess(res, 200, pagamento);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar pagamento', error);
    }
  }

  async store(req: Request, res: Response): Promise<Response> {
    try {
      const { idPedido, valor, metodoPagamento } = req.body;
      const usuario = this.getUsuario(req);

      const pedido = await this.prisma.pedido.findUnique({
        where: { id: idPedido }
      });

      if (!pedido) {
        return this.sendError(res, 404, 'Pedido não encontrado');
      }

      if (pedido.idComprador !== usuario.id) {
        return this.sendError(res, 403, 'Você não pode pagar esse pedido');
      }

      const pagamento = await this.prisma.pagamento.create({
        data: {
          idPedido,
          valor,
          metodoPagamento,
          status: 'PAGO',
          idUsuario: usuario.id
        }
      });

      await this.prisma.pedido.update({
        where: { id: idPedido },
        data: { status: 'PAGO' }
      });

      return this.sendSuccess(res, 201, { pagamento }, 'Pagamento realizado com sucesso');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao registrar pagamento', error);
    }
  }
}

