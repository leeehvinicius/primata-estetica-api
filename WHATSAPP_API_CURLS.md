# Comandos cURL para API WhatsApp

## Autenticação

Todos os endpoints requerem autenticação. Substitua `SEU_TOKEN_JWT` pelo token de autenticação válido.

---

## 1. Conectar ao WhatsApp

Inicia a conexão com o WhatsApp. Se não houver credenciais salvas, retorna um QR Code.

```bash
curl -X POST http://localhost:3000/api/whatsapp/connect \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

**Resposta de sucesso (com QR Code):**
```json
{
  "success": true,
  "status": "qr_code_ready",
  "message": "Escaneie o QR Code com o WhatsApp",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Resposta se já conectado:**
```json
{
  "success": true,
  "status": "connected",
  "message": "Já conectado ao WhatsApp"
}
```

---

## 2. Verificar Status da Conexão

Verifica o status atual da conexão com o WhatsApp.

```bash
curl -X GET http://localhost:3000/api/whatsapp/status \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Resposta quando conectado:**
```json
{
  "success": true,
  "connected": true,
  "status": "connected",
  "message": "Conectado como Nome do Usuário"
}
```

**Resposta quando desconectado:**
```json
{
  "success": true,
  "connected": false,
  "status": "disconnected",
  "message": "Não conectado ao WhatsApp. Conecte usando o endpoint /whatsapp/connect"
}
```

**Resposta quando QR Code disponível:**
```json
{
  "success": true,
  "connected": false,
  "status": "qr_code_ready",
  "message": "QR Code disponível. Escaneie com o WhatsApp.",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

## 3. Obter QR Code Atual

Retorna o QR Code atual se disponível. Útil para atualizar o QR Code na interface.

```bash
curl -X GET http://localhost:3000/api/whatsapp/qr-code \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Resposta com QR Code:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "hasQRCode": true
}
```

**Resposta sem QR Code:**
```json
{
  "success": true,
  "qrCode": null,
  "hasQRCode": false
}
```

---

## 4. Desconectar do WhatsApp

Desconecta do WhatsApp mantendo as credenciais salvas.

```bash
curl -X DELETE http://localhost:3000/api/whatsapp/disconnect \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Desconectado do WhatsApp com sucesso"
}
```

---

## 5. Limpar Autenticação

Remove todas as credenciais salvas e força a geração de um novo QR Code na próxima conexão.

```bash
curl -X DELETE http://localhost:3000/api/whatsapp/clear-auth \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Autenticação limpa com sucesso. Conecte novamente para gerar novo QR Code."
}
```

---

## 6. Enviar Lembretes de Agendamentos (Manual)

Rota para enviar lembretes manualmente (normalmente executada automaticamente pelo cron).

```bash
curl -X POST http://localhost:3000/api/appointments/send-reminders \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

**Resposta:**
```json
{
  "success": true,
  "totalFound": 3,
  "sent": 2,
  "failed": 1,
  "errors": [
    {
      "appointmentId": "abc123",
      "error": "Cliente não possui telefone cadastrado"
    }
  ]
}
```

---

## Exemplo de Fluxo Completo

### Passo 1: Conectar ao WhatsApp
```bash
curl -X POST http://localhost:3000/api/whatsapp/connect \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Passo 2: Se retornar QR Code, exibir na interface
O QR Code vem no campo `qrCode` como base64. Você pode:
- Exibir diretamente: `<img src="{qrCode}" />`
- Ou converter para URL e exibir

### Passo 3: Verificar status periodicamente até conectar
```bash
# Executar a cada 2-3 segundos até status = "connected"
curl -X GET http://localhost:3000/api/whatsapp/status \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Passo 4: Após conectar, o sistema enviará lembretes automaticamente
O cron job executará a cada 5 minutos automaticamente.

---

## Notas Importantes

1. **Token JWT**: Obtenha o token fazendo login na API:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"seu@email.com","password":"suaSenha"}'
   ```

2. **Permissões**: 
   - Endpoints de conexão/desconexão requerem role `ADMINISTRADOR`
   - Endpoint de status pode ser acessado por `ADMINISTRADOR` ou `RECEPCIONISTA`

3. **QR Code**: O QR Code expira após alguns minutos. Se expirar, chame `/connect` novamente.

4. **Credenciais**: Após escanear o QR Code uma vez, as credenciais são salvas. Nas próximas conexões, não será necessário escanear novamente.

5. **Base URL**: Se sua API estiver em outro host/porta, ajuste `http://localhost:3000` conforme necessário.

