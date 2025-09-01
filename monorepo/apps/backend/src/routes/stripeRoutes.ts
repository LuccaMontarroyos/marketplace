// src/router/striperouter
// .ts
import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { usuarioAutenticado } from "../middlewares/auth";
import { PrismaClient } from "@prisma/client";
import express from 'express';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-07-30.basil"
});

const router = Router();

/**
 * 1️⃣ Criar conta Stripe Connect para o usuário autenticado
 */
router.post("/account", usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).usuario.id;

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    if (usuario.stripeAccountId) {
      return res.status(400).json({ erro: "Usuário já possui conta no Stripe." });
    }

    // Criar conta no Stripe
    const account = await stripe.accounts.create({
      type: "express",
      country: "BR", // Brasil
      email: usuario.email,
      capabilities: {
        transfers: { requested: true }
      }
    });

    // Salvar ID no banco
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { stripeAccountId: account.id }
    });

    return res.json({ mensagem: "Conta criada com sucesso.", stripeAccountId: account.id });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao criar conta no Stripe." });
  }
});

/**
 * 2️⃣ Gerar link de onboarding para o vendedor finalizar cadastro no Stripe
 */
router.get("/account-link", usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).usuario.id;

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario || !usuario.stripeAccountId) {
      return res.status(404).json({ erro: "Conta Stripe não encontrada para este usuário." });
    }

    const accountLink = await stripe.accountLinks.create({
      account: usuario.stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL}/stripe/onboarding/erro`, // URL para caso o vendedor interrompa o cadastro
      return_url: `${process.env.FRONTEND_URL}/stripe/onboarding/sucesso`, // URL após finalizar o cadastro
      type: "account_onboarding"
    });

    return res.json({ url: accountLink.url });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao gerar link de onboarding." });
  }
});

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Garante que o pagamento foi liquidado (especialmente p/ métodos assíncronos)
        if (session.payment_status !== "paid") {
          return res.json({ received: true });
        }

        const pedidoIdStr = session.metadata?.pedidoId;
        if (!pedidoIdStr) return res.status(400).send("pedidoId ausente no metadata");
        const pedidoId = Number(pedidoIdStr);

        await prisma.$transaction(async (tx) => {
          const pedido = await tx.pedido.findUnique({
            where: { id: pedidoId },
            include: { PedidoProduto: true }
          });
          if (!pedido) throw new Error("Pedido não encontrado");

          // Idempotência: se já marcado como PAGO, não repete efeitos
          if (pedido.status === "PAGO") return;

          // Atualiza pagamentos -> PAGO
          await tx.pagamento.updateMany({
            where: { idPedido: pedido.id },
            data: { status: "PAGO" }
          });

          // Atualiza pedido -> PAGO
          await tx.pedido.update({
            where: { id: pedido.id },
            data: { status: "PAGO" }
          });

          // Decrementa estoque
          for (const item of pedido.PedidoProduto) {
            await tx.produto.update({
              where: { id: item.idProduto },
              data: { qtdEstoque: { decrement: item.quantidade } }
            });
          }

          // Limpa carrinho desse comprador/sessão
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
        // Marca pagamentos como CANCELADO; Pedido permanece PENDENTE (não existe CANCELADO no enum)
        const session = event.data.object as Stripe.Checkout.Session;
        const pedidoIdStr = session.metadata?.pedidoId;
        if (pedidoIdStr) {
          await prisma.pagamento.updateMany({
            where: { idPedido: Number(pedidoIdStr) },
            data: { status: "CANCELADO" }
          });
          // opcional: manter pedido como PENDENTE; política de negócio pode removê-lo via job/endpoint
        }
        break;
      }

      default:
        // Outros eventos podem ser logados se quiser
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Erro ao processar webhook:", err);
    res.status(500).send("Erro ao processar webhook");
  }
});


export default router;
