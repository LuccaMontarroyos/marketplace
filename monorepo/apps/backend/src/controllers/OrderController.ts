import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export class OrderController extends BaseController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);
      const { idComprador } = req.query;

      let whereClause = usuario.isAdmin 
        ? (idComprador ? { idComprador: Number(idComprador) } : {}) 
        : { idComprador: usuario.id };

      const pedidos = await this.prisma.pedido.findMany({
        where: whereClause,
        include: {
          PedidoProduto: {
            include: { produto: true }
          }
        }
      });

      return this.sendSuccess(res, 200, { pedidos });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar pedidos', error);
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const usuario = this.getUsuario(req);

      const pedido = await this.prisma.pedido.findUnique({
        where: { id },
        include: {
          PedidoProduto: {
            include: { produto: true }
          },
          Pagamento: true,
          comprador: {
            select: { id: true, nome: true, email: true }
          }
        }
      });

      if (!pedido) {
        return this.sendError(res, 404, 'Pedido não encontrado');
      }

      const isComprador = pedido.idComprador === usuario.id;
      const isVendedor = pedido.PedidoProduto.some(item => item.produto.idVendedor === usuario.id);

      if (!isComprador && !isVendedor && !usuario.isAdmin) {
        return this.sendError(res, 403, 'Acesso negado');
      }

      return this.sendSuccess(res, 200, pedido);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar pedido', error);
    }
  }

  async store(req: Request, res: Response): Promise<Response> {
    try {
      const { idEndereco, tipoEnvio, metodoPagamento } = req.body;
      const idComprador = this.getUsuario(req)?.id;
      const sessionId = this.getSessionId(req);

      if (!idComprador && !sessionId) {
        return this.sendError(res, 400, 'Usuário não autenticado e sem sessionId válido');
      }

      const metodosValidos = ['cartao', 'pix', 'boleto'];
      if (!(metodosValidos.includes(metodoPagamento))) {
        return this.sendError(res, 400, 'Método de pagamento inválido');
      }

      const endereco = await this.prisma.endereco.findFirst({
        where: {
          OR: [
            { id: idEndereco, idUsuario: idComprador || undefined },
            { id: idEndereco, sessionId: sessionId || undefined }
          ]
        }
      });

      if (!endereco) {
        return this.sendError(res, 400, 'Endereço inválido');
      }

      const carrinho = await this.prisma.carrinho.findMany({
        where: {
          OR: [
            { idUsuario: idComprador || undefined },
            { sessionId: sessionId || undefined }
          ]
        },
        include: { produto: true }
      });

      if (!carrinho.length) {
        return this.sendError(res, 400, 'Carrinho vazio');
      }

      for (const item of carrinho) {
        if (item.produto.qtdEstoque < item.quantidade) {
          return this.sendError(res, 400, `Produto ${item.produto.nome} sem estoque suficiente`);
        }
      }

      const diasEntrega = (tipoEnvio === 'expresso') ? 5 : 12;

      const pedido = await this.prisma.pedido.create({
        data: {
          idComprador: idComprador || null,
          sessionId: sessionId || null,
          status: 'PENDENTE',
          idEnderecoEntrega: idEndereco,
          dataEntregaEstimada: new Date(Date.now() + diasEntrega * 24 * 60 * 60 * 1000)
        }
      });

      const valorTotal = carrinho.reduce((acc, item) => acc + item.precoAtual.toNumber() * item.quantidade, 0);

      const pagamento = await this.prisma.pagamento.create({
        data: {
          idPedido: pedido.id,
          valor: valorTotal,
          metodoPagamento,
          status: 'PENDENTE',
          idUsuario: idComprador || null
        }
      });

      await this.prisma.pedidoProduto.createMany({
        data: carrinho.map(item => ({
          idPedido: pedido.id,
          idProduto: item.idProduto,
          quantidade: item.quantidade,
          precoUnitario: item.precoAtual
        }))
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: metodoPagamento === 'cartao' ? ['card'] : metodoPagamento === 'boleto' ? ['boleto'] : ['pix'],
        line_items: carrinho.map(item => ({
          price_data: {
            currency: 'brl',
            product_data: { name: item.produto.nome },
            unit_amount: Math.round(item.precoAtual.toNumber() * 100)
          },
          quantity: item.quantidade
        })),
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/pagamento-sucesso?pedidoId=${pedido.id}`,
        cancel_url: `${process.env.FRONTEND_URL}/pagamento-cancelado?pedidoId=${pedido.id}`,
        metadata: {
          pedidoId: pedido.id.toString(),
          sessionId: sessionId ?? '',
          idComprador: idComprador ? idComprador.toString() : ''
        }
      });

      return this.sendSuccess(res, 201, {
        pedidoId: pedido.id,
        pagamentoId: pagamento.id,
        valorTotal,
        metodoPagamento,
        checkoutUrl: session.url,
      });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao criar pedido', error);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const { statusPedido } = req.body;
      const usuario = this.getUsuario(req);

      if (!statusPedido) {
        return this.sendError(res, 400, 'O Status do pedido é obrigatório');
      }

      const pedido = await this.prisma.pedido.findUnique({
        where: { id },
        include: {
          PedidoProduto: {
            include: { produto: true }
          }
        }
      });

      if (!pedido) {
        return this.sendError(res, 404, 'Pedido não encontrado');
      }

      const isVendedorDoPedido = pedido.PedidoProduto.some(pp => pp.produto.idVendedor === usuario.id);

      if (!usuario.isAdmin && !isVendedorDoPedido) {
        return this.sendError(res, 403, 'Você não tem permissão para atualizar esse pedido');
      }

      const pedidoAtualizado = await this.prisma.pedido.update({
        where: { id },
        data: { status: statusPedido }
      });

      return this.sendSuccess(res, 200, { pedido: pedidoAtualizado }, 'Status do pedido atualizado com sucesso');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao atualizar pedido', error);
    }
  }

  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const usuario = this.getUsuario(req);

      const pedido = await this.prisma.pedido.findUnique({
        where: { id }
      });

      if (!pedido) {
        return this.sendError(res, 404, 'Pedido não encontrado');
      }

      if (pedido.status === 'ENVIADO' || pedido.status === 'ENTREGUE') {
        return this.sendError(res, 403, 'Você não pode cancelar um pedido que foi enviado');
      }

      if (usuario.id === pedido.idComprador || usuario.isAdmin) {
        await this.prisma.pedidoProduto.deleteMany({
          where: { idPedido: id }
        });

        const pedidoCancelado = await this.prisma.pedido.delete({
          where: { id }
        });

        return this.sendSuccess(res, 200, { pedido: pedidoCancelado }, 'Pedido cancelado com sucesso');
      } else {
        return this.sendError(res, 403, 'Você não tem permissão para cancelar esse pedido');
      }

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao cancelar pedido', error);
    }
  }

  async getByBuyer(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.getUsuario(req).id;

      const pedidos = await this.prisma.pedido.findMany({
        where: { idComprador: usuarioId },
        include: {
          PedidoProduto: {
            include: {
              produto: {
                select: { id: true, nome: true, preco: true }
              }
            }
          },
          Pagamento: {
            where: { status: "PAGO" }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return this.sendSuccess(res, 200, pedidos);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar pedidos do comprador', error);
    }
  }

  async getBySeller(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.getUsuario(req).id;

      const pedidos = await this.prisma.pedido.findMany({
        where: {
          PedidoProduto: {
            some: {
              produto: { idVendedor: usuarioId }
            }
          }
        },
        include: {
          PedidoProduto: {
            include: {
              produto: {
                select: { id: true, nome: true, preco: true }
              }
            }
          },
          Pagamento: {
            where: { status: "PAGO" }
          },
          comprador: {
            select: { id: true, nome: true, email: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return this.sendSuccess(res, 200, pedidos);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar pedidos do vendedor', error);
    }
  }

  async getPaidBySeller(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);

      const pedidos = await this.prisma.pedido.findMany({
        where: {
          PedidoProduto: {
            some: {
              produto: { idVendedor: usuario.id }
            }
          },
          status: 'PAGO'
        },
        include: {
          PedidoProduto: {
            include: { produto: true }
          },
          comprador: true,
          enderecoEntrega: true
        }
      });

      return this.sendSuccess(res, 200, { pedidos });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar pedidos pagos', error);
    }
  }

  async reorder(req: Request, res: Response): Promise<Response> {
    try {
      const idPedido = Number(req.body.idPedido);
      const usuario = this.getUsuario(req);

      const pedido = await this.prisma.pedido.findUnique({
        where: { id: idPedido },
        include: { PedidoProduto: true }
      });

      if (!pedido || pedido.idComprador !== usuario.id) {
        return this.sendError(res, 403, 'Você não pode refazer esse pedido');
      }

      for (const item of pedido.PedidoProduto) {
        const carrinhoExistente = await this.prisma.carrinho.findFirst({
          where: {
            idUsuario: usuario.id,
            idProduto: item.idProduto
          }
        });

        if (carrinhoExistente) {
          await this.prisma.carrinho.update({
            where: { id: carrinhoExistente.id },
            data: { quantidade: { increment: item.quantidade } }
          });
        } else {
          await this.prisma.carrinho.create({
            data: {
              idUsuario: usuario.id,
              idProduto: item.idProduto,
              quantidade: item.quantidade,
              precoAtual: item.precoUnitario,
              dataExpiracao: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          });
        }
      }

      return this.sendSuccess(res, 200, null, 'Pedido adicionado novamente ao carrinho!');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao refazer pedido', error);
    }
  }
}

