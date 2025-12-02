import { Router, Request, Response } from "express";
import { usuarioAutenticado, usuarioAutenticadoOpcional } from "../middlewares/auth";
import { PrismaClient, TipoProduto } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import path from "path";
import fs from "fs";
import multer from "multer";
import { encode } from "punycode";

export const uploadDir = path.resolve(__dirname, '../../../uploads');
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

const router = Router();

router.get('/produtos/usuario', usuarioAutenticadoOpcional, async (req: Request, res: Response) => {
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

router.post('/produtos', usuarioAutenticado, upload.array('imagens', 6), async (req: Request, res: Response) => {
  try {
    const { nome, descricao, preco, qtdEstoque, tipoProduto } = req.body;
    const usuario = (req as any).usuario;

    const arquivos = req.files as Express.Multer.File[];

    const precoDecimal = new Decimal(preco);

    const dataProduto: any = {
      nome,
      descricao,
      qtdEstoque: Number(qtdEstoque),
      preco: precoDecimal,
      idVendedor: usuario.id,
      tipo: tipoProduto.toUpperCase()
    };

    const ordens = req.body.ordens || [];
    const ordensArray = Array.isArray(ordens) ? ordens : [ordens];

    if (arquivos && arquivos.length > 0) {
      dataProduto.imagens = {
        create: arquivos.map((file, index) => ({
          url: `/uploads/${file.filename}`,
          ordem: parseInt(ordensArray[index]) || index + 1
        }))
      };
    }

    if (!usuario.isVendedor || !usuario.stripeAccountId) {
      return res.status(403).json({ erro: "Usuário não tem conta Stripe para vender." });
    }


    const produto = await prisma.produto.create({
      data: dataProduto,
      include: {
        imagens: true
      }
    });

    const produtoComImagens = {
      ...produto,
      imagens: produto.imagens.map((img) => ({
        ...img,
        url: `${process.env.BACKEND_URL}${encodeURI(img.url)}`,
      })),
    };

    return res.status(201).json({ message: 'Produto cadastrado com sucesso!', produto: produtoComImagens });

  } catch (error) {
    return res.status(500).json({ message: `Erro ao cadastrar produto: ${error instanceof Error ? error.message : error}` });
  }
});


router.get('/produtos', async (req: Request, res: Response) => {
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

    
    const produtosComImagens = produtos.map((produto) => ({
      ...produto,
      imagens: produto.imagens.map((img) => ({
        ...img,
        url: `${process.env.BACKEND_URL}${encodeURI(img.url)}`,
      })),
    }));

    res.status(200).json(produtosComImagens);

  } catch (error) {
    return res.status(500).json({ message: `Erro ao listar produtos: ${error instanceof Error ? error.message : error}` });
  }
})

router.get('/produtos/:id', async (req: Request, res: Response) => {
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

    const produtoComImagens = {
      ...produto,
      imagens: produto.imagens.map((img) => ({
        ...img,
        url: `${process.env.BACKEND_URL}${encodeURI(img.url)}`,
      })),
    };

    return res.status(200).json(produtoComImagens);
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar por produto: ${error instanceof Error ? error.message : error}` });
  }

});


router.put('/produtos/:id', usuarioAutenticado, upload.array('imagens', 6), async (req: Request, res: Response) => {
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
        const pathArquivo = path.resolve(uploadDir, path.basename(imagem.url));
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

    const produtoComImagens = {
      ...produtoAtualizado,
      imagens: produtoAtualizado.imagens.map((img) => ({
        ...img,
        url: `${process.env.BACKEND_URL}${encodeURI(img.url)}`,
      })),
    };

    return res.status(200).json({ produto: produtoComImagens });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno no servidor' });
  }
});


router.delete('/produtos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
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

export default router;