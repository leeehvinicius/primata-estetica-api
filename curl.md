# 📌 Documentação: Lógica de Ponto (Hora Extra)

## Visão Geral

Este documento explica a lógica de cálculo de ponto eletrônico com suporte a hora extra, considerando atendimentos agendados. A validação é feita automaticamente no momento do registro de ponto.

---

## 🔄 Fluxo de Validação

### 1. **Sem Atendimento Registrado**

Quando **não há atendimento** agendado para o dia:

- ✅ **Compara a hora atual com o horário padrão de atendimento**
- ✅ **Bloqueia** registro se for **antes** do horário padrão de início
- ✅ **Permite** registro se for **dentro ou após** o horário padrão
- ⏰ Horas extras serão calculadas posteriormente se o registro for após o horário padrão de término

**Horário Padrão:**
- Início: `08:00` (ou conforme configuração do usuário)
- Término: `18:00` (ou conforme configuração do usuário)

### 2. **Com Atendimento Agendado até 20:00**

Quando **há atendimento agendado** com término até 20:00:

- ✅ **Considera o horário como válido**
- ✅ **Permite registro** de ponto
- ⏰ **Contabiliza hora extra** conforme necessário no cálculo posterior

### 3. **Com Atendimento Após 20:00**

Quando há atendimento agendado após 20:00:

- ✅ **Permite registro** (será tratado como hora extra)
- ⏰ **Contabiliza hora extra** no cálculo

---

## 📡 Endpoints da API

### Base URL
```
http://localhost:3000/api/time-tracking
```

### Autenticação
Todos os endpoints requerem autenticação via JWT Bearer Token.

---

## 🔐 1. Registrar Ponto Eletrônico

### Endpoint
```
POST /time-tracking/register
```

### Descrição
Registra um ponto eletrônico com validação automática de horário considerando atendimentos agendados.

### Headers
```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "type": "ENTRADA",
  "photoData": "base64_encoded_image_string",
  "location": {
    "latitude": -23.5505,
    "longitude": -46.6333,
    "accuracy": 10,
    "address": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "country": "Brasil"
  },
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Android",
    "browser": "Chrome",
    "deviceType": "mobile"
  },
  "notes": "Observações opcionais"
}
```

### Tipos de Registro (`type`)
- `ENTRADA` - Entrada no trabalho
- `SAIDA` - Saída do trabalho
- `INTERVALO` - Intervalo (almoço, café, etc.)
- `RETORNO` - Retorno do intervalo

### Exemplo cURL

#### Caso 1: Registro de Entrada (Sem Atendimento)
```bash
curl -X POST "http://localhost:3000/api/time-tracking/register" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ENTRADA",
    "photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "location": {
      "latitude": -23.5505,
      "longitude": -46.6333,
      "accuracy": 10,
      "address": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "country": "Brasil"
    },
    "deviceInfo": {
      "platform": "Android",
      "browser": "Chrome",
      "deviceType": "mobile"
    }
  }'
```

#### Caso 2: Registro de Saída (Com Atendimento até 20:00)
```bash
curl -X POST "http://localhost:3000/api/time-tracking/register" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SAIDA",
    "photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "location": {
      "latitude": -23.5505,
      "longitude": -46.6333,
      "accuracy": 10
    },
    "notes": "Saída após atendimento agendado"
  }'
```

### Resposta de Sucesso (201 Created)
```json
{
  "id": "clx1234567890abcdef",
  "userId": "user123",
  "cpf": "123.456.789-00",
  "photoUrl": "https://storage.example.com/photos/user123/photo.jpg",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "country": "Brasil",
  "timestamp": "2024-01-15T19:30:00.000Z",
  "type": "SAIDA",
  "status": "PENDING",
  "notes": "Saída após atendimento agendado",
  "createdAt": "2024-01-15T19:30:00.000Z",
  "updatedAt": "2024-01-15T19:30:00.000Z",
  "user": {
    "id": "user123",
    "email": "profissional@example.com",
    "name": "João Silva",
    "profile": {
      "role": "MEDICO",
      "document": "123.456.789-00"
    }
  }
}
```

### Respostas de Erro

#### 400 Bad Request - Registro Antes do Horário Padrão
```json
{
  "statusCode": 400,
  "message": "Registro de ponto antes do horário padrão de atendimento (08:00)",
  "error": "Bad Request"
}
```

#### 400 Bad Request - Registro Recente Duplicado
```json
{
  "statusCode": 400,
  "message": "Já existe um registro recente deste tipo",
  "error": "Bad Request"
}
```

#### 400 Bad Request - Localização Inválida
```json
{
  "statusCode": 400,
  "message": "Localização fora dos locais permitidos",
  "error": "Bad Request"
}
```

---

## 📋 2. Listar Registros de Ponto

### Endpoint
```
GET /time-tracking
```

### Query Parameters
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)
- `sortBy` (opcional): Campo para ordenação (padrão: 'timestamp')
- `sortOrder` (opcional): Ordem (asc/desc, padrão: 'desc')
- `type` (opcional): Filtrar por tipo (ENTRADA, SAIDA, INTERVALO, RETORNO)
- `status` (opcional): Filtrar por status (PENDING, APPROVED, REJECTED, UNDER_REVIEW)
- `startDate` (opcional): Data inicial (ISO 8601)
- `endDate` (opcional): Data final (ISO 8601)

### Exemplo cURL
```bash
curl -X GET "http://localhost:3000/api/time-tracking?page=1&limit=10&type=ENTRADA&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Resposta (200 OK)
```json
{
  "data": [
    {
      "id": "clx1234567890abcdef",
      "userId": "user123",
      "type": "ENTRADA",
      "timestamp": "2024-01-15T08:00:00.000Z",
      "status": "APPROVED",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "address": "Rua das Flores, 123",
      "user": {
        "id": "user123",
        "name": "João Silva",
        "profile": {
          "role": "MEDICO"
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## ⚙️ 3. Configurar Horário Padrão de Atendimento

### Endpoint
```
PUT /time-tracking/settings/my
```

### Descrição
Define o horário padrão de atendimento do usuário. Este horário será usado na validação quando não houver atendimentos agendados.

### Body (JSON)
```json
{
  "workingHours": {
    "startTime": "08:00",
    "endTime": "18:00",
    "allowWeekends": false
  },
  "requirePhoto": true,
  "requireLocation": true,
  "timezone": "America/Sao_Paulo"
}
```

### Exemplo cURL
```bash
curl -X PUT "http://localhost:3000/api/time-tracking/settings/my" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "workingHours": {
      "startTime": "08:00",
      "endTime": "18:00",
      "allowWeekends": false
    },
    "requirePhoto": true,
    "requireLocation": true,
    "timezone": "America/Sao_Paulo"
  }'
```

### Resposta (200 OK)
```json
{
  "id": "settings123",
  "userId": "user123",
  "requirePhoto": true,
  "requireLocation": true,
  "workingHours": {
    "startTime": "08:00",
    "endTime": "18:00",
    "allowWeekends": false
  },
  "timezone": "America/Sao_Paulo",
  "autoApproval": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

## 📊 4. Buscar Configurações

### Endpoint
```
GET /time-tracking/settings/my
```

### Exemplo cURL
```bash
curl -X GET "http://localhost:3000/api/time-tracking/settings/my" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ✅ 5. Validar Registro de Ponto

### Endpoint
```
PUT /time-tracking/validate
```

### Descrição
Permite que administradores ou médicos validem (aprovar/rejeitar) registros de ponto.

### Body (JSON)
```json
{
  "timeTrackingId": "clx1234567890abcdef",
  "action": "APPROVE",
  "reason": "Registro válido",
  "additionalInfo": "Atendimento confirmado até 20:00"
}
```

### Ações (`action`)
- `APPROVE` - Aprovar registro
- `REJECT` - Rejeitar registro
- `REQUEST_INFO` - Solicitar mais informações

### Exemplo cURL
```bash
curl -X PUT "http://localhost:3000/api/time-tracking/validate" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "timeTrackingId": "clx1234567890abcdef",
    "action": "APPROVE",
    "reason": "Registro válido com atendimento até 20:00"
  }'
```

---

## 📈 6. Gerar Relatório de Ponto

### Endpoint
```
POST /time-tracking/reports/generate
```

### Descrição
Gera um relatório de horas trabalhadas com cálculo de horas regulares e extras.

### Body (JSON)
```json
{
  "userId": "user123",
  "periodStart": "2024-01-01T00:00:00.000Z",
  "periodEnd": "2024-01-31T23:59:59.999Z",
  "notes": "Relatório mensal - Janeiro 2024"
}
```

### Exemplo cURL
```bash
curl -X POST "http://localhost:3000/api/time-tracking/reports/generate" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "periodStart": "2024-01-01T00:00:00.000Z",
    "periodEnd": "2024-01-31T23:59:59.999Z",
    "notes": "Relatório mensal - Janeiro 2024"
  }'
```

### Resposta (201 Created)
```json
{
  "id": "report123",
  "userId": "user123",
  "periodStart": "2024-01-01T00:00:00.000Z",
  "periodEnd": "2024-01-31T23:59:59.999Z",
  "totalHours": 180.5,
  "regularHours": 160.0,
  "overtimeHours": 20.5,
  "breakHours": 20.0,
  "daysWorked": 22,
  "daysAbsent": 0,
  "status": "PENDING",
  "notes": "Relatório mensal - Janeiro 2024",
  "createdAt": "2024-02-01T10:00:00.000Z"
}
```

---

## 🎯 Casos de Uso no App

### Caso 1: Registro de Entrada (08:00 - Sem Atendimento)
```javascript
// App envia requisição de entrada às 08:00
// Sistema valida: está dentro do horário padrão ✅
// Registro é criado com status PENDING
```

### Caso 2: Registro de Entrada (07:30 - Sem Atendimento)
```javascript
// App envia requisição de entrada às 07:30
// Sistema valida: está antes do horário padrão ❌
// Retorna erro: "Registro de ponto antes do horário padrão de atendimento (08:00)"
```

### Caso 3: Registro de Saída (19:00 - Com Atendimento até 20:00)
```javascript
// Usuário tem atendimento agendado até 19:30
// App envia requisição de saída às 19:00
// Sistema valida: há atendimento até 20:00 ✅
// Registro é criado (hora extra será calculada no relatório)
```

### Caso 4: Registro de Saída (21:00 - Com Atendimento até 20:00)
```javascript
// Usuário tem atendimento agendado até 19:30
// App envia requisição de saída às 21:00
// Sistema valida: há atendimento até 20:00 ✅
// Registro é criado (hora extra será calculada no relatório)
```

### Caso 5: Registro de Saída (18:30 - Sem Atendimento)
```javascript
// Não há atendimento agendado
// App envia requisição de saída às 18:30
// Sistema valida: está após o horário padrão de término (18:00) ✅
// Registro é criado (hora extra será calculada no relatório)
```

---

## 🔍 Como o Sistema Busca Atendimentos

O sistema busca atendimentos do dia atual onde o usuário está envolvido:

1. **Atendimentos onde o usuário é o profissional:**
   - Busca `Professional` pelo email do usuário
   - Busca `Appointment` onde `professionalId` corresponde ao profissional

2. **Atendimentos criados pelo usuário:**
   - Busca `Appointment` onde `createdBy` corresponde ao `userId`

3. **Status considerados:**
   - `SCHEDULED` - Agendado
   - `CONFIRMED` - Confirmado
   - `IN_PROGRESS` - Em andamento

---

## ⚠️ Observações Importantes

1. **Horário Padrão:**
   - Se o usuário não tiver configuração, usa `08:00` às `18:00` como padrão
   - Configure o horário padrão via endpoint de settings

2. **Hora Extra:**
   - A hora extra é **calculada posteriormente** nos relatórios
   - A validação apenas **permite ou bloqueia** o registro
   - Horas após o horário padrão de término são consideradas extras

3. **Atendimentos:**
   - Apenas atendimentos com status `SCHEDULED`, `CONFIRMED` ou `IN_PROGRESS` são considerados
   - Atendimentos cancelados ou concluídos não são considerados

4. **Localização:**
   - Se `requireLocation` estiver ativo nas configurações, a localização é obrigatória
   - A localização é validada contra locais permitidos configurados

5. **Foto:**
   - Se `requirePhoto` estiver ativo nas configurações, a foto é obrigatória
   - A foto deve ser enviada em base64 no campo `photoData`

---

## 📱 Exemplo de Implementação no App

### React Native / Flutter

```javascript
// Exemplo de função para registrar ponto
async function registrarPonto(tipo, fotoBase64, localizacao) {
  try {
    const response = await fetch('http://localhost:3000/api/time-tracking/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: tipo, // 'ENTRADA', 'SAIDA', 'INTERVALO', 'RETORNO'
        photoData: fotoBase64,
        location: {
          latitude: localizacao.latitude,
          longitude: localizacao.longitude,
          accuracy: localizacao.accuracy,
        },
        deviceInfo: {
          platform: Platform.OS,
          deviceType: 'mobile',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao registrar ponto:', error);
    throw error;
  }
}

// Uso
registrarPonto('ENTRADA', fotoBase64, { latitude: -23.5505, longitude: -46.6333 })
  .then(resultado => {
    console.log('Ponto registrado:', resultado);
    // Mostrar mensagem de sucesso
  })
  .catch(erro => {
    console.error('Erro:', erro.message);
    // Mostrar mensagem de erro ao usuário
  });
```

---

## 🔗 Endpoints Relacionados

- **Agendamentos:** `GET /appointments` - Para verificar atendimentos do dia
- **Profissionais:** `GET /professionals` - Para buscar informações do profissional
- **Usuários:** `GET /users/me` - Para obter informações do usuário logado

---

## 📝 Notas de Desenvolvimento

- A validação de horário é feita **automaticamente** no momento do registro
- Não é necessário fazer chamadas adicionais para validar horário
- O sistema busca atendimentos automaticamente baseado no usuário logado
- Horas extras são calculadas nos relatórios, não na validação

---

**Última atualização:** Janeiro 2024

