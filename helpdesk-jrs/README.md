# HelpDesk API com JSON REST Server (JRS)

API REST didatica, local e independente do React. O JRS usa `database.json`
como armazenamento persistente e autentica as requisicoes com JWT.

## Arquivos

- `config.yaml`: configuracao local, ignorada pelo Git.
- `database.json`: banco local editado pela API, ignorado pelo Git.
- `config.example.yaml` e `database.example.json`: modelos sem configuracao real.
- `postman/HelpDesk-JRS.postman_collection.json`: requisicoes para importar no Postman.

Os cinco tickets mantem os campos `id`, `title`, `description`, `status` e
`priority`, incluindo os valores `Media` e `Concluido`.

## Instalar e iniciar

O Dart SDK precisa estar instalado. Ative o JRS:

```powershell
dart pub global activate json_rest_server
```

Inicie o servidor a partir desta pasta:

```powershell
json_rest_server run
```

A configuracao local usa `http://127.0.0.1:8081`, pois a porta 8080 ja estava
ocupada nesta maquina. Se 8080 estiver livre em outro ambiente, ajuste `port`
em `config.yaml` e a variavel `baseUrl` da colecao Postman.

Se o comando nao for encontrado no Windows, adicione
`%LOCALAPPDATA%\Pub\Cache\bin` ao PATH ou execute:

```powershell
& "$env:LOCALAPPDATA\Pub\Cache\bin\json_rest_server.bat" run
```

Nao execute `json_rest_server create` nesta pasta: os arquivos ja estao
preparados. Para parar o servidor, use `Ctrl+C`.

## Contas ficticias de teste

| Perfil | E-mail | Senha | Login |
|---|---|---|---|
| Usuario | `usuario@helpdesk.local` | `Usuario@123` | `POST /auth` com email e password |
| Admin | `admin@helpdesk.local` | `Admin@123` | `POST /auth` com email, password e `admin: true` |

Essas senhas ficam em texto puro no banco local e sao apenas exemplos
descartaveis. Nunca reutilize senhas reais.

## Rotas

- `POST /auth`: recebe JWT (`access_token`).
- `GET /me`: dados da conta autenticada.
- `GET /tickets` e `GET /tickets/:id`: consultas autenticadas.
- `POST /tickets`, `PUT /tickets/:id`, `PATCH /tickets/:id` e
  `DELETE /tickets/:id`: operacoes CRUD, sujeitas as limitacoes abaixo.
- `GET /tickets?status=Aberto` e `GET /tickets?page=1&limit=2`: filtros e paginacao.

Envie `Authorization: Bearer TOKEN` nas rotas protegidas. O JRS pode responder
`403` quando a autenticacao ou permissao falhar.

## Testes com Postman

Importe `postman/HelpDesk-JRS.postman_collection.json`. Execute:

1. `01 - Autenticacao`: login do usuario e do administrador; os testes salvam os tokens.
2. `02 - Consultas de chamados`: consulta sem token deve ser negada; depois use o token comum.
3. `03 - CRUD administrativo`: use o token admin para criar, atualizar e excluir o ticket de teste.
4. `04 - Auditoria didatica`: consulte as limitacoes locais documentadas; nao use os exemplos fora de localhost.

## Limites e seguranca

Este servidor e somente uma simulacao para aula e teste local, vinculado a
`127.0.0.1`. Nao o publique na internet nem use dados pessoais ou senhas reais.

O JSON guarda senhas sem hash. No JRS 3.2.1, os endpoints genericos de usuarios
podem expor credenciais, `enableAdm` nao protege `PATCH` como protege POST/PUT/
DELETE, e as permissoes nao permitem validar propriedade individual de ticket.
Portanto, esta configuracao nao e apropriada para producao. Um servico real
precisa de hash de senha, validacao e autorizacao especificas por endpoint,
controle de propriedade e banco de dados apropriado.

## Referencias

- [json_rest_server no pub.dev](https://pub.dev/packages/json_rest_server)
- [Repositorio de referencia da aula](https://github.com/marcelo-ciacco/devweb/tree/main/helpdesk-jrs)
- [Repositorio do JRS](https://github.com/rodrigorahman/json_rest_server)
