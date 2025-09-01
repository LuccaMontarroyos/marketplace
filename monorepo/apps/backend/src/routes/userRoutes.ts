import { PrismaClient } from "@prisma/client";
import { Router, Response, Request } from "express";
import { z } from "zod";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { usuarioAutenticado } from "../middlewares/auth";
const prisma = new PrismaClient();

const router = Router();

const SECRET_KEY = process.env.JWT_SECRET || "seu segredo super secreto";

const usuarioSchema = z.object({
    nome: z.string(),
    email: z.string(),
    senha: z.string(),
    cpf: z.string().regex(/^\d{11}$/),
    celular: z.string().regex(/^\d{11}$/),
    fotoPerfil: z.string().optional(),
});

router.post("/usuarios/cadastro", async (req: Request, res: Response) => {
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

router.post('/usuarios/login', async (req: Request, res: Response) => {
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

router.get('/usuarios/:id', usuarioAutenticado, async (req: Request, res: Response) => {
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

router.put('/usuarios/senha', usuarioAutenticado, async (req: Request, res: Response) => {
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

router.put('/usuarios/:id', usuarioAutenticado, async (req: Request, res: Response) => {
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

router.delete('/usuarios/:id', usuarioAutenticado, async (req: Request, res: Response) => {
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

router.get('/produtos/usuario', usuarioAutenticado, async (req: Request, res: Response) => {
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

export default router;