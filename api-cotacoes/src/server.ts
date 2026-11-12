import "dotenv/config";
import cors from "cors";
import express from "express";
import router from "./routes";
import { tratarErroApi } from "./controllers/CotacaoController";
import { prisma } from "./lib/prisma";
import { obterSegredoJwt } from "./middleware/autenticacao";

const app = express();
const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("A variável PORT deve ser uma porta válida entre 1 e 65535.");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const url = new URL(origin);
        const hostPermitido =
          (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
          (url.protocol === "http:" || url.protocol === "https:");

        if (hostPermitido) {
          callback(null, true);
          return;
        }
      } catch {
        callback(new Error("Origem não autorizada pelo CORS."));
        return;
      }

      callback(new Error("Origem não autorizada pelo CORS."));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.get("/", (_req, res) => {
  res.json({
    name: "API de cotações",
    status: "ok",
    frontend: "http://localhost:5173",
    health: "/api/health",
  });
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", router);
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});
app.use(tratarErroApi);

async function iniciarServidor(): Promise<void> {
  obterSegredoJwt();
  const server = app.listen(port, () => {
    console.log(`API de cotações disponível em http://localhost:${port}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      server.close(() => {
        void prisma.$disconnect().catch((error: unknown) => {
          console.error("Falha ao encerrar a conexão com o banco:", error);
          process.exitCode = 1;
        });
      });
    });
  }
}

void iniciarServidor().catch((error: unknown) => {
  console.error("Falha ao iniciar a API de cotações:", error);
  process.exitCode = 1;
});
