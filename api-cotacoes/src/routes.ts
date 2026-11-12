import { Router } from "express";
import type { RequestHandler } from "express";
import { prisma } from "./lib/prisma";
import { CotacaoController } from "./controllers/CotacaoController";
import { ClienteController } from "./controllers/ClienteController";
import { AuthController } from "./controllers/AuthController";
import { autenticar } from "./middleware/autenticacao";

const router = Router();

router.post("/auth/register", AuthController.registrar);
router.post("/auth/login", AuthController.entrar);

router.get("/clientes", ClienteController.listar);
router.post("/clientes", ClienteController.criar);

router.get("/produtos", (async (_req, res) => {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  res.json(produtos);
}) satisfies RequestHandler);

router.get("/pontos-de-venda", (async (req, res) => {
  const regiao = req.query.regiao;
  if (regiao !== undefined && typeof regiao !== "string") {
    res.status(400).json({ error: "O filtro regiao deve ser um texto único." });
    return;
  }

  const pontos = await prisma.pontoDeVenda.findMany({
    where: regiao ? { regiao: { equals: regiao, mode: "insensitive" } } : {},
    orderBy: { nome: "asc" },
  });
  res.json(pontos);
}) satisfies RequestHandler);

router.post("/cotacoes", autenticar, CotacaoController.criar);

export default router;
