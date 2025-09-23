# CRUD de Ponto Eletrônico - Primata Estética API

## **📋 ENDPOINTS**

### **1. REGISTRAR PONTO - Criar registro de ponto**
```bash
curl -X POST http://localhost:3000/api/time-tracking/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "type": "CHECK_IN",
    "photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "location": {
      "latitude": -23.55052,
      "longitude": -46.633308,
      "accuracy": 12.5,
      "address": "Av. Paulista, 1000",
      "city": "São Paulo",
      "state": "SP",
      "country": "BR"
    },
    "deviceInfo": {
      "userAgent": "Mozilla/5.0 ...",
      "platform": "Windows",
      "browser": "Chrome",
      "deviceType": "Desktop"
    },
    "ipAddress": "189.10.10.10",
    "notes": "Início do expediente"
  }'
```
**Body (RegisterTimeTrackingDto):**
- **type** (enum): Tipo do ponto (ex.: CHECK_IN, CHECK_OUT).
- **photoData** (string, opcional): Base64 da foto do usuário.
- **photoUrl** (string, opcional): URL de foto já armazenada.
- **location** (objeto, opcional): latitude, longitude, accuracy, address, city, state, country.
- **deviceInfo** (objeto, opcional): userAgent, platform, browser, deviceType.
- **ipAddress** (string, opcional)
- **notes** (string, opcional)

**Retorna (exemplo):**
```json
{
  "id": "tt_01hr8b2j1w7z1m2n3o",
  "userId": "usr_01hqxabc123",
  "type": "CHECK_IN",
  "status": "PENDING",
  "timestamp": "2024-01-01T08:00:00.000Z",
  "location": { "latitude": -23.55052, "longitude": -46.633308, "accuracy": 12.5 },
  "photoUrl": "https://cdn.local/ponto/tt_01hr8b2...jpg"
}
```

---

### **2. LISTAR REGISTROS - Buscar registros de ponto**
```bash
curl -X GET "http://localhost:3000/api/time-tracking?startDate=2024-01-01&endDate=2024-01-31&type=CHECK_IN&status=PENDING&page=1&limit=10&sortBy=timestamp&sortOrder=desc" \
  -H "Authorization: Bearer {access_token}"
```
**Parâmetros de Query (TimeTrackingQueryDto):**
- **userId** (string, opcional)
- **cpf** (string, opcional)
- **type** (enum, opcional): CHECK_IN, CHECK_OUT, etc.
- **status** (enum, opcional): PENDING, APPROVED, REJECTED, etc.
- **startDate** (ISO date, opcional)
- **endDate** (ISO date, opcional)
- **page** (number, opcional, padrão: 1)
- **limit** (number, opcional, padrão: 10, max: 100)
- **sortBy** (string, opcional, padrão: timestamp)
- **sortOrder** ("asc" | "desc", opcional, padrão: desc)

**Retorna (exemplo):**
```json
{
  "items": [
    {
      "id": "tt_01hr8b2j1w7z1m2n3o",
      "type": "CHECK_IN",
      "status": "APPROVED",
      "timestamp": "2024-01-01T08:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

---

### **3. BUSCAR POR ID - Obter registro de ponto por ID**
```bash
curl -X GET http://localhost:3000/api/time-tracking/{timeTracking_id} \
  -H "Authorization: Bearer {access_token}"
```
**Retorna (exemplo):**
```json
{
  "id": "tt_01hr8b2j1w7z1m2n3o",
  "userId": "usr_01hqxabc123",
  "type": "CHECK_OUT",
  "status": "PENDING",
  "timestamp": "2024-01-01T18:02:11.000Z",
  "location": { "latitude": -23.55, "longitude": -46.63 },
  "notes": "Saída para almoço"
}
```

---

### **4. VALIDAR REGISTRO - Aprovar/Rejeitar registro**
```bash
curl -X PUT http://localhost:3000/api/time-tracking/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "timeTrackingId": "tt_01hr8b2j1w7z1m2n3o",
    "action": "APPROVE",
    "reason": "Dentro do horário",
    "additionalInfo": "Validação automática"
  }'
```
**Body (ValidateTimeTrackingDto):**
- **timeTrackingId** (string)
- **action** (enum): APPROVE ou REJECT
- **reason** (string, opcional)
- **additionalInfo** (string, opcional)

**Retorna (exemplo):**
```json
{ "success": true, "status": "APPROVED" }
```

---

### **5. MINHAS CONFIGURAÇÕES - Buscar configurações de ponto**
```bash
curl -X GET http://localhost:3000/api/time-tracking/settings/my \
  -H "Authorization: Bearer {access_token}"
```
**Retorna (exemplo):**
```json
{
  "workdayStart": "08:00",
  "workdayEnd": "18:00",
  "breakMinutes": 60,
  "geofencing": { "radiusMeters": 150, "latitude": -23.55, "longitude": -46.63 }
}
```

---

### **6. ATUALIZAR CONFIGURAÇÕES - Atualizar minhas configurações de ponto**
```bash
curl -X PUT http://localhost:3000/api/time-tracking/settings/my \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "workdayStart": "08:00",
    "workdayEnd": "17:00",
    "breakMinutes": 60
  }'
```
**Body (UpdateTimeTrackingSettingsDto):**
- Campos de configuração do ponto do usuário (ex.: workdayStart, workdayEnd, breakMinutes, geofencing, etc.).

**Retorna (exemplo):**
```json
{ "success": true }
```

---

### **7. GERAR RELATÓRIO - Criar relatório de ponto**
```bash
curl -X POST http://localhost:3000/api/time-tracking/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "userId": "usr_01hqxabc123",
    "periodStart": "2024-01-01",
    "periodEnd": "2024-01-31",
    "notes": "Fechamento mensal"
  }'
```
**Body (GenerateTimeTrackingReportDto):**
- **userId** (string)
- **periodStart** (ISO date)
- **periodEnd** (ISO date)
- **notes** (string, opcional)

**Retorna (exemplo):**
```json
{
  "id": "rpt_01hr8cdefgh",
  "status": "PENDING",
  "generatedAt": "2024-02-01T00:00:00.000Z"
}
```

---

### **8. LISTAR RELATÓRIOS - Buscar relatórios de ponto**
```bash
curl -X GET "http://localhost:3000/api/time-tracking/reports?userId=usr_01hqxabc123&status=PENDING&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer {access_token}"
```
**Parâmetros de Query (TimeTrackingReportQueryDto):**
- **userId** (string, opcional)
- **status** (enum, opcional): PENDING, APPROVED, REJECTED, etc.
- **startDate** (ISO date, opcional)
- **endDate** (ISO date, opcional)

**Retorna (exemplo):**
```json
{
  "items": [
    { "id": "rpt_01hr8cdefgh", "status": "PENDING", "period": { "start": "2024-01-01", "end": "2024-01-31" } }
  ]
}
```

---

### **9. BUSCAR RELATÓRIO POR ID - Obter relatório por ID**
```bash
curl -X GET http://localhost:3000/api/time-tracking/reports/{report_id} \
  -H "Authorization: Bearer {access_token}"
```
**Retorna (exemplo):**
```json
{ "id": "rpt_01hr8cdefgh", "message": "Relatório encontrado" }
```

---

### **10. APROVAR RELATÓRIO - Aprovar relatório de ponto**
```bash
curl -X PUT http://localhost:3000/api/time-tracking/reports/{report_id}/approve \
  -H "Authorization: Bearer {access_token}"
```
**Retorna (exemplo):**
```json
{ "id": "rpt_01hr8cdefgh", "message": "Relatório aprovado" }
```

---

### **11. CAPTURAR LOCALIZAÇÃO - Registrar localização atual**
```bash
curl -X POST http://localhost:3000/api/time-tracking/capture-location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "latitude": -23.55052,
    "longitude": -46.633308,
    "accuracy": 10
  }'
```
**Retorna (exemplo):**
```json
{
  "success": true,
  "location": {
    "latitude": -23.55052,
    "longitude": -46.633308,
    "accuracy": 10,
    "timestamp": "2024-01-01T08:00:00.000Z"
  },
  "message": "Localização capturada com sucesso"
}
```

---

### **12. CAPTURAR FOTO - Capturar foto do usuário**
```bash
curl -X POST http://localhost:3000/api/time-tracking/capture-photo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```
**Retorna (exemplo):**
```json
{
  "success": true,
  "photoUrl": "https://cdn.local/ponto/tt_01hr8b2...jpg",
  "message": "Foto capturada com sucesso"
}
```

## **🔐 PERMISSÕES E AUTENTICAÇÃO**

- **Autenticação**: Todos os endpoints exigem `Authorization: Bearer {access_token}`.
- **Validação de registro e aprovação de relatório** podem exigir permissões elevadas conforme regras de negócio.

## **📝 OBSERVAÇÕES**

- Enums como tipos de ponto, status de ponto e status de relatório seguem os valores definidos no Prisma (`TimeTrackingType`, `TimeTrackingStatus`, `ValidationAction`, `ReportStatus`).
- Datas devem estar em ISO 8601 quando requerido (ex.: `2024-01-31` ou `2024-01-31T23:59:59.000Z`).
- Para registro com foto via `photoData`, use Base64 no padrão data URL (`data:image/jpeg;base64,...`).
- A paginação padrão é `page=1` e `limit=10` quando aplicável.

