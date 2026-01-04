import { Request, Response } from 'express';
import { PrismaClient, TipoProduto } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { BaseController } from './BaseController';

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

export const upload = multer({ storage });

export class ProductController extends BaseController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, precoMin, precoMax, tipo } = req.query;
      const tipoFiltrado = tipo ? String(tipo).toUpperCase() as TipoProduto : undefined;

      const precoMinNum = precoMin !== undefined ? Number(precoMin) : undefined;
      const precoMaxNum = precoMax !== undefined ? Number(precoMax) : undefined;

      if ((precoMin !== undefined && isNaN(precoMinNum!)) || (precoMax !== undefined && isNaN(precoMaxNum!))) {
        return this.sendError(res, 400, 'Parâmetros de preço inválidos');
      }

      const produtos = await this.prisma.produto.findMany({
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
            orderBy: { ordem: 'asc' }
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

      return this.sendSuccess(res, 200, produtosComImagens);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao listar produtos', error);
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const produto = await this.prisma.produto.findUnique({
        where: { id },
        include: {
          imagens: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      if (!produto) {
        return this.sendError(res, 404, 'Produto não encontrado');
      }

      const produtoComImagens = {
        ...produto,
        imagens: produto.imagens.map((img) => ({
          ...img,
          url: `${process.env.BACKEND_URL}${encodeURI(img.url)}`,
        })),
      };

      return this.sendSuccess(res, 200, produtoComImagens);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar por produto', error);
    }
  }

  async store(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, descricao, preco, qtdEstoque, tipoProduto } = req.body;
      const usuario = this.getUsuario(req);
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
        return this.sendError(res, 403, 'Usuário não tem conta Stripe para vender.');
      }

      const produto = await this.prisma.produto.create({
        data: dataProduto,
        include: { imagens: true }
      });

      const produtoComImagens = {
        ...produto,
        imagens: produto.imagens.map((img) => ({
          ...img,
          url: `${process.env.BACKEND_URL}${encodeURI(img.url)}`,
        })),
      };

      return this.sendSuccess(res, 201, { produto: produtoComImagens }, 'Produto cadastrado com sucesso!');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao cadastrar produto', error);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const produtoExiste = await this.prisma.produto.findUnique({
        where: { id },
        include: { imagens: true }
      });

      if (!produtoExiste) {
        return this.sendError(res, 404, 'Produto não encontrado');
      }

      if (usuario.id !== produtoExiste.idVendedor) {
        return this.sendError(res, 403, 'Você não pode alterar um produto que não é seu');
      }

      const { nome, descricao, preco, qtdEstoque, tipo } = req.body;
      const arquivos = req.files as Express.Multer.File[];

      const precoDecimal = preco ? new Decimal(preco) : produtoExiste.preco;

      const imagensOrdem = req.body.imagensOrdem ? JSON.parse(req.body.imagensOrdem) : [];

      for (const img of imagensOrdem) {
        await this.prisma.imagemProduto.update({
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

        await this.prisma.imagemProduto.deleteMany({
          where: {
            id: { in: imagensRemovidas },
            produtoId: id
          }
        });
      }

      if (arquivos && arquivos.length > 0) {
        const ultimaOrdem = await this.prisma.imagemProduto.aggregate({
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

      const produtoAtualizado = await this.prisma.produto.update({
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

      return this.sendSuccess(res, 200, { produto: produtoComImagens });

    } catch (error) {
      return this.sendError(res, 500, error instanceof Error ? error.message : 'Erro interno no servidor');
    }
  }

  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const produto = await this.prisma.produto.findUnique({
        where: { id },
        include: { imagens: true }
      });

      if (!produto) {
        return this.sendError(res, 404, 'Produto não encontrado');
      }

      if (!(usuario.id === produto.idVendedor) && !(usuario.isAdmin)) {
        return this.sendError(res, 403, 'Você não tem permissão para excluir esse produto');
      }

      await this.prisma.imagemProduto.deleteMany({
        where: { produtoId: id }
      });

      const produtoApagado = await this.prisma.produto.delete({
        where: { id }
      });

      return this.sendSuccess(res, 200, { produto: produtoApagado }, 'Produto excluído com sucesso');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao excluir produto', error);
    }
  }
}

