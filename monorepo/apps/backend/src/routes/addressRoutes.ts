import { PrismaClient } from "@prisma/client";
import { usuarioAutenticado } from "../middlewares/auth";
import { Router, Request, Response } from "express";
import { enderecoSchema } from "../../../../packages/shared/schemas/enderecos";

const router = Router();

const prisma = new PrismaClient();

router.post('/enderecos', usuarioAutenticado, async (req: Request, res: Response) => {
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

router.get('/enderecos', usuarioAutenticado, async (req: Request, res: Response) => {
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

router.put('/enderecos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
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

router.delete('/enderecos/:id', usuarioAutenticado, async (req: Request, res: Response) => {
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

export default router;