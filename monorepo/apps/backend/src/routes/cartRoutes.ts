import { PrismaClient } from "@prisma/client";
import { garantirSessionId, usuarioAutenticadoOpcional } from "../middlewares/auth";
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { encode } from "punycode";

const prisma = new PrismaClient();

const router = Router();

export async function limparCarrinhosExpirados() {
  try {

    const agora = new Date();
    await prisma.carrinho.deleteMany({
      where: {
        dataExpiracao: { lte: agora },
      },
    });
  } catch (error) {
    throw new Error("Erro ao limpar produtos do carrinho.")
  }
}



router.post("/carrinho", usuarioAutenticadoOpcional, garantirSessionId, async (req: Request, res: Response) => {
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
        idProduto,
        OR: [
          ...(idUsuario ? [{idUsuario}] : [] ),
          ...(sessionId ? [{sessionId}] : [] )
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


router.patch("/carrinho", usuarioAutenticadoOpcional, garantirSessionId, async (req: Request, res: Response) => {
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


router.get("/carrinho", usuarioAutenticadoOpcional, garantirSessionId, async (req: Request, res: Response) => {

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

    const carrinhoComImagens = carrinho.map(item => ({
      ...item,
      produto: {
        ...item.produto,
        imagens: item.produto.imagens.map(img => ({
          ...img,
          url: `${process.env.BACKEND_URL}${encodeURI(img.url)}`
        })) 
      }
    }));

    return res.status(200).json(carrinhoComImagens);
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar produtos do carrinho: ${error instanceof Error ? error.message : error}` });

  }
})

router.delete("/carrinho/:idProduto", usuarioAutenticadoOpcional, garantirSessionId, async (req: Request, res: Response) => {
  const usuario = (req as any).usuario;
  const sessionId = req.sessionId;
  const idProduto = Number(req.params.idProduto);
  if (isNaN(idProduto)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

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

export default router;