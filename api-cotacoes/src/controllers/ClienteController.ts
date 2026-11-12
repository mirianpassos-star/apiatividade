import { Prisma } from "@prisma/client";
import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class ClienteController {
  static listar: RequestHandler = async (_req, res, next) => {
    try {
      const clientes = await prisma.cliente.findMany({
        orderBy: { nome: "asc" },
      });
      res.json(clientes);
    } catch (error) {
      next(error);
    }
  };

  static criar: RequestHandler = async (req, res, next) => {
    const body: unknown = req.body;
    if (!isRecord(body)) {
      res.status(400).json({ error: "Envie os dados do cliente em formato JSON." });
      return;
    }

    const { nome, email, telefone, regiao } = body;
    if (
      typeof nome !== "string" ||
      nome.trim() === "" ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof telefone !== "string" ||
      telefone.trim() === "" ||
      typeof regiao !== "string" ||
      regiao.trim() === ""
    ) {
      res.status(400).json({
        error:
          "Informe nome, e-mail válido, telefone e região. Todos os campos são obrigatórios.",
      });
      return;
    }

    try {
      const cliente = await prisma.cliente.create({
        data: {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.trim(),
          regiao: regiao.trim(),
        },
      });

      res.status(201).json({
        mensagem: "Cliente cadastrado com sucesso.",
        cliente,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        res.status(409).json({ error: "Já existe um cliente com esse e-mail." });
        return;
      }

      next(error);
    }
  };
}
