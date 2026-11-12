import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { PerfilUsuario } from "@prisma/client";
import { prisma } from "../lib/prisma";

const duracaoToken = "1h";
const custoHashSenha = 12;
const perfilCliente: PerfilUsuario = "CLIENTE";
const perfilGestor: PerfilUsuario = "GESTOR";

declare global {
  namespace Express {
    interface Request {
      usuarioAutenticado?: {
        identificador: string;
        perfil: PerfilUsuario;
      };
    }
  }
}

function obterSegredoJwt(): string {
  const segredo = process.env.JWT_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error("Configure JWT_SECRET com pelo menos 32 caracteres no .env.");
  }
  return segredo;
}

function perfilValido(perfil: unknown): perfil is PerfilUsuario {
  return perfil === perfilCliente || perfil === perfilGestor;
}

export function emitirToken(usuario: {
  identificador: string;
  perfil: PerfilUsuario;
}): string {
  return jwt.sign(
    { perfil: usuario.perfil },
    obterSegredoJwt(),
    { subject: usuario.identificador, expiresIn: duracaoToken },
  );
}

export const autenticar: RequestHandler = async (req, res, next) => {
  const cabecalho = req.get("authorization");
  const correspondencia = cabecalho?.match(/^Bearer\s+(.+)$/i);
  const token = correspondencia?.[1];
  if (!token) {
    res.status(401).json({ error: "Envie um token no cabeçalho Authorization: Bearer." });
    return;
  }

  try {
    const payload = jwt.verify(token, obterSegredoJwt());
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !perfilValido(payload.perfil)
    ) {
      res.status(401).json({ error: "Token inválido." });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { identificador: payload.sub },
      select: { identificador: true, perfil: true },
    });
    if (!usuario || usuario.perfil !== payload.perfil) {
      res.status(401).json({ error: "A conta vinculada a este token não está mais ativa." });
      return;
    }

    req.usuarioAutenticado = usuario;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token inválido ou expirado." });
      return;
    }
    next(error);
  }
};

export { bcrypt, custoHashSenha, obterSegredoJwt };
