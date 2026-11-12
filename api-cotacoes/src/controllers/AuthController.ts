import { Prisma } from "@prisma/client";
import type { PerfilUsuario } from "@prisma/client";
import type { RequestHandler } from "express";
import {
  bcrypt,
  custoHashSenha,
  emitirToken,
} from "../middleware/autenticacao";
import { prisma } from "../lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function respostaAutenticacao(usuario: {
  identificador: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}) {
  const accessToken = emitirToken(usuario);
  return {
    mensagem: "Autenticação realizada com sucesso.",
    usuario,
    access_token: accessToken,
    token: accessToken,
    tipoToken: "Bearer",
    expiraEm: "1h",
    token_type: "Bearer",
    expires_in: 3600,
  };
}

export class AuthController {
  static registrar: RequestHandler = async (req, res, next) => {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: "Envie nome, e-mail e senha em formato JSON." });
      return;
    }

    const { nome, email, senha } = req.body;
    if (
      typeof nome !== "string" ||
      nome.trim().length < 2 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof senha !== "string" ||
      senha.length < 8
    ) {
      res.status(400).json({
        error: "Informe nome, e-mail válido e senha com pelo menos 8 caracteres.",
      });
      return;
    }

    const emailNormalizado = email.trim().toLowerCase();

    try {
      const usuario = await prisma.usuario.create({
        data: {
          nome: nome.trim(),
          email: emailNormalizado,
          senhaHash: await bcrypt.hash(senha, custoHashSenha),
          perfil: "CLIENTE",
        },
        select: {
          identificador: true,
          nome: true,
          email: true,
          perfil: true,
        },
      });
      res.status(201).json(respostaAutenticacao(usuario));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        res.status(409).json({ error: "Já existe uma conta com esse e-mail." });
        return;
      }
      next(error);
    }
  };

  static entrar: RequestHandler = async (req, res, next) => {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: "Envie e-mail e senha em formato JSON." });
      return;
    }

    const { email, senha } = req.body;
    if (typeof email !== "string" || typeof senha !== "string") {
      res.status(400).json({ error: "Informe e-mail e senha." });
      return;
    }

    try {
      const usuario = await prisma.usuario.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: {
          identificador: true,
          nome: true,
          email: true,
          perfil: true,
          senhaHash: true,
        },
      });

      if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
        res.status(401).json({ error: "E-mail ou senha incorretos." });
        return;
      }

      const { senhaHash: _senhaHash, ...usuarioPublico } = usuario;
      res.json(respostaAutenticacao(usuarioPublico));
    } catch (error) {
      next(error);
    }
  };
}
