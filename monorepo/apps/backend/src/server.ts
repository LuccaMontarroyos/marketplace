import express, { NextFunction, Request, Response } from 'express';
import { Prisma, PrismaClient, TipoProduto } from '@prisma/client';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import dotenv from "dotenv";
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from "../swagger.json";
import { enderecoSchema } from "../../../packages/shared/schemas/enderecos";
import cors from 'cors';
import multer from "multer";
import path from "path";
import fs from "fs";
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";

dotenv.config();

const uploadDir = path.resolve(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const prisma = new PrismaClient();
const app = express();
const port = 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))

app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(uploadDir));

app.use(cookieParser());

cron.schedule("0 * * * *", async () => {
  console.log("Removendo itens expirados do carrinho...");
  await limparCarrinhosExpirados();
});

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não definida no .env");
}

const SECRET_KEY = process.env.JWT_SECRET || "seu segredo super secreto";

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
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.split(" ")[1];
  }

  if (!token && req.cookies.token) {
    token = req.cookies.token;
  }


  if (token) {

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

const usuarioSchema = z.object({
  nome: z.string(),
  email: z.string(),
  senha: z.string(),
  cpf: z.string().regex(/^\d{11}$/),
  celular: z.string().regex(/^\d{11}$/),
  fotoPerfil: z.string().optional(),
});

app.post('/usuarios/cadastro', async (req: Request, res: Response) => {
  try {
    const parsedBody = usuarioSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ message: 'Dados inválidos', errors: parsedBody.error.errors });
    }
    const { nome, email, senha, celular, cpf, fotoPerfil } = parsedBody.data;

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email },
          { cpf },
          { celular }
        ]
      }
    });

    if (usuarioExistente) {
      return res.status(409).json({ message: 'Email, cpf ou celular já cadastrados' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedSenha = await bcrypt.hash(senha, salt);

    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha: hashedSenha, celular, cpf, fotoPerfil },
    });


    const { senha: _, ...usuarioSemSenha } = novoUsuario;

    const token = jwt.sign({
      id: novoUsuario.id,
      email: novoUsuario.email,
      isAdmin: novoUsuario.isAdmin,
    },
      SECRET_KEY,
      { expiresIn: "7d" }
    )

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      usuario: usuarioSemSenha, token
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

    const EXPIRES_IN = process.env.JWT_EXPIRES_IN as string || '7d';

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

    return res.status(200).json(usuario);

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
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' })
    }

    const resultado = usuarioSchema.partial().safeParse(req.body);
    if (!resultado.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: resultado.error.errors });
    }
    const data = resultado.data;


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
      celular: data.celular ? data.celular : usuario?.celular,
      cpf: data.cpf ? data.cpf : usuario?.cpf,
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

app.get('/produtos/usuario', usuarioAutenticado, async (req: Request, res: Response) => {
  const usuario = (req as any).usuario;

  try {
    const produtos = await prisma.produto.findMany({
      where: {
        idVendedor: usuario.id
      },
      include: {
        imagens: true
      }
    });
    if (produtos.length === 0) {
      return res.status(404).json({ message: 'Usuário não foi possui nenhum produto cadastrado' })
    }

    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar produtos: ${error instanceof Error ? error.message : error}` });

  }
})

app.post('/produtos', usuarioAutenticado, upload.array('imagens', 6), async (req: Request, res: Response) => {
  try {
    const { nome, descricao, preco, qtdEstoque, tipoProduto } = req.body;
    const idVendedor = (req as any).usuario?.id;

    const arquivos = req.files as Express.Multer.File[];

    const precoDecimal = new Decimal(preco);

    const dataProduto: any = {
      nome,
      descricao,
      qtdEstoque: Number(qtdEstoque),
      preco: precoDecimal,
      idVendedor,
      tipo: tipoProduto.toUpperCase()
    };

    const ordens = req.body.ordens || [];
    const ordensArray = Array.isArray(ordens) ? ordens : [ordens];

    if (arquivos && arquivos.length > 0) {
      dataProduto.imagens = {
        create: arquivos.map((file, index) => ({
          url: `/uploads/${file.filename}`,
          ordem: parseInt(ordensArray[index]) || index + 1 // fallback para index
        }))
      };
    }


    const produto = await prisma.produto.create({
      data: dataProduto,
      include: {
        imagens: true
      }
    });

    return res.status(201).json({ message: 'Produto cadastrado com sucesso!', produto });

  } catch (error) {
    return res.status(500).json({ message: `Erro ao cadastrar produto: ${error instanceof Error ? error.message : error}` });
  }
});


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
      },
      include: {
        imagens: {
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    });

    res.status(200).json(produtos);

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
      },
      include: {
        imagens: {
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    })

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' })
    }

    return res.status(200).json({ produto });
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar por produto: ${error instanceof Error ? error.message : error}` });
  }

})


app.put('/produtos/:id', usuarioAutenticado, upload.array('imagens', 6), async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const produtoExiste = await prisma.produto.findUnique({
      where: { id },
      include: { imagens: true }
    });

    if (!produtoExiste) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    if (usuario.id !== produtoExiste.idVendedor) {
      return res.status(403).json({ message: 'Você não pode alterar um produto que não é seu' });
    }

    const { nome, descricao, preco, qtdEstoque, tipo } = req.body;
    const arquivos = req.files as Express.Multer.File[];


    const precoDecimal = preco ? new Decimal(preco) : produtoExiste.preco;

    const imagensOrdem = req.body.imagensOrdem ? JSON.parse(req.body.imagensOrdem) : [];

    for (const img of imagensOrdem) {
      await prisma.imagemProduto.update({
        where: { id: img.id },
        data: { ordem: img.ordem },
      });
    }

    const dataUpdate: any = {
      nome: nome || produtoExiste.nome,
      descricao: descricao || produtoExiste.descricao,
      preco: precoDecimal,
      qtdEstoque: qtdEstoque !== undefined ? Number(qtdEstoque) : produtoExiste.qtdEstoque,
      tipo: tipo || produtoExiste.tipo
    };

    const imagensRemovidas = req.body.imagensRemovidas ? JSON.parse(req.body.imagensRemovidas) : [];

    if (Array.isArray(imagensRemovidas) && imagensRemovidas.length > 0) {
      const imagensParaRemover = produtoExiste.imagens.filter(img => imagensRemovidas.includes(img.id));

      for (const imagem of imagensParaRemover) {
        const pathArquivo = path.resolve(__dirname, '../../uploads', path.basename(imagem.url));
        if (fs.existsSync(pathArquivo)) {
          fs.unlinkSync(pathArquivo);
        }
      }

      await prisma.imagemProduto.deleteMany({
        where: {
          id: { in: imagensRemovidas },
          produtoId: id
        }
      });
    }



    if (arquivos && arquivos.length > 0) {

      const ultimaOrdem = await prisma.imagemProduto.aggregate({
        where: { produtoId: id },
        _max: { ordem: true }
      });

      const ordemInicial = ultimaOrdem._max.ordem ?? 0;

      dataUpdate.imagens = {
        create: arquivos.slice(0, 6).map((file, index) => ({
          url: `/uploads/${file.filename}`,
          ordem: ordemInicial + index + 1
        }))
      };
    }

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: dataUpdate,
      include: { imagens: true }
    });

    return res.status(200).json({ produto: produtoAtualizado });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno no servidor' });
  }
});


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
      },
      include: {
        imagens: true
      }
    })

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' })
    }

    if (!(usuario.id === produto.idVendedor) && !(usuario.isAdmin)) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir esse produto' })
    }

    await prisma.imagemProduto.deleteMany({
      where: {
        produtoId: id
      }
    })

    const produtoApagado = await prisma.produto.delete({
      where: {
        id
      }
    })

    return res.status(200).json({ message: 'Produto excluído com sucesso', produto: produtoApagado })

  } catch (error) {
    return res.status(500).json({ message: `Erro ao excluir produto: ${error instanceof Error ? error.message : error}` });
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

    await prisma.pagamento.create({
      data: {
        idPedido: pedido.id,
        valor: carrinho.reduce((acc, item) => acc + item.precoAtual.toNumber() * item.quantidade, 0),
        metodoPagamento: 'cartao', // ou 'pix', 'boleto' — você pode receber do body também
        status: 'PENDENTE',
        idUsuario: idComprador || null
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
    return res.status(500).json({ message: `Erro ao enviar mensagem: ${error instanceof Error ? error.message : error}` });
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
    return res.status(500).json({ message: `Erro ao buscar a mensagem: ${error instanceof Error ? error.message : error}` });

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
    return res.status(500).json({ message: `Erro ao excluir mensagem: ${error instanceof Error ? error.message : error}` });
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
    return res.status(500).json({ message: `Erro ao criar avaliação: ${error instanceof Error ? error.message : error}` });
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
    return res.status(500).json({ message: `Erro ao buscar pelas avaliações do produto: ${error instanceof Error ? error.message : error}` });
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
    return res.status(500).json({ message: `Erro ao excluir avaliação: ${error instanceof Error ? error.message : error}` });
  }
})


function garantirSessionId(req, res, next) {
  let sessionId = req.cookies.sessionId;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }
  req.sessionId = sessionId;
  next();
}


app.post("/carrinho", usuarioAutenticadoOpcional, garantirSessionId, async (req, res) => {
  const { idProduto, quantidade } = req.body;
  const sessionId = req.sessionId;

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

      carrinho = await prisma.carrinho.update({
        where: { id: carrinhoExistente.id },
        data: {
          quantidade: { increment: quantidade },
          dataExpiracao
        }
      });
    } else {

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
    return res.status(500).json({ message: `Erro ao adicionar produtos no carrinho: ${error instanceof Error ? error.message : error}` });
  }
});


app.patch("/carrinho", usuarioAutenticadoOpcional, garantirSessionId, async (req, res) => {
  const { idProduto, quantidade } = req.body;
  const idUsuario = (req as any).usuario?.id;
  const sessionId = req.sessionId;

  if (typeof idProduto !== "number" || typeof quantidade !== "number") {
    return res.status(400).json({ message: "idProduto e quantidade devem ser números" });
  }

  if (quantidade < 0) {
    return res.status(400).json({ message: "Quantidade inválida" });
  }
  try {

    if (!idUsuario && !sessionId) {
      return res.status(400).json({ message: "Usuário não autenticado e sem sessionId válido" })
    }

    const whereFiltro: any = { idProduto };
    if (idUsuario) {
      whereFiltro.idUsuario = idUsuario;
    } else {
      whereFiltro.sessionId = sessionId;
    }



    const carrinhoExistente = await prisma.carrinho.findFirst({
      where: whereFiltro
    })

    // const carrinhoExistente = await prisma.carrinho.findFirst({
    //   where: {
    //     idProduto,
    //     OR: [
    //       { idUsuario: idUsuario || undefined },
    //       { sessionId: sessionId || undefined }
    //     ]

    //   }
    // });

    if (!carrinhoExistente) {
      return res.status(404).json({ error: "Item do carrinho não encontrado" });
    }

    if (quantidade === 0) {
      await prisma.carrinho.delete({
        where: {
          id: carrinhoExistente.id
        }
      })
      return res.json({ message: "Produto removido do carrinho" });
    }

    const carrinhoAtualizado = await prisma.carrinho.update({
      where: { id: carrinhoExistente.id },
      data: { quantidade }
    });

    return res.json(carrinhoAtualizado);
  } catch (error) {
    return res.status(500).json({ message: `Erro ao atualizar carrinho: ${error instanceof Error ? error.message : error}` });
  }
});


app.get("/carrinho", usuarioAutenticadoOpcional, garantirSessionId, async (req, res) => {

  let sessionId = req.sessionId;

  const usuario = (req as any).usuario;

  if (!usuario?.id && !sessionId) {
    sessionId = uuidv4();
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }
  if (!usuario?.id && !sessionId) {
    return res.status(400).json({ message: "Usuário não autenticado e sem sessionId válido" });
  }


  try {
    const agora = new Date();
    const carrinho = await prisma.carrinho.findMany({
      where: {
        OR: [
          { idUsuario: usuario?.id || undefined },
          { sessionId: sessionId || undefined }
        ],
        dataExpiracao: { gt: agora }
      },
      include: {
        produto: {
          include: {
            imagens: true
          }
        },
        usuario: true
      }
    })

    return res.status(200).json(carrinho);
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar produtos do carrinho: ${error instanceof Error ? error.message : error}` });

  }
})

app.delete("/carrinho/:idProduto", usuarioAutenticadoOpcional, garantirSessionId, async (req, res) => {
  const usuario = (req as any).usuario;
  const sessionId = req.sessionId;
  const idProduto = Number(req.params.idProduto);
  if (isNaN(idProduto)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  console.log("Esse é o id de usuário: ", usuario);
  console.log("Esse é o sessionID", sessionId);

  if (!usuario?.id && !sessionId) {
    return res.status(400).json({ error: "Usuário não autenticado e sem sessionId válido" });
  }


  try {

    const whereFiltro: any = { idProduto };
    if (usuario?.id) whereFiltro.idUsuario = Number(usuario.id);
    else if (sessionId) whereFiltro.sessionId = sessionId;
    else return res.status(400).json({ error: "Usuário não autenticado e sem sessionId válido" });

    const itemCarrinho = await prisma.carrinho.findFirst({ where: whereFiltro });
    if (!itemCarrinho) {
      return res.status(404).json({ message: "Item do carrinho não encontrado" });
    }

    await prisma.carrinho.delete({
      where: { id: itemCarrinho.id }
    });

    res.json({ message: "Produto removido do carrinho" });
  } catch (error) {
    return res.status(500).json({ message: `Erro ao excluir do carrinho: ${error instanceof Error ? error.message : error}` });

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
    return res.status(500).json({ message: `Erro ao cadastrar endereço: ${error instanceof Error ? error.message : error}` });
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
        createdAt: 'asc'
      }
    })
    if (enderecosDoUsuario.length === 0) {
      return res.status(404).json({ message: 'Usuário não foi possui nenhum endereço cadastrado' })
    }

    return res.status(200).json(enderecosDoUsuario)
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar endereços: ${error instanceof Error ? error.message : error}` });

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
      numero: data.numero,
      bairro: data.bairro,
      complemento: data.complemento,
      pontoReferencia: data.pontoReferencia
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
    return res.status(500).json({ message: `Erro ao atualizar endereço: ${error instanceof Error ? error.message : error}` });
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
    return res.status(500).json({ message: `Erro ao excluir endereço: ${error instanceof Error ? error.message : error}` });

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
    return res.status(500).json({ message: `Erro ao adicionar produot aos favoritos: ${error instanceof Error ? error.message : error}` });

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
    return res.status(500).json({ message: `Erro ao buscar produtos favoritos: ${error instanceof Error ? error.message : error}` });
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
    return res.status(500).json({ message: `Erro ao remover produto dos favoritos: ${error instanceof Error ? error.message : error}` });
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



app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
