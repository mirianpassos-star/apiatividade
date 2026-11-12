# Autenticacao JWT

## Configuracao local

Copie as variaveis de `.env.example` para `.env` e configure:

- `JWT_SECRET`: segredo aleatorio com pelo menos 32 caracteres.

No PowerShell, gere um segredo para `JWT_SECRET` com:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

As contas criadas publicamente recebem perfil de cliente. O projeto nao cria
uma conta administrativa por padrao. Nao compartilhe nem versione o arquivo
`.env`.

Depois de adicionar o modelo de usuario ao banco, execute:

```powershell
npm run db:push
npm run db:generate
npm run dev
```

## Usar no Insomnia

1. Envie `POST /api/auth/register` com `nome`, `email` e `senha` para criar uma
   conta de cliente. A resposta contem um JWT nos campos `access_token` e
   `token`.
2. Para obter outro token, envie `POST /api/auth/login` com `email` e `senha`.
3. Copie o valor de `access_token` da resposta e cole em `token` no **Base
   Environment** do Insomnia.
4. As requisicoes protegidas enviam esse valor como
   `Authorization: Bearer <token>`. Tokens expiram em uma hora.

O token nao vai no body da requisicao.

## Permissoes

- Publicas: verificacao de saude, cadastro/listagem de clientes e catalogo.
- Conta autenticada: criacao de cotacao.
- Cadastro publico sempre cria perfil `CLIENTE`; nao e possivel escolher perfil
  no body.
