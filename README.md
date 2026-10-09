# AgendaX API

API Node.js (Express + JavaScript) com MySQL/Sequelize, organizada por features no estilo MVC.

## Estrutura

```
src/features/<feature>/
  controllers/
  models/
  repositories/
  services/
  routes/
  schemas/
  errors/
```

## Subir com Docker

```bash
cp .env.example .env
docker compose up --build
```

Se o MySQL ainda tiver schema antigo:

```bash
docker compose down -v
docker compose up --build
```

- API: http://localhost:3000
- Health: `GET /v1/health`
- MySQL (host): `localhost:3307`

## Desenvolvimento local

```bash
cp .env.example .env
docker compose up mysql -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Auth (v1)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/v1/auth/sign-up` | Cria conta pendente e envia código |
| POST | `/v1/auth/verify-email` | Confirma e-mail com OTP |
| POST | `/v1/auth/resend-code` | Reenvia OTP |
| POST | `/v1/auth/sign-in` | Login e-mail/senha |
| POST | `/v1/auth/forgot-password` | Gera código de reset |
| POST | `/v1/auth/reset-password` | Define nova senha com código |

Em desenvolvimento, o OTP vem no JSON (`code`) e no console.

Seed:

- e-mail: `williamhenrique.silva98@gmail.com`
- senha: `12345`

## Onboarding (v1)

Requer `Authorization: Bearer <accessToken>`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/onboarding` | Retorna rascunho/negócio do usuário (404 se ainda não iniciou) |
| PUT | `/v1/onboarding` | Salva rascunho (categoria, nome, cidade, WhatsApp, serviços, horários) |
| POST | `/v1/onboarding/complete` | Valida e finaliza o onboarding |

Exemplo de body:

```json
{
  "category": "beauty",
  "name": "Studio Ana",
  "city": "São Paulo",
  "whatsapp": "11999998888",
  "photoUrl": null,
  "services": [
    {
      "id": "svc-1",
      "name": "Corte",
      "durationMinutes": 45,
      "priceCents": 8000,
      "selected": true
    }
  ],
  "hours": {
    "monday": [{ "start": "09:00", "end": "18:00" }],
    "tuesday": [
      { "start": "09:00", "end": "12:00" },
      { "start": "14:00", "end": "18:00" }
    ]
  }
}
```

Categorias: `beauty`, `fitness`, `health`, `pet`, `art`, `other`.  
Dias: `sunday` … `saturday` (mesmos nomes do enum Flutter).  
Horários: faixas de expediente (`start`/`end`); os slots do cliente são gerados a partir da duração do serviço.
## Clientes (v1)

Requer `Authorization: Bearer <accessToken>`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/clients` | Lista clientes do profissional |
| POST | `/v1/clients` | Cadastra cliente |

Campos obrigatórios: `name`, `phone`.  
Opcionais: `email`, endereço (`cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `stateCode`) e `notes`.  
Se algum campo de endereço for enviado, os principais do endereço passam a ser exigidos.

## Testes

```bash
npm test
```

Usa SQLite em memória.

## App Flutter

Base URL: `http://127.0.0.1:3000/v1`  
Android emulator: `http://10.0.2.2:3000/v1`
