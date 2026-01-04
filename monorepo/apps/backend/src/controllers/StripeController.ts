import { Request, Response } from 'express';
import Stripe from 'stripe';
import { BaseController } from './BaseController';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export class StripeController extends BaseController {
  async createAccount(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.getUsuario(req).id;

      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });

      if (!usuario) {
        return this.sendError(res, 404, 'Usuário não encontrado.');
      }

      if (usuario.stripeAccountId) {
        return this.sendError(res, 400, 'Usuário já possui conta no Stripe.');
      }

      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        email: usuario.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });

      await this.prisma.usuario.update({
        where: { id: usuarioId },
        data: { stripeAccountId: account.id, isVendedor: true }
      });

      return this.sendSuccess(res, 200, { stripeAccountId: account.id }, 'Conta criada com sucesso.');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao criar conta no Stripe', error);
    }
  }

  async getAccountLink(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = this.getUsuario(req).id;

      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });

      if (!usuario || !usuario.stripeAccountId) {
        return this.sendError(res, 404, 'Conta Stripe não encontrada para este usuário.');
      }

      const accountLink = await stripe.accountLinks.create({
        account: usuario.stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL}/stripe/onboarding/erro`,
        return_url: `${process.env.FRONTEND_URL}/stripe/onboarding/sucesso`,
        type: "account_onboarding"
      });

      return this.sendSuccess(res, 200, { url: accountLink.url });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao gerar link de onboarding.', error);
    }
  }

  async getAccountStatus(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUsuario(req);
      if (!user.stripeAccountId) {
        return this.sendError(res, 400, 'Usuário não possui conta no Stripe.');
      }

      const account = await stripe.accounts.retrieve(user.stripeAccountId);

      return this.sendSuccess(res, 200, {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements?.currently_due
      });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao consultar status da conta Stripe.', error);
    }
  }

  async getPayouts(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUsuario(req);
      if (!user.stripeAccountId) {
        return this.sendError(res, 400, 'Usuário não possui conta Stripe.');
      }

      const payouts = await stripe.payouts.list(
        { limit: 10 },
        { stripeAccount: user.stripeAccountId }
      );

      return this.sendSuccess(res, 200, payouts.data);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar repasses.', error);
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<Response> {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return this.sendError(res, 400, `Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.payment_status !== "paid") {
            return this.sendSuccess(res, 200, { received: true });
          }

          const pedidoIdStr = session.metadata?.pedidoId;
          if (!pedidoIdStr) {
            return this.sendError(res, 400, 'pedidoId ausente no metadata');
          }

          const pedidoId = Number(pedidoIdStr);

          await this.prisma.$transaction(async (tx) => {
            const pedido = await tx.pedido.findUnique({
              where: { id: pedidoId },
              include: { PedidoProduto: true }
            });

            if (!pedido) throw new Error("Pedido não encontrado");

            if (pedido.status === "PAGO") return;

            await tx.pagamento.updateMany({
              where: { idPedido: pedido.id },
              data: { status: "PAGO" }
            });

            await tx.pedido.update({
              where: { id: pedido.id },
              data: { status: "PAGO" }
            });

            for (const item of pedido.PedidoProduto) {
              await tx.produto.update({
                where: { id: item.idProduto },
                data: { qtdEstoque: { decrement: item.quantidade } }
              });
            }

            await tx.carrinho.deleteMany({
              where: {
                OR: [
                  { idUsuario: pedido.idComprador || undefined },
                  { sessionId: pedido.sessionId || undefined }
                ]
              }
            });
          });

          break;
        }

        case "checkout.session.expired":
        case "payment_intent.payment_failed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const pedidoIdStr = session.metadata?.pedidoId;
          if (pedidoIdStr) {
            await this.prisma.pagamento.updateMany({
              where: { idPedido: Number(pedidoIdStr) },
              data: { status: "CANCELADO" }
            });
          }
          break;
        }

        default:
          break;
      }

      return this.sendSuccess(res, 200, { received: true });

    } catch (err) {
      return this.sendError(res, 500, 'Erro ao processar webhook', err);
    }
  }
}

