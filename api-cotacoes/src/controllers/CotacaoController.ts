import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { NotificacaoService } from "../services/NotificacaoService";

type ItemCotacaoInput = {
  produtoId: string;
  quantidade: number;
};

type CriarCotacaoInput = {
  clienteId: string;
  pontoDeVendaId: string;
  mensagem?: string;
  itens: ItemCotacaoInput[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCriarCotacaoInput(value: unknown): CriarCotacaoInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const { clienteId, pontoDeVendaId, mensagem, itens } = value;
  if (
    typeof clienteId !== "string" ||
    clienteId.trim() === "" ||
    typeof pontoDeVendaId !== "string" ||
    pontoDeVendaId.trim() === "" ||
    (mensagem !== undefined && typeof mensagem !== "string") ||
    !Array.isArray(itens) ||
    itens.length === 0
  ) {
    return null;
  }

  const parsedItems: ItemCotacaoInput[] = [];
  for (const item of itens) {
    if (
      !isRecord(item) ||
      typeof item.produtoId !== "string" ||
      item.produtoId.trim() === "" ||
      typeof item.quantidade !== "number" ||
      !Number.isInteger(item.quantidade) ||
      item.quantidade <= 0
    ) {
      return null;
    }

    parsedItems.push({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
    });
  }

  return {
    clienteId,
    pontoDeVendaId,
    ...(typeof mensagem === "string" ? { mensagem } : {}),
    itens: parsedItems,
  };
}

export class CotacaoController {
  static criar: RequestHandler = async (req, res, next) => {
    const input = parseCriarCotacaoInput(req.body);
    if (!input) {
      res.status(400).json({
        error:
          "Informe clienteId, pontoDeVendaId e ao menos um item com produtoId e quantidade positiva.",
      });
      return;
    }

    try {
      const [cliente, pontoDeVenda, produtos] = await Promise.all([
        prisma.cliente.findUnique({
          where: { identificador: input.clienteId },
        }),
        prisma.pontoDeVenda.findUnique({
          where: { identificador: input.pontoDeVendaId },
        }),
        prisma.produto.findMany({
          where: {
            identificador: { in: input.itens.map((item) => item.produtoId) },
            ativo: true,
          },
        }),
      ]);

      if (!cliente) {
        res.status(404).json({ error: "Cliente não encontrado." });
        return;
      }

      if (!pontoDeVenda) {
        res.status(404).json({ error: "Ponto de venda não encontrado." });
        return;
      }

      const produtosPorId = new Map(
        produtos.map((produto) => [produto.identificador, produto]),
      );
      const itensParaCriar: Array<{
        produtoId: string;
        quantidade: number;
        precoUnitario: number;
      }> = [];
      for (const item of input.itens) {
        const produto = produtosPorId.get(item.produtoId);
        if (!produto) {
          res.status(404).json({
            error: `Produto não encontrado ou inativo: ${item.produtoId}.`,
          });
          return;
        }

        itensParaCriar.push({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: produto.precoBase,
        });
      }

      const novaCotacao = await prisma.cotacao.create({
        data: {
          identificadorCliente: input.clienteId,
          identificadorPontoDeVenda: input.pontoDeVendaId,
          ...(input.mensagem === undefined ? {} : { mensagem: input.mensagem }),
          itens: {
            create: itensParaCriar.map((item) => ({
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              produto: {
                connect: { identificador: item.produtoId },
              },
            })),
          },
        },
        include: {
          itens: { include: { produto: true } },
          pontoDeVenda: true,
        },
      });

      await Promise.all([
        NotificacaoService.enviarEmail(cliente.email, novaCotacao.identificador),
        NotificacaoService.dispararWebhook({
          evento: "COTACAO_CRIADA",
          cotacaoId: novaCotacao.identificador,
        }),
      ]);

      res.status(201).json({
        mensagem: "Cotação criada com sucesso!",
        cotacao: novaCotacao,
        whatsappUrl: NotificacaoService.gerarLinkWhatsApp(
          cliente.telefone,
          novaCotacao.identificador,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

}

export const tratarErroApi: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "O corpo da requisição não contém um JSON válido." });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    res.status(404).json({ error: "Registro relacionado não encontrado." });
    return;
  }

  console.error("Erro ao processar requisição:", error);
  res.status(500).json({ error: "Erro interno ao processar a requisição." });
};
