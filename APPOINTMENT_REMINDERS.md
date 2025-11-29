# Sistema de Lembretes Automáticos de Agendamentos

## 🌐 URL Base da API

**Base URL:** `https://api.consutorio.revittahcare.com.br`

Todos os endpoints abaixo devem ser prefixados com esta URL base.

## 📋 Descrição

Sistema automatizado que envia lembretes via WhatsApp para clientes que possuem agendamentos previstos para iniciar **daqui a 1 hora**.

## 🔧 Configuração

### Instalação

O sistema usa **Baileys** (@whiskeysockets/baileys) para integração com WhatsApp.

As dependências já estão instaladas. Não são necessárias variáveis de ambiente adicionais.

### Configuração do WhatsApp

O sistema possui endpoints para configurar e gerenciar a conexão com o WhatsApp:

#### 1. Conectar ao WhatsApp

**POST** `https://api.consutorio.revittahcare.com.br/api/whatsapp/connect`

Inicia a conexão com o WhatsApp. Se não houver credenciais salvas, retorna um QR Code.

**Resposta:**
```json
{
  "success": true,
  "status": "qr_code_ready",
  "message": "Escaneie o QR Code com o WhatsApp",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

#### 2. Verificar Status

**GET** `https://api.consutorio.revittahcare.com.br/api/whatsapp/status`

Verifica o status atual da conexão.

**Resposta:**
```json
{
  "success": true,
  "connected": true,
  "status": "connected",
  "message": "Conectado como Nome do Usuário"
}
```

#### 3. Obter QR Code

**GET** `https://api.consutorio.revittahcare.com.br/api/whatsapp/qr-code`

Retorna o QR Code atual se disponível. Use este endpoint para atualizar o QR Code na interface.

#### 4. Desconectar

**DELETE** `https://api.consutorio.revittahcare.com.br/api/whatsapp/disconnect`

Desconecta do WhatsApp mantendo as credenciais salvas.

#### 5. Limpar Autenticação

**DELETE** `https://api.consutorio.revittahcare.com.br/api/whatsapp/clear-auth`

Remove as credenciais salvas e força a geração de um novo QR Code. Use para conectar com outra conta.

### Fluxo de Conexão

1. Chame `POST https://api.consutorio.revittahcare.com.br/api/whatsapp/connect`
2. Se retornar `qrCode`, exiba na interface e peça para o usuário escanear
3. Monitore o status com `GET https://api.consutorio.revittahcare.com.br/api/whatsapp/status` até conectar
4. Após conectar, as credenciais são salvas automaticamente na pasta `.wabauth`

### Migração do Banco de Dados

Execute a migration para criar a tabela de logs de notificações:

```bash
npx prisma migrate dev
```

## 🚀 Funcionamento

### Rota Automatizada

**POST** `https://api.consutorio.revittahcare.com.br/api/appointments/send-reminders`

Esta rota é chamada automaticamente por um **cron job a cada 5 minutos**.

A rota:
1. Busca agendamentos que ocorrem em **1 hora** (com janela de 5 minutos)
2. Filtra agendamentos com status diferente de `CANCELLED` e `COMPLETED`
3. Verifica se já foi enviada notificação para evitar duplicatas
4. Envia mensagem via WhatsApp usando Baileys
5. Registra log de cada tentativa (sucesso ou falha)

### Cron Job

O cron job está configurado para executar a cada 5 minutos:

```typescript
@Cron('*/5 * * * *', {
  name: 'send-appointment-reminders',
  timeZone: 'America/Sao_Paulo',
})
```

### Mensagem Enviada

A mensagem personalizada inclui:
- Nome do cliente
- Nome do serviço
- Nome do profissional (se houver)
- Nome do parceiro (se houver)
- Horário do agendamento

Exemplo:
```
Olá João Silva! 👋

Lembrete: você tem um agendamento daqui a 1 hora.

📅 Serviço: Limpeza de Pele
👨‍⚕️ Profissional: Maria Santos
⏰ Horário: 14:00

Caso precise reprogramar, estamos à disposição.
```

## 📊 Logs

Todos os envios são registrados na tabela `AppointmentNotificationLog` com:
- Status (PENDING, SENT, FAILED)
- Mensagem enviada
- Data/hora do envio
- Mensagem de erro (se houver)
- Canal utilizado (WHATSAPP)

## 🔍 Regras de Negócio

1. **Filtro de Status**: Apenas agendamentos com status diferente de `CANCELLED` e `COMPLETED` recebem lembretes
2. **Janela de Tempo**: Agendamentos que ocorrem entre 1h e 1h05min recebem notificação
3. **Prevenção de Duplicatas**: Sistema verifica se já existe log de notificação enviada para o agendamento
4. **Validação de Telefone**: Clientes sem telefone cadastrado não recebem notificação

## 🛠️ Teste Manual

Para testar manualmente, você pode chamar a rota:

```bash
curl -X POST https://api.consutorio.revittahcare.com.br/api/appointments/send-reminders \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📝 Estrutura do Banco de Dados

### Tabela: AppointmentNotificationLog

```sql
CREATE TABLE "AppointmentNotificationLog" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "channel" "ReminderChannel" NOT NULL DEFAULT 'WHATSAPP',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppointmentNotificationLog_pkey" PRIMARY KEY ("id")
);
```

## ⚠️ Troubleshooting

### Notificações não estão sendo enviadas

1. Verifique se o WhatsApp está conectado (status da conexão)
2. Verifique se você escaneou o QR Code na primeira execução
3. Verifique os logs da aplicação para erros
4. Verifique se o cron job está sendo executado (logs do scheduler)

### Erro: "Não conectado ao WhatsApp"

1. Chame o endpoint `POST https://api.consutorio.revittahcare.com.br/api/whatsapp/connect` para iniciar a conexão
2. Se retornar um QR Code, escaneie com o WhatsApp
3. Monitore o status com `GET https://api.consutorio.revittahcare.com.br/api/whatsapp/status`
4. Se a conexão foi perdida, chame `POST https://api.consutorio.revittahcare.com.br/api/whatsapp/connect` novamente
5. As credenciais são salvas automaticamente na pasta `.wabauth`

### Exemplo de Uso

```bash
# 1. Conectar
curl -X POST https://api.consutorio.revittahcare.com.br/api/whatsapp/connect \
  -H "Authorization: Bearer SEU_TOKEN"

# 2. Verificar status
curl -X GET https://api.consutorio.revittahcare.com.br/api/whatsapp/status \
  -H "Authorization: Bearer SEU_TOKEN"

# 3. Obter QR Code (se necessário)
curl -X GET https://api.consutorio.revittahcare.com.br/api/whatsapp/qr-code \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Erro: "Cliente não possui telefone cadastrado"

Certifique-se de que todos os clientes têm o campo `phone` preenchido na tabela `Client`.

