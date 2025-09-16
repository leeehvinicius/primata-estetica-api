# CRUD de Agendamentos - Primata Estética API

## **🔐 AUTENTICAÇÃO**
```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS**

### **1. CREATE - Criar Agendamento**
```bash
POST /api/appointments
```
**Body:**
```json
{
  "clientId": "client123",
  "professionalId": "professional123",
  "serviceId": "service123",
  "scheduledDate": "2024-12-25",
  "startTime": "14:00",
  "agreementId": "agreement123",
  "appointmentType": "CONSULTATION",
  "priority": "NORMAL",
  "notes": "Primeira consulta"
}
```

Se "agreementId" for informado, o sistema calculará automaticamente o desconto do parceiro (convênio) para o serviço com base nas regras de desconto cadastradas e retornará no objeto do agendamento o campo "pricing" com:

```json
{
  "pricing": {
    "amount": 200.00,
    "partnerDiscountPercentage": 20.00,
    "partnerDiscountAmount": 40.00,
    "finalAmount": 160.00,
    "agreementId": "agreement123"
  }
}
```

### **2. READ - Listar Agendamentos**
```bash
GET /api/appointments?page=1&limit=10&status=SCHEDULED
```

### **3. READ - Buscar por ID**
```bash
GET /api/appointments/{id}
```

### **4. UPDATE - Atualizar**
```bash
PUT /api/appointments/{id}
```
**Body:**
```json
{
  "status": "CONFIRMED",
  "notes": "Cliente confirmou"
}
```

### **5. DELETE - Deletar**
```bash
DELETE /api/appointments/{id}
```

### **6. CANCELAR**
```bash
PATCH /api/appointments/{id}/cancel
```
**Body:**
```json
{
  "reason": "Cliente solicitou cancelamento"
}
```

### **7. REMARCAR**
```bash
PATCH /api/appointments/{id}/reschedule
```
**Body:**
```json
{
  "newDate": "2024-12-26",
  "newTime": "15:00"
}
```

### **8. DISPONIBILIDADE**
```bash
GET /api/appointments/availability/2024-12-25?professionalId=professional123
```

### **9. ESTATÍSTICAS**
```bash
GET /api/appointments/stats/overview
```

## **📊 ENUMS**

### **AppointmentType:**
- `CONSULTATION` - Consulta
- `TREATMENT` - Tratamento
- `PROCEDURE` - Procedimento
- `FOLLOW_UP` - Retorno
- `EMERGENCY` - Emergência
- `MAINTENANCE` - Manutenção
- `EVALUATION` - Avaliação
- `OTHER` - Outro

### **AppointmentStatus:**
- `SCHEDULED` - Agendado
- `CONFIRMED` - Confirmado
- `IN_PROGRESS` - Em andamento
- `COMPLETED` - Concluído
- `CANCELLED` - Cancelado
- `NO_SHOW` - Não compareceu
- `RESCHEDULED` - Remarcado
- `WAITING` - Aguardando

### **AppointmentPriority:**
- `LOW` - Baixa
- `NORMAL` - Normal
- `HIGH` - Alta
- `URGENT` - Urgente

## **⚠️ PERMISSÕES**
- **ADMINISTRADOR, MEDICO, RECEPCIONISTA**: Criar, atualizar, cancelar, remarcar
- **ADMINISTRADOR, RECEPCIONISTA**: Deletar
- **Todos**: Visualizar e verificar disponibilidade

## **🚀 EXEMPLO RÁPIDO**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@primata.com", "password": "admin123"}'

# Criar agendamento
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"clientId": "client123", "serviceId": "service123", "scheduledDate": "2024-12-25", "startTime": "14:00", "appointmentType": "CONSULTATION"}'

# Listar
curl -X GET "http://localhost:3000/api/appointments" \
  -H "Authorization: Bearer {token}"
```
