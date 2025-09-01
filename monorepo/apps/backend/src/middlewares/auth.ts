import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const SECRET_KEY = process.env.JWT_SECRET || "seu segredo super secreto";


export function usuarioAutenticado(req: Request, res: Response, next: NextFunction) {
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

export function usuarioAutenticadoOpcional(req: Request, res: Response, next: NextFunction) {
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

export function garantirSessionId(req, res, next) {
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
