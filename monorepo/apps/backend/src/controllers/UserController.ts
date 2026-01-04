import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { BaseController } from './BaseController';
import { PrismaClient } from '@prisma/client';

const SECRET_KEY = process.env.JWT_SECRET || "seu segredo super secreto";

const usuarioSchema = z.object({
  nome: z.string(),
  email: z.string(),
  senha: z.string(),
  cpf: z.string().regex(/^\d{11}$/),
  celular: z.string().regex(/^\d{11}$/),
  fotoPerfil: z.string().optional(),
});

export class UserController extends BaseController {
  async store(req: Request, res: Response): Promise<Response> {
    try {
      const parsedBody = usuarioSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return this.sendError(res, 400, 'Dados inválidos', parsedBody.error.errors);
      }

      const { nome, email, senha, celular, cpf, fotoPerfil } = parsedBody.data;

      const usuarioExistente = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { email },
            { cpf },
            { celular }
          ]
        }
      });

      if (usuarioExistente) {
        return this.sendError(res, 409, 'Email, cpf ou celular já cadastrados');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedSenha = await bcrypt.hash(senha, salt);

      const novoUsuario = await this.prisma.usuario.create({
        data: { nome, email, senha: hashedSenha, celular, cpf, fotoPerfil },
      });

      const { senha: _, ...usuarioSemSenha } = novoUsuario;

      const token = jwt.sign({
        id: novoUsuario.id,
        email: novoUsuario.email,
        isAdmin: novoUsuario.isAdmin,
      }, SECRET_KEY, { expiresIn: "7d" });

      return this.sendSuccess(res, 201, {
        usuario: usuarioSemSenha,
        token
      }, 'Usuário cadastrado com sucesso!');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao cadastrar usuário', error);
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, senha } = req.body;

      const usuario = await this.prisma.usuario.findUnique({
        where: { email }
      });

      if (!usuario) {
        return this.sendError(res, 400, 'Email inválido!');
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

      if (!senhaCorreta) {
        return this.sendError(res, 401, 'Senha incorreta!');
      }

      const EXPIRES_IN = process.env.JWT_EXPIRES_IN as string || '7d';

      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, isAdmin: usuario.isAdmin },
        SECRET_KEY,
        { expiresIn: EXPIRES_IN } as jwt.SignOptions
      );

      const { senha: _, ...usuarioSemSenha } = usuario;
      return this.sendSuccess(res, 200, { usuario: usuarioSemSenha, token });

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao fazer login', error);
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const usuarioLogado = this.getUsuario(req) || null;

      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
        include: {
          produtos: true,
          pedidos: true,
          Endereco: true,
        }
      });

      if (!usuario) {
        return this.sendError(res, 404, 'Usuário não encontrado!');
      }

      const isProprioUsuario = usuarioLogado && usuarioLogado.id === usuario.id;

      if (!isProprioUsuario) {
        delete (usuario as any).senha;
        delete (usuario as any).cpf;
        delete (usuario as any).isAdmin;
      }

      return this.sendSuccess(res, 200, usuario);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar usuário', error);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const resultado = usuarioSchema.partial().safeParse(req.body);
      if (!resultado.success) {
        return this.sendError(res, 400, 'Dados inválidos', resultado.error.errors);
      }

      const data = resultado.data;
      const usuarioLogado = this.getUsuario(req);

      const usuario = await this.prisma.usuario.findUnique({
        where: { id }
      });

      if (!usuario) {
        return this.sendError(res, 404, 'Usuário não encontrado');
      }

      if (usuario.id !== usuarioLogado.id) {
        return this.sendError(res, 403, 'Você não pode acessar dados de outro usuário');
      }

      const dataUpdate = {
        nome: data.nome ? data.nome : usuario.nome,
        email: data.email ? data.email : usuario.email,
        senha: usuario.senha,
        celular: data.celular ? data.celular : usuario.celular,
        cpf: data.cpf ? data.cpf : usuario.cpf,
        fotoPerfil: data.fotoPerfil ? data.fotoPerfil : usuario.fotoPerfil,
      };

      const usuarioAtualizado = await this.prisma.usuario.update({
        where: { id },
        data: dataUpdate
      });

      const { senha, ...usuarioSemSenha } = usuarioAtualizado;
      return this.sendSuccess(res, 200, { usuario: usuarioSemSenha }, 'Usuário atualizado');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao atualizar dados do usuário', error);
    }
  }

  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return this.sendError(res, 400, 'ID inválido');
      }

      const usuario = await this.prisma.usuario.findUnique({
        where: { id }
      });

      if (!usuario) {
        return this.sendError(res, 404, 'Usuário não encontrado');
      }

      await this.prisma.usuario.delete({
        where: { id }
      });

      return this.sendSuccess(res, 200, null, 'Usuário removido com sucesso');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao excluir usuário', error);
    }
  }

  async updatePassword(req: Request, res: Response): Promise<Response> {
    try {
      const { senhaAtual, senhaNova } = req.body;
      const usuarioToken = this.getUsuario(req);

      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioToken.id }
      });

      if (!usuario) {
        return this.sendError(res, 404, 'Usuário não encontrado');
      }

      const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaCorreta) {
        return this.sendError(res, 400, 'Senha atual incorreta');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedSenha = await bcrypt.hash(senhaNova, salt);

      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { senha: hashedSenha }
      });

      return this.sendSuccess(res, 200, null, 'Nova senha cadastrada com sucesso!');

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao trocar senha', error);
    }
  }

  async getProducts(req: Request, res: Response): Promise<Response> {
    try {
      const usuario = this.getUsuario(req);

      const produtos = await this.prisma.produto.findMany({
        where: { idVendedor: usuario.id },
        include: { imagens: true }
      });

      if (produtos.length === 0) {
        return this.sendError(res, 404, 'Usuário não possui nenhum produto cadastrado');
      }

      const produtosComImagens = produtos.map((produto) => ({
        ...produto,
        imagens: produto.imagens.map((img) => ({
          ...img,
          url: `http://localhost:5000${img.url}`,
        })),
      }));

      return this.sendSuccess(res, 200, produtosComImagens);

    } catch (error) {
      return this.sendError(res, 500, 'Erro ao buscar produtos', error);
    }
  }
}

