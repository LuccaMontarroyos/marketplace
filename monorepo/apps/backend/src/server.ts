import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import dotenv from "dotenv";
import { z } from 'zod';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from "../swagger.json";
import { enderecoSchema } from "../../../packages/shared/schemas/enderecos";
import cors from 'cors';
import cookieParser from "cookie-parser";
import Stripe from 'stripe';
import stripeRoutes from './routes/stripeRoutes';
import { usuarioAutenticado, usuarioAutenticadoOpcional, isAdminMiddleware, garantirSessionId } from './middlewares/auth';
import cartRoutes, { limparCarrinhosExpirados } from './routes/cartRoutes';
import productsRoutes, { uploadDir } from './routes/productsRoutes';
import userRoutes from './routes/userRoutes';
import rateRoutes from './routes/rateRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import addressRoutes from './routes/addressRoutes';
import messageRoutes from './routes/messageRoutes';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))

app.use(express.json({ limit: '10mb' }));

console.log(uploadDir);

app.use('/uploads', express.static(uploadDir));

app.use(cookieParser());

app.use("/stripe", stripeRoutes);

app.use(userRoutes);
app.use(cartRoutes);
app.use(rateRoutes);
app.use(productsRoutes);
app.use(favoriteRoutes);
app.use(addressRoutes);
app.use(messageRoutes);


cron.schedule("0 * * * *", async () => {
  console.log("Removendo itens expirados do carrinho...");
  await limparCarrinhosExpirados();
});

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não definida no .env");
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.post('/pedidos', usuarioAutenticadoOpcional, garantirSessionId, async (req, res) => {
  try {
    const { idEndereco, tipoEnvio, metodoPagamento } = req.body;
    const idComprador = (req as any).usuario?.id;
    const sessionId = req.sessionId;

    if (!idComprador && !sessionId) {
      return res.status(400).json({ message: 'Usuário não autenticado e sem sessionId válido' });
    }

    const metodosValidos = ['cartao', 'pix', 'boleto'];
    if (!(metodosValidos.includes(metodoPagamento))) {
      return res.status(400).json({ message: "Método de pagamento inválido" });
    }

    // Buscar carrinho

    
    if (!idEndereco) {
      return res.status(401).json({ error: "Endereço Inválido"})
    }

    const carrinho = await prisma.carrinho.findMany({
      where: {
        OR: [
          { idUsuario: idComprador || undefined },
          { sessionId: sessionId || undefined }
        ]
      },
      include: { produto: true }
    });

    if (!carrinho.length) return res.status(400).json({ message: 'Carrinho vazio' });

    // Validar estoque
    for (const item of carrinho) {
      if (item.produto.qtdEstoque < item.quantidade) {
        return res.status(400).json({ message: `Produto ${item.produto.nome} sem estoque suficiente` });
      }
    }

    const diasEntrega = (tipoEnvio === 'expresso') ? 5 : 12;


    const pedido = await prisma.pedido.create({
      data: {
        idComprador: idComprador || null,
        sessionId: sessionId || null,
        status: 'PENDENTE',
        idEnderecoEntrega: idEndereco,
        dataEntregaEstimada: new Date(Date.now() + diasEntrega * 24 * 60 * 60 * 1000)
      }
    });

    const valorTotal = carrinho.reduce((acc, item) => acc + item.precoAtual.toNumber() * item.quantidade, 0);

    const pagamento = await prisma.pagamento.create({
      data: {
        idPedido: pedido.id,
        valor: valorTotal,
        metodoPagamento,
        status: 'PENDENTE',
        idUsuario: idComprador || null
      }
    });

    // Criar os itens do pedido
    await prisma.pedidoProduto.createMany({
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


    return res.status(201).json({
      pedidoId: pedido.id,
      pagamentoId: pagamento.id,
      valorTotal,
      metodoPagamento,
      checkoutUrl: session.url, 
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Erro ao criar pedido' });
  }
});


// app.post('/pedidos', usuarioAutenticadoOpcional, async (req: Request, res: Response) => {
//   try {
//     const { idEndereco, sessionId, tipoEnvio, metodoPagamento } = req.body;

//     const idComprador = (req as any).usuario?.id;

//     if (!idComprador && !sessionId) {
//       return res.status(400).json({ message: 'Usuário não autenticado e sem sessionId válido' });
//     }

//     const whereClause: any = {};
//     if (idComprador) whereClause.idUsuario = idComprador;
//     if (sessionId) whereClause.sessionId = sessionId;

//     let diasEntrega = 12;
//     if (tipoEnvio === 'expresso') {
//       diasEntrega = 5
//     }

//     if (!metodoPagamento) {
//       return res.status(400).json({ message: "O método do pagamento é obrigatório" });
//     }

//     const carrinho = await prisma.carrinho.findMany({
//       where: whereClause,
//       include: { produto: true }
//     });

//     if (!carrinho.length) {
//       return res.status(400).json({ message: 'Carrinho vazio' });
//     }

//     const produtos = await prisma.produto.findMany({
//       where: { id: { in: carrinho.map((item) => item.idProduto) } }
//     });

//     for (const item of carrinho) {
//       const produto = produtos.find(p => p.id === item.idProduto);
//       if (!produto || produto.qtdEstoque < item.quantidade) {
//         return res.status(400).json({ message: `Produto ${produto?.nome || item.idProduto} sem estoque suficiente` });
//       }
//     }


//     const pedido = await prisma.pedido.create({
//       data: {
//         dataEntregaEstimada: new Date(Date.now() + diasEntrega * 24 * 60 * 60 * 1000),
//         status: "PENDENTE",
//         idComprador: idComprador || null,
//         sessionId: sessionId || null,
//         idEnderecoEntrega: idEndereco
//       }
//     });

//     const valorTotal = carrinho.reduce((acc, item) => acc + item.precoAtual.toNumber() * item.quantidade, 0);


//     const pagamento = await prisma.pagamento.create({
//       data: {
//         idPedido: pedido.id,
//         valor: valorTotal,
//         metodoPagamento,
//         status: 'PENDENTE',
//         idUsuario: idComprador || null
//       }
//     });

//     await prisma.pedidoProduto.createMany({
//       data: carrinho.map((item) => ({
//         idPedido: pedido.id,
//         idProduto: item.idProduto,
//         quantidade: item.quantidade,
//         precoUnitario: item.precoAtual
//       })),
//     });

//     for (const item of carrinho) {
//       await prisma.produto.update({
//         where: { id: item.idProduto },
//         data: { qtdEstoque: { decrement: item.quantidade } }
//       });
//     }


//     await prisma.carrinho.deleteMany({
//       where: {
//         OR: [
//           { idUsuario: idComprador ? idComprador : undefined },
//           { sessionId: sessionId ? sessionId : undefined }
//         ]
//       }
//     });

//     return res.status(201).json({
//       message: 'Pedido criado com sucesso! Prossiga com o pagamento.',
//       pedidoId: pedido.id,
//       pagamentoId: pagamento.id,
//       valorTotal,
//       metodoPagamento,
//       prazoDeEntrega: `O prazo de entrega é em ${diasEntrega} dias`,
//       paymentUrl // URL mockada para simular integração
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error instanceof Error ? error.message : `Erro ao fazer pedido: ${error}` });
//   }
// });

app.post('/pedidos/refazer', usuarioAutenticado, async (req: Request, res: Response) => {
  const idPedido = Number(req.body.idPedido);
  const usuario = (req as any).usuario;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: idPedido },
      include: { PedidoProduto: true }
    });

    if (!pedido || pedido.idComprador !== usuario.id) {
      return res.status(403).json({ message: 'Você não pode refazer esse pedido' });
    }

    for (const item of pedido.PedidoProduto) {
      const carrinhoExistente = await prisma.carrinho.findFirst({
        where: {
          idUsuario: usuario.id,
          idProduto: item.idProduto
        }
      });

      if (carrinhoExistente) {
        await prisma.carrinho.update({
          where: { id: carrinhoExistente.id },
          data: { quantidade: { increment: item.quantidade } }
        });
      } else {
        await prisma.carrinho.create({
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

    return res.status(200).json({ message: 'Pedido adicionado novamente ao carrinho!' });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro ao refazer pedido' });
  }
});

// GET /stripe/account-status
app.get("/stripe/account-status", usuarioAutenticado, async (req, res) => {
  try {
    const user = (req as any).usuario;
    if (!user.stripeAccountId) {
      return res.status(400).json({ error: "Usuário não possui conta no Stripe." });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    return res.json({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements?.currently_due,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao consultar status da conta Stripe." });
  }
});

// GET /stripe/payouts
app.get("/stripe/payouts", usuarioAutenticado, async (req, res) => {
  try {
    const user = (req as any).usuario;
    if (!user.stripeAccountId) {
      return res.status(400).json({ error: "Usuário não possui conta Stripe." });
    }

    const payouts = await stripe.payouts.list(
      {limit: 10},
      {stripeAccount: user.stripeAccountId,});

    res.json(payouts.data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar repasses." });
  }
});

app.get('/pedidos/comprador', usuarioAutenticado, async (req: Request, res: Response) => {
  const usuarioId = (req as any).usuario.id
  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        idComprador: usuarioId,
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
          where: {
            status: "PAGO"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar pedidos do comprador" });
  }
});

// GET /pedidos/vendedor
app.get("/pedidos/vendedor", usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).usuario.id;
    const pedidos = await prisma.pedido.findMany({
      where: {
        PedidoProduto: {
          some: {
            produto: {
              idVendedor: usuarioId
            }
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
          where: {
            status: "PAGO"
          }
        },
        comprador: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar pedidos do vendedor" });
  }
});

// GET /pedidos/:id
app.get("/pedidos/:id", usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const usuarioId = (req as any).usuario.id;
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        PedidoProduto: {
          include: {
            produto: true
          }
        },
        Pagamento: true,
        comprador: {
          select: { id: true, nome: true, email: true }
        }
      },
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }


    const isComprador = pedido.idComprador === usuarioId;
    const isVendedor = pedido.PedidoProduto.some(item => item.produto.idVendedor === usuarioId);

    if (!isComprador && !isVendedor) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    res.json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});


app.get('/pedidos', usuarioAutenticado, async (req: Request, res: Response) => {

  try {
    const usuario = (req as any).usuario;

    const { idComprador } = req.query;

    let whereClause = usuario.isAdmin ? (idComprador ? { idComprador: Number(idComprador) } : {}) : { idComprador: usuario.id };

    const pedidos = await prisma.pedido.findMany({
      where: whereClause,
      include: {
        PedidoProduto: {
          include: {
            produto: true,
          }
        }
      }
    });

    return res.status(200).json({ pedidos });

  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar pedidos: ${error instanceof Error ? error.message : error}` });
  }
})

app.get('/pedidos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }
  const usuario = (req as any).usuario;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: {
        id
      },
      include: {
        PedidoProduto: {
          include: {
            produto: true
          }
        }
      }
    })

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (usuario.id === pedido.idComprador || usuario.isAdmin) {
      return res.status(200).json({ message: 'Pedido encontrado', pedido });
    } else {
      return res.status(403).json({ message: 'Desculpe mas você não pode acessar um pedido que não é seu' })
    }
  } catch (error) {
    return res.status(500).json({ message: `Erro ao procurar pedido: ${error instanceof Error ? error.message : error}` });
  }
})

app.put('/pedidos/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }
  const { statusPedido } = req.body;
  const usuario = (req as any).usuario;

  if (!statusPedido) {
    return res.status(400).json({ message: "O Status do pedido é obrigatório" })
  }

  try {

    const pedido = await prisma.pedido.findUnique({
      where: {
        id
      },
    })

    if (!pedido) {
      return res.status(404).json({ message: 'Não foi possível encontrar o pedido' })
    }


    if (usuario.isAdmin) {
      const pedidoAtualizado = await prisma.pedido.update({
        where: {
          id
        },
        data: {
          status: statusPedido
        }
      })

      return res.status(200).json({ message: 'Pedido atualizado com sucesso', pedido: pedidoAtualizado })
    } else {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar esse pedido' })
    }
  } catch (error) {
    return res.status(500).json({ message: `Erro ao atualizar pedido: ${error instanceof Error ? error.message : error}` });
  }
})

app.delete('/pedidos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }
  const usuario = (req as any).usuario;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: {
        id
      }
    })

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' })
    }

    if (pedido.status === 'ENVIADO' || pedido.status === 'ENTREGUE') {
      return res.status(403).json({ message: 'Voce não pode cancelar um pedido que foi enviado' })
    }

    if (usuario.id === pedido.idComprador || usuario.isAdmin) {

      await prisma.pedidoProduto.deleteMany({
        where: {
          idPedido: id
        }
      });

      const pedidoCancelado = await prisma.pedido.delete({
        where: {
          id
        }
      })

      return res.status(200).json({ message: 'Pedido cancelado com sucesso', pedido: pedidoCancelado })
    } else {
      return res.status(403).json({ message: 'Você não tem permissão para cancelar esse pedido' })
    }

  } catch (error) {
    return res.status(500).json({ message: `Erro ao cancelar pedido: ${error instanceof Error ? error.message : error}` });
  }
})

app.post('/pagamentos/webhook', async (req: Request, res: Response) => {

})

app.get('/pagamentos/:id', usuarioAutenticadoOpcional, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  try {

    const pagamento = await prisma.pagamento.findFirst({
      where: {
        id
      }
    });

    if (!pagamento) {
      return res.status(404).json({ message: "Status do pagamento não encontrado." });
    }

    return res.status(200).json(pagamento)
  } catch (error) {

  }



})



app.get('/admin/usuarios', async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        avaliacoes: true,
        pedidos: true,
        produtos: true
      },
      orderBy: {
        nome: 'asc'
      }
    })

    return res.status(200).json({ usuarios })
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar por usuários: ${error instanceof Error ? error.message : error}` });

  }
})



app.delete('/admin/usuarios/:id', isAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }
    const usuario = (req as any).usuario;

    const usuarioExiste = await prisma.usuario.findUnique({
      where: {
        id
      }
    })

    if (!usuarioExiste) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    const usuarioExcluido = await prisma.usuario.delete({
      where: {
        id
      }
    })

    return res.status(200).json({ message: 'Usuário excluído com sucesso', usuario: usuarioExcluido })
  } catch (error) {
    return res.status(500).json({ message: `Erro ao excluir usuário: ${error instanceof Error ? error.message : error}` });

  }
})

// Rota para visualizar o pagamento de um pedido
app.get('/pagamentos/:idPedido', usuarioAutenticado, async (req: Request, res: Response) => {
  const idPedido = Number(req.params.idPedido);
  const usuario = (req as any).usuario;

  if (isNaN(idPedido)) {
    return res.status(400).json({ message: 'ID do pedido inválido' });
  }

  try {

    const where = usuario.isAdmin ? { idPedido } : { idPedido, idUsuario: usuario.id };

    const pagamento = await prisma.pagamento.findFirst({
      where
    });

    if (!pagamento) {
      return res.status(404).json({ message: 'Pagamento não encontrado para esse pedido' });
    }

    return res.status(200).json({ pagamento });
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar pagamento: ${error instanceof Error ? error.message : error}` });
  }
});


// ✅ Atualização automática do status do pedido após pagamento
app.post('/pagamentos', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const { idPedido, valor, metodoPagamento } = req.body;
    const usuario = (req as any).usuario;

    const pedido = await prisma.pedido.findUnique({
      where: { id: idPedido },
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (pedido.idComprador !== usuario.id) {
      return res.status(403).json({ message: 'Você não pode pagar esse pedido' });
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        idPedido,
        valor,
        metodoPagamento,
        status: 'PAGO',
        idUsuario: usuario.id
      }
    });

    await prisma.pedido.update({
      where: { id: idPedido },
      data: { status: 'PAGO' },
    });

    return res.status(201).json({ message: 'Pagamento realizado com sucesso', pagamento });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : `Erro ao registrar pagamento: ${error}` });
  }
});


// ✅ Permitir que o vendedor atualize o status do pedido se o pedido for de um produto dele
app.put('/pedidos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }
  const { statusPedido } = req.body;
  const usuario = (req as any).usuario;

  if (!statusPedido) {
    return res.status(400).json({ message: "O Status do pedido é obrigatório" })
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        PedidoProduto: {
          include: { produto: true }
        }
      }
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const isVendedorDoPedido = pedido.PedidoProduto.some(pp => pp.produto.idVendedor === usuario.id);

    if (!usuario.isAdmin && !isVendedorDoPedido) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar esse pedido' });
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: { status: statusPedido }
    });

    return res.status(200).json({ message: 'Status do pedido atualizado com sucesso', pedido: pedidoAtualizado });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : `Erro ao atualizar pedido: ${error}` });
  }
});


// ✅ Rota para vendedor listar apenas pedidos pagos dos seus produtos
app.get('/pedidos/vendedor', usuarioAutenticado, async (req: Request, res: Response) => {
  const usuario = (req as any).usuario;

  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        PedidoProduto: {
          some: {
            produto: { idVendedor: usuario.id },
          },
        },
        status: 'PAGO',
      },
      include: {
        PedidoProduto: {
          include: { produto: true },
        },
        comprador: true,
        enderecoEntrega: true
      },
    });

    return res.status(200).json({ pedidos });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro ao buscar pedidos pagos' });
  }
});

export async function criarContaConnect(usuarioId: number) {
  const account = await stripe.accounts.create({
    type: 'express', // para fluxo simples
    country: 'BR',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual', // pode ser company
  });

  // salvar no banco
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { stripeAccountId: account.id }
  });

  return account;
}


export async function gerarLinkOnboarding(accountId: string) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: 'https://seusite.com/onboarding/erro',
    return_url: 'https://seusite.com/onboarding/sucesso',
    type: 'account_onboarding',
  });
  return link.url;
}



app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
