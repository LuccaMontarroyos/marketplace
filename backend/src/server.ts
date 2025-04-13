import express, { NextFunction, Request, Response } from 'express';
import { PrismaClient, TipoProduto } from '@prisma/client';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import dotenv from "dotenv";
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from "../swagger.json";
dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 5000;

app.use(express.json());

cron.schedule("0 * * * *", async () => {
  console.log("Removendo itens expirados do carrinho...");
  await limparCarrinhosExpirados();
});

const SECRET_KEY = process.env.JWT || "seu segredo super secreto";

app.get('/', async (req: Request, res: Response) => {
  const products = await prisma.produto.findMany();
  res.status(200).json({ products });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const usuarioAutenticado = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { id: number; email: string; isAdmin: boolean };
    (req as any).usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

const usuarioAutenticadoOpcional = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, SECRET_KEY) as { id: number; email: string; isAdmin: boolean };
      (req as any).usuario = decoded;
    } catch (error) {

    }
  }

  next();
}

export const isAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const usuario = (req as any).usuario;

  if (!usuario || !usuario.isAdmin) {
    return res.status(403).json({ message: 'Acesso negado: usuário não é administrador' });
  }

  next();
};

app.post('/usuarios/cadastro', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, fotoPerfil } = req.body;


    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(409).json({ message: 'Email do usuário já cadastrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedSenha = await bcrypt.hash(senha, salt);

    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha: hashedSenha, fotoPerfil },
    });


    const { senha: _, ...usuarioSemSenha } = novoUsuario;

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      usuario: usuarioSemSenha
    });

  } catch (error) {
    return res.status(500).json({ message: `Erro ao cadastrar usuário: ${error instanceof Error ? error.message : error}` })
  }
});

app.post('/usuarios/login', async (req: Request, res: Response) => {
  try {

    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: {
        email,
      }
    });

    if (!usuario) {
      return res.status(400).json({ message: 'Email inválido!' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ message: 'Senha incorreta!' });
    }

    const EXPIRES_IN = process.env.JWT_EXPIRES_IN as string || '1h';

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, isAdmin: usuario.isAdmin },
      SECRET_KEY,
      { expiresIn: EXPIRES_IN } as jwt.SignOptions
    );


    const { senha: _, ...usuarioSemSenha } = usuario;
    res.status(200).json({ usuario: usuarioSemSenha, token });


  } catch (error) {
    return res.status(500).json({ message: `Erro ao fazer login: ${error instanceof Error ? error.message : error}` });
  }
})

app.get('/usuarios/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  try {
    const usuarioLogado = (req as any).usuario;

    const usuario = await prisma.usuario.findUnique({
      where: {
        id
      }
    })


    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado!" });
    }

    if (usuario.id !== usuarioLogado.id) {
      return res.status(403).json({ message: 'Você não pode acessar dados de outro usuário' })
    }

    return res.status(200).json({ usuario })

  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar usuário: ${error instanceof Error ? error.message : error}` });
  }

})

app.put('/usuarios/senha', usuarioAutenticado, async (req: Request, res: Response) => {
  const { senhaAtual, senhaNova } = req.body;
  const usuarioToken = (req as any).usuario;

  try {

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioToken.id }
    })

    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaCorreta) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedSenha = await bcrypt.hash(senhaNova, salt);

    await prisma.usuario.update({
      where: {
        id: usuario.id,
      },
      data: {
        senha: hashedSenha
      }
    })

    return res.status(200).json({ message: 'Nova senha cadastrada com sucesso!' })
  } catch (error) {
    return res.status(500).json({ message: `Erro ao trocar senha: ${error instanceof Error ? error.message : error}` });

  }
})

app.put('/usuarios/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  const data = req.body;

  try {
    const usuarioLogado = (req as any).usuario;

    const usuario = await prisma.usuario.findUnique({
      where: {
        id
      }
    })

    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const dataUpdate = {
      nome: data.nome ? data.nome : usuario?.nome,
      email: data.email ? data.email : usuario?.email,
      senha: usuario?.senha,
      fotoPerfil: data.fotoPerfil ? data.fotoPerfil : usuario?.fotoPerfil,
    };

    if (usuario.id !== usuarioLogado.id) {
      return res.status(403).json({ message: 'Você não pode acessar dados de outro usuário' })
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: {
        id
      },
      data: dataUpdate
    })

    const { senha, ...usuarioSemSenha } = usuarioAtualizado;
    return res.status(200).json({ message: "Usuário atualizado", usuario: usuarioSemSenha })

  } catch (error) {
    return res.status(500).json({ message: `Erro ao atualizar dados do usuário: ${error instanceof Error ? error.message : error}` });
  }
})

app.delete('/usuarios/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  try {

    const usuario = await prisma.usuario.findUnique({
      where: {
        id
      }
    })

    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    await prisma.usuario.delete({
      where: {
        id
      }
    })

    res.status(200).json({ message: "Usuário removido com sucesso" })
  } catch (error) {
    return res.status(500).json({ message: `Erro ao excluir usuário: ${error instanceof Error ? error.message : error}` });
  }
})

app.post('/produtos', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const { nome, descricao, preco, qtdEstoque, imagem, tipoProduto } = req.body;
    const idVendedor = (req as any).usuario?.id;

    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        qtdEstoque,
        preco,
        imagem,
        idVendedor,
        tipo: tipoProduto.toUpperCase()
      }
    })

    return res.status(201).json({ message: 'Produto cadastrado com sucesso!', produto })
  } catch (error) {
    return res.status(500).json({ message: `Erro ao cadastrar produto: ${error instanceof Error ? error.message : error}` });
  }

})

app.get('/produtos', async (req: Request, res: Response) => {
  try {
    const { nome, precoMin, precoMax, tipo } = req.query
    const tipoFiltrado = tipo ? String(tipo).toUpperCase() as TipoProduto : undefined;

    const precoMinNum = precoMin !== undefined ? Number(precoMin) : undefined;
    const precoMaxNum = precoMax !== undefined ? Number(precoMax) : undefined;

    if ((precoMin !== undefined && isNaN(precoMinNum!)) || (precoMax !== undefined && isNaN(precoMaxNum!))) {
      return res.status(400).json({ message: 'Parâmetros de preço inválidos' })
    }

    const produtos = await prisma.produto.findMany({
      where: {
        nome: nome ? { contains: String(nome).trim(), mode: 'insensitive' } : undefined,
        preco: {
          gte: precoMinNum,
          lte: precoMaxNum,
        },
        tipo: tipoFiltrado,
      }
    });

    res.status(200).json({ produtos });

  } catch (error) {
    return res.status(500).json({ message: `Erro ao listar produtos: ${error instanceof Error ? error.message : error}` });
  }
})

app.get('/produtos/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  try {
    const produto = await prisma.produto.findUnique({
      where: {
        id
      }
    })

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' })
    }

    return res.status(200).json({ produto });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao tentar ao buscar produto: ${error}` })
    }
  }

})


app.put('/produtos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }

    const produtoExiste = await prisma.produto.findUnique({
      where: {
        id
      }
    })

    if (!produtoExiste) {
      return res.status(404).json({ message: 'Produto não encontrado' })
    }

    const data = req.body;

    const dataUpdate = {
      nome: data.nome || produtoExiste.nome,
      descricao: data.descricao || produtoExiste.descricao,
      preco: data.preco || produtoExiste.preco,
      qtdEstoque: data.qtdEstoque || produtoExiste.qtdEstoque,
      imagem: data.imagem || produtoExiste.imagem,
    }


    if (!(usuario.id === produtoExiste.idVendedor)) {
      return res.status(403).json({ message: 'Você não pode alterar um produto que não é seu' });
    }

    const produto = await prisma.produto.update({
      where: {
        id
      },
      data: dataUpdate
    })

    return res.status(200).json({ produto })

  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno no servidor' });
  }
})

app.delete('/produtos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }


    const produto = await prisma.produto.findUnique({
      where: {
        id
      }
    })

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' })
    }

    if (!(usuario.id === produto.idVendedor) && !(usuario.isAdmin)) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir esse produto' })
    }

    const produtoApagado = await prisma.produto.delete({
      where: {
        id
      }
    })

    return res.status(200).json({ message: 'Produto excluído com sucesso', produto: produtoApagado })

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao tentar excluir produto: ${error}` })
    }
  }
})

app.post('/pedidos', usuarioAutenticadoOpcional, async (req: Request, res: Response) => {
  try {
    const { idEndereco, sessionId, tipoEnvio } = req.body;

    const idComprador = (req as any).usuario?.id;

    if (!idComprador && !sessionId) {
      return res.status(400).json({ message: 'Usuário não autenticado e sem sessionId válido' });
    }

    const whereClause: any = {};
    if (idComprador) whereClause.idUsuario = idComprador;
    if (sessionId) whereClause.sessionId = sessionId;

    let diasEntrega = 12;
    if (tipoEnvio === 'expresso') {
      diasEntrega = 5
    }

    const carrinho = await prisma.carrinho.findMany({
      where: whereClause,
      include: { produto: true }
    });

    if (!carrinho.length) {
      return res.status(400).json({ message: 'Carrinho vazio' });
    }

    const produtos = await prisma.produto.findMany({
      where: { id: { in: carrinho.map((item) => item.idProduto) } }
    });

    for (const item of carrinho) {
      const produto = produtos.find(p => p.id === item.idProduto);
      if (!produto || produto.qtdEstoque < item.quantidade) {
        return res.status(400).json({ message: `Produto ${produto?.nome || item.idProduto} sem estoque suficiente` });
      }
    }


    const pedido = await prisma.pedido.create({
      data: {
        dataEntregaEstimada: new Date(Date.now() + diasEntrega * 24 * 60 * 60 * 1000),
        status: "PENDENTE",
        idComprador: idComprador || null,
        sessionId: sessionId || null,
        idEnderecoEntrega: idEndereco
      }
    });

    await prisma.pedidoProduto.createMany({
      data: carrinho.map((item) => ({
        idPedido: pedido.id,
        idProduto: item.idProduto,
        quantidade: item.quantidade,
        precoUnitario: item.precoAtual
      })),
    });

    for (const item of carrinho) {
      await prisma.produto.update({
        where: { id: item.idProduto },
        data: { qtdEstoque: { decrement: item.quantidade } }
      });
    }


    await prisma.carrinho.deleteMany({
      where: {
        OR: [
          { idUsuario: idComprador ? idComprador : undefined },
          { sessionId: sessionId ? sessionId : undefined }
        ]
      }
    });

    return res.status(201).json({ message: 'Pedido realizado com sucesso!', pedido, prazoDeEntrega: `O prazo de entrega é em ${diasEntrega}` });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : `Erro ao fazer pedido: ${error}` });
  }
});

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

    res.status(200).json({ pedidos });

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao buscar pedidos: ${error}` })
    }
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
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao procurar por pedido: ${error}` });
    }
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
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao atualizar pedido: $${error}` })
    }
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
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao cancelar pedido: ${error}` })
    }
  }
})

app.post('/mensagens', usuarioAutenticado, async (req: Request, res: Response) => {
  const { idUsuarioReceptor, mensagem } = req.body;

  try {

    const usuario = (req as any).usuario;

    const usuarioReceptorExiste = await prisma.usuario.findUnique({
      where: {
        id: idUsuarioReceptor
      }
    })

    if (!usuarioReceptorExiste) {
      return res.status(404).json({ message: 'Não foi possível enviar a mensagem pois não há usuário receptor' })
    }

    const mensagemEnviada = await prisma.mensagem.create({
      data: {
        idUsuarioEmissor: usuario.id,
        idUsuarioReceptor,
        mensagem
      }
    })

    return res.status(201).json({ message: 'Mensagem enviada com sucesso!', mensagemEnviada })
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao enviar mensagem: ${error}` })
    }
  }
})

app.get('/mensagens', usuarioAutenticado, async (req: Request, res: Response) => {

  try {
    const usuario = (req as any).usuario;
    const mensagens = await prisma.mensagem.findMany({
      where: {
        OR: [
          { idUsuarioReceptor: usuario.id },
          { idUsuarioEmissor: usuario.id }
        ]
      },
      include: {
        usuarioEmissor: { select: { id: true, nome: true, email: true, } },
        usuarioReceptor: { select: { id: true, nome: true, email: true, } }
      },
      orderBy: {
        dataEnvio: 'desc'
      }
    })

    return res.status(200).json({ mensagens });

  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno do servidor' });
  }
})

app.get('/mensagens/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }
    const usuario = (req as any).usuario;

    const mensagem = await prisma.mensagem.findUnique({
      where: {
        id
      }
    })

    if (!mensagem || (mensagem.idUsuarioEmissor !== usuario.id && mensagem.idUsuarioReceptor !== usuario.id && !usuario.isAdmin)) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar essa mensagem' });
    }


    return res.status(200).json({ mensagem });

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao tentar buscar a mensagem pelo id: ${error}` })
    }

  }
})

app.delete('/mensagens/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }
    const usuario = (req as any).usuario;

    const mensagem = await prisma.mensagem.findUnique({
      where: {
        id
      }
    })

    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem não foi encontrada' });
    }

    if ((mensagem.idUsuarioEmissor !== usuario.id && mensagem.idUsuarioReceptor !== usuario.id && !usuario.isAdmin)) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar essa mensagem' });
    }


    return res.status(200).json({ message: 'Mensagem excluída com sucesso', mensagem })

  } catch (error) {

    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno do servidor' });
  }
})

app.post('/avaliacoes', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const { idProduto, avaliacao, comentario } = req.body;

    if (avaliacao < 0 || avaliacao > 5) {
      return res.status(400).json({ message: 'A avaliação deve estar entre 0 à 5' });
    }

    const usuario = (req as any).usuario;

    const produtoExiste = await prisma.produto.findUnique({
      where: {
        id: idProduto
      }
    })

    if (!produtoExiste) {
      return res.status(404).json({ message: 'Não foi possível encontrar o produto' })
    }

    const novaAvaliacao = await prisma.avaliacao.create({
      data: {
        idProduto,
        idUsuario: usuario.id,
        avaliacao,
        comentario
      },
      include: {
        produto: true
      }

    })
    return res.status(201).json({ message: "Avaliação feita com sucesso!", avaliacao: novaAvaliacao });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : `Erro interno do servidor` })
  }
})

app.get('/avaliacoes/:idProduto', usuarioAutenticado, async (req: Request, res: Response) => {
  const idProduto = Number(req.params.idProduto);
  if (isNaN(idProduto)) {
    return res.status(400).json({ message: 'ID inválido' })
  }
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        idProduto
      },
      orderBy: {
        dataAvaliacao: 'desc'
      },
      include: {
        produto: true
      }
    })
    if (avaliacoes.length === 0) {
      return res.status(404).json({ message: 'Não foi encontrada nenhuma avaliação sobre este produto' })
    }
    return res.status(200).json({ avaliacoes })
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    } else {
      return res.status(500).json({ message: `Erro ao tentar buscar por avaliações: ${error}` })
    }
  }
})

app.delete('/avaliacoes/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }
    const usuario = (req as any).usuario;

    const avaliacao = await prisma.avaliacao.findUnique({
      where: {
        id
      },
      include: {
        produto: true
      }
    })

    if (!avaliacao) {
      return res.status(404).json({ message: 'Não foi possível encontrar avaliacao' })
    }

    if (usuario.id !== avaliacao.idUsuario && !usuario.isAdmin) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir essa avaliação' });
    }

    return res.status(200).json({ message: 'Avaliação excluída com sucesso!', avaliacao })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno no servidor' });
  }
})

app.post("/carrinho", usuarioAutenticadoOpcional, async (req, res) => {
  const { idProduto, quantidade, sessionId } = req.body;

  try {

    const idUsuario = (req as any).usuario?.id;

    if (!idUsuario && !sessionId) {
      return res.status(400).json({ message: 'Usuário não autenticado e sem sessionId válido' });
    }

    const produto = await prisma.produto.findUnique({
      where: { id: idProduto },
    });

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const dataExpiracao = new Date();
    dataExpiracao.setHours(dataExpiracao.getHours() + 24);


    const carrinhoExistente = await prisma.carrinho.findFirst({
      where: {
        OR: [
          { idUsuario: idUsuario || undefined, idProduto },
          { sessionId: sessionId || undefined, idProduto }
        ]
      }
    });

    let carrinho;
    if (carrinhoExistente) {
      // Se já existe, atualiza a quantidade
      carrinho = await prisma.carrinho.update({
        where: { id: carrinhoExistente.id },
        data: {
          quantidade: { increment: quantidade },
          dataExpiracao
        }
      });
    } else {
      // Se não existe, cria um novo
      carrinho = await prisma.carrinho.create({
        data: {
          idUsuario: idUsuario || null,
          sessionId: sessionId || null,
          idProduto,
          quantidade,
          precoAtual: produto.preco,
          dataExpiracao,
        }
      });
    }

    return res.json(carrinho);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Erro ao adicionar ao carrinho" });
  }
});


app.patch("/carrinho", usuarioAutenticadoOpcional, async (req, res) => {
  const { idProduto, quantidade, sessionId } = req.body;

  try {
    const idUsuario = (req as any).usuario?.id;

    if (quantidade <= 0) {
      return res.status(400).json({ message: "Quantidade inválida" });
    }

    if (!idUsuario && !sessionId) {
      return res.status(400).json({ message: "Usuário não autenticado e sem sessionId válido" })
    }

    const carrinhoExistente = await prisma.carrinho.findFirst({
      where: {
        idProduto,
        OR: [
          { idUsuario: idUsuario || undefined },
          { sessionId: sessionId || undefined }
        ]
      }
    });

    if (!carrinhoExistente) {
      return res.status(404).json({ error: "Item do carrinho não encontrado" });
    }

    const carrinhoAtualizado = await prisma.carrinho.update({
      where: { id: carrinhoExistente.id },
      data: { quantidade }
    });

    return res.json(carrinhoAtualizado);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar o carrinho" });
  }
});


app.get("/carrinho", usuarioAutenticadoOpcional, async (req, res) => {

  const sessionId = req.query.sessionId as string;

  try {
    const usuario = (req as any).usuario;

    if (!usuario?.id && !sessionId) {
      return res.status(400).json({ message: "Usuário não autenticado e sem sessionId válido" });
    }

    const agora = new Date();
    const carrinho = await prisma.carrinho.findMany({
      where: {
        OR: [
          { idUsuario: usuario.id || undefined },
          { sessionId: sessionId || undefined }
        ],
        dataExpiracao: { gt: agora }
      },
      include: {
        produto: true
      }
    })

    return res.status(200).json(carrinho);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "Erro ao buscar pelas informações do carrinho" });

  }
})

app.delete("/carrinho/:idProduto", usuarioAutenticadoOpcional, async (req, res) => {
  const usuario = (req as any).usuario;
  const { sessionId } = req.body;
  const idProduto = Number(req.params.idProduto);
  if (isNaN(idProduto)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  if (!usuario?.id && !sessionId) {
    return res.status(400).json({ error: "Usuário não autenticado e sem sessionId válido" });
  }


  try {
    await prisma.carrinho.deleteMany({
      where: {
        OR: [
          { idUsuario: Number(usuario.id) || undefined },
          { sessionId: sessionId || undefined }
        ],
        idProduto: Number(idProduto),
      },
    });

    res.json({ message: "Produto removido do carrinho" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover do carrinho" });
  }
});

async function limparCarrinhosExpirados() {
  try {

    const agora = new Date();
    await prisma.carrinho.deleteMany({
      where: {
        dataExpiracao: { lte: agora },
      },
    });
  } catch (error) {
    console.log(`Erro ao limpar carrinhos expirados: ${error}`);
  }
}

const enderecoSchema = z.object({
  numero: z.string(),
  logradouro: z.string().min(3),
  cidade: z.string().min(2),
  cep: z.string().length(8),
  estado: z.string().length(2),
  bairro: z.string().min(3),
  complemento: z.string().min(3).optional(),
  pontoReferencia: z.string().optional()
});

app.post('/enderecos', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const parsedBody = enderecoSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ message: 'Dados inválidos', errors: parsedBody.error.errors });
    }

    const { logradouro, numero, bairro, complemento, cidade, cep, estado, pontoReferencia } = parsedBody.data;
    const usuario = (req as any).usuario;


    const estadosValidos = [
      "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
      "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
      "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    if (!estadosValidos.includes(estado.toUpperCase())) {
      return res.status(400).json({ message: "Estado inválido. Use a sigla (ex: PE, SP, RJ)." });
    }

    const enderecoExistente = await prisma.endereco.findFirst({
      where: {
        cep,
        logradouro,
        cidade,
        estado,
        numero,
        bairro,
      }
    })

    if (enderecoExistente) {
      return res.status(400).json({ message: 'Endereço já cadastrado' })
    }

    const endereco = await prisma.endereco.create({
      data: {
        cep,
        cidade,
        estado: estado.toUpperCase(),
        logradouro,
        complemento,
        bairro,
        numero,
        pontoReferencia,
        idUsuario: usuario.id
      }
    })

    return res.status(201).json({ message: 'Endereço cadastrado com sucesso!', endereco })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno do servidor' });
  }
})

app.get('/enderecos', usuarioAutenticado, async (req: Request, res: Response) => {
  const usuario = (req as any).usuario;
  try {
    const enderecosDoUsuario = await prisma.endereco.findMany({
      where: {
        idUsuario: usuario.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    if (enderecosDoUsuario.length === 0) {
      return res.status(404).json({ message: 'Usuário não foi possui nenhum endereço cadastrado' })
    }

    return res.status(200).json({ message: 'Endereços encontrados com sucesso', enderecos: enderecosDoUsuario })
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: `Erro ao buscar por endereços do usuario: ${error}` })
    }
  }
})

app.put('/enderecos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  const resultado = enderecoSchema.partial().safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: resultado.error.errors });
  }

  const data = resultado.data;

  try {
    const usuario = (req as any).usuario;

    const dataUpdate = {
      logradouro: data.logradouro,
      cidade: data.cidade,
      cep: data.cep,
      estado: data.estado,
    };

    const endereco = await prisma.endereco.findFirst({
      where: {
        id
      }
    })

    if (endereco?.idUsuario != usuario.id) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar um endereço de outra pessoa' })
    }
    if (!endereco) {
      return res.status(404).json({ message: 'Endereço não encontrado' })
    }

    const enderecoAtualizado = await prisma.endereco.update({
      where: {
        id
      },
      data: dataUpdate
    })

    return res.status(200).json({ message: 'Endereço atualizado com sucesso', endereco: enderecoAtualizado });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: `Erro ao atualizar endereço: ${error}` });
  }
})

app.delete('/enderecos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }
  const usuario = (req as any).usuario;
  try {

    const endereco = await prisma.endereco.findFirst({
      where: {
        id
      }
    })

    if (!endereco) {
      return res.status(404).json({ message: 'Não foi possível encontrar o endereço' });
    }

    if (endereco.idUsuario !== usuario.id) {
      return res.status(403).json({ message: 'Você não pode excluir o endereço cadastrado de outro usuário' })
    }

    await prisma.endereco.delete({
      where: {
        id
      }
    })

    return res.status(200).json({ message: 'Endereço excluído com sucesso' })
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: `Erro ao excluir endereço: ${error}` })
    }
  }
})

const favoritoSchema = z.object({
  idProduto: z.number().int().positive(),
});

app.post('/favoritos', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;

    const parseResult = favoritoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Dados inválidos', errors: parseResult.error.format() });
    }

    const { idProduto } = parseResult.data;

    const favoritoExistente = await prisma.favorito.findFirst({
      where: {
        idUsuario: usuario.id,
        idProduto,
      },
    });

    if (favoritoExistente) {
      return res.status(400).json({ message: 'Produto já está nos favoritos' });
    }

    const novoFavorito = await prisma.favorito.create({
      data: {
        idUsuario: usuario.id,
        idProduto,
      },
    });

    return res.status(201).json({ message: 'Produto adicionado aos favoritos', favorito: novoFavorito });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : `Erro ao adicionar favorito: ${error}` });
  }
});

app.get('/favoritos', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;

    const favoritos = await prisma.favorito.findMany({
      where: { idUsuario: usuario.id },
      include: { produto: true },
    });

    return res.status(200).json({ message: 'Favoritos encontrados', favoritos });
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar favoritos: ${error}` });
  }
});

app.delete('/favoritos/:idProduto', usuarioAutenticado, async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;
    const idProduto = Number(req.params.idProduto);

    if (isNaN(idProduto)) {
      return res.status(400).json({ message: 'ID de produto inválido' });
    }


    const favorito = await prisma.favorito.findFirst({
      where: {
        idUsuario: usuario.id,
        idProduto,
      },
    });

    if (!favorito) {
      return res.status(404).json({ message: 'Produto não encontrado nos favoritos' });
    }


    await prisma.favorito.delete({
      where: {
        id: favorito.id,
      },
    });

    return res.status(200).json({ message: 'Produto removido dos favoritos' });
  } catch (error) {
    return res.status(500).json({ message: `Erro ao remover favorito: ${error}` });
  }
});

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
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: 'Erro ao tentar buscar por usuários' })
    }
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
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: 'Erro ao excluir usuário' });
    }
  }
})

app.get('/docs', async (req: Request, res: Response) => {
  res.send()
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
