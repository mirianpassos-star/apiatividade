# Projetos de cotação e HelpDesk

Este repositório reúne dois projetos independentes:

- `api-cotacoes`: aplicação React/Vite e API Express com Prisma.
- `helpdesk-jrs`: exercício local de API REST com JSON REST Server (JRS).

O front-end não está integrado ao HelpDesk JRS. As duas aplicações têm
finalidades e formas de execução separadas.

## Aplicação de cotações

Requisitos: Node.js e PostgreSQL.

### API

No PowerShell:

```powershell
cd api-cotacoes
npm install
Copy-Item .env.example .env
```

Edite `api-cotacoes/.env` com a URL do seu PostgreSQL e um segredo JWT
aleatório. Em seguida:

```powershell
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

A API inicia em `http://localhost:3000`.

### Front-end

Em outro terminal:

```powershell
cd api-cotacoes/frontend
npm install
npm run dev
```

Use o endereço local informado pelo Vite.

## HelpDesk JRS

Requer Dart SDK e o pacote `json_rest_server`. Esta é uma simulação didática
local, independente da aplicação de cotações, e não deve ser publicada como
serviço de produção.

No PowerShell:

```powershell
cd helpdesk-jrs
Copy-Item config.example.yaml config.yaml
Copy-Item database.example.json database.json
dart pub global activate json_rest_server
json_rest_server run
```

Revise `config.yaml` antes de iniciar. Mantenha o host em `127.0.0.1`; o banco
JSON e as contas de exemplo são apenas para testes locais.

## Arquivos locais ignorados

Configurações ativas, variáveis de ambiente, banco de dados local, dependências
e saídas de build são excluídos pelo `.gitignore`. Não publique credenciais,
dados pessoais nem segredos.
