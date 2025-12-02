import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { usuarioAutenticado } from "../middlewares/auth";
import { PrismaClient } from "@prisma/client";
import express from 'express';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const router = Router();

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

    const account = await stripe.accounts.create({
      type: "express",
      country: "BR",
      email: usuario.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { stripeAccountId: account.id, isVendedor: true }
    });

    return res.json({ mensagem: "Conta criada com sucesso.", stripeAccountId: account.id });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: `Erro ao criar conta no Stripe: ${erro}` });
  }
});

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
      refresh_url: `${process.env.FRONTEND_URL}/stripe/onboarding/erro`,
      return_url: `${process.env.FRONTEND_URL}/stripe/onboarding/sucesso`,
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
          await prisma.pagamento.updateMany({
            where: { idPedido: Number(pedidoIdStr) },
            data: { status: "CANCELADO" }
          });
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Erro ao processar webhook:", err);
    res.status(500).send("Erro ao processar webhook");
  }
});


export default router;
