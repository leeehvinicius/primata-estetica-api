# Adição de Campo de Tratamento Formal/Pronome de Cortesia

## Data
Janeiro 2025

## Descrição
Foi adicionado um campo para seleção de tratamento formal/pronome de cortesia no cadastro de pacientes (clientes). Este campo permite escolher entre opções pré-definidas ou inserir um valor personalizado quando a opção "Outros" for selecionada.

## Alterações Implementadas

### 1. Schema do Banco de Dados (Prisma)

#### Novo Enum: `FormalTitle`
```prisma
enum FormalTitle {
  SR    // Sr.
  SRA   // Sra.
  DR    // Dr.
  DRA   // Dra.
  PROF  // Prof.
  PROFA // Profa.
  OTHER // Outros
}
```

#### Novos Campos no Modelo `Client`
```prisma
model Client {
  // ... campos existentes
  formalTitle      FormalTitle? // Tratamento formal/pronome de cortesia
  formalTitleOther String?      // Campo livre para "Outros"
  // ... demais campos
}
```

### 2. DTOs Atualizados

#### `CreateClientDto`
- Adicionado campo `formalTitle?: FormalTitle` (opcional)
- Adicionado campo `formalTitleOther?: string` (opcional)

#### `UpdateClientDto`
- Adicionado campo `formalTitle?: FormalTitle` (opcional)
- Adicionado campo `formalTitleOther?: string` (opcional)

#### `ClientResponseDto`
- Adicionado campo `formalTitle?: FormalTitle` (opcional)
- Adicionado campo `formalTitleOther?: string` (opcional)

### 3. Service Atualizado

#### `ClientsService`
- Método `create()`: Processa os campos `formalTitle` e `formalTitleOther` ao criar um novo cliente
- Método `update()`: Processa os campos `formalTitle` e `formalTitleOther` ao atualizar um cliente existente

## Valores Disponíveis

O campo `formalTitle` aceita os seguintes valores:

| Valor | Descrição |
|-------|-----------|
| `SR` | Sr. |
| `SRA` | Sra. |
| `DR` | Dr. |
| `DRA` | Dra. |
| `PROF` | Prof. |
| `PROFA` | Profa. |
| `OTHER` | Outros (requer `formalTitleOther`) |

## Como Usar

### Exemplo 1: Cadastro com tratamento "Dr."
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "91999999999",
  "gender": "MALE",
  "formalTitle": "DR",
  "formalTitleOther": null,
  "document": "12345678900",
  "isActive": true,
  "termsAccepted": true
}
```

### Exemplo 2: Cadastro com tratamento "Sra."
```json
{
  "name": "Maria Santos",
  "email": "maria@email.com",
  "phone": "91988888888",
  "gender": "FEMALE",
  "formalTitle": "SRA",
  "formalTitleOther": null,
  "document": "98765432100",
  "isActive": true,
  "termsAccepted": true
}
```

### Exemplo 3: Cadastro com tratamento personalizado "Outros"
```json
{
  "name": "Carlos Oliveira",
  "email": "carlos@email.com",
  "phone": "91977777777",
  "gender": "MALE",
  "formalTitle": "OTHER",
  "formalTitleOther": "Eng.",
  "document": "11122233344",
  "isActive": true,
  "termsAccepted": true
}
```

### Exemplo 4: Cadastro sem tratamento formal (campo opcional)
```json
{
  "name": "Ana Costa",
  "email": "ana@email.com",
  "phone": "91966666666",
  "gender": "FEMALE",
  "document": "55566677788",
  "isActive": true,
  "termsAccepted": true
}
```

## Endpoint

### POST `/api/clients`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
Incluir os campos `formalTitle` e `formalTitleOther` conforme necessário.

## Validações

- O campo `formalTitle` é opcional
- O campo `formalTitleOther` é opcional
- Se `formalTitle` for `OTHER`, recomenda-se preencher `formalTitleOther` com o texto desejado
- O campo `formalTitle` aceita apenas os valores do enum `FormalTitle`

## Migração do Banco de Dados

A alteração foi aplicada ao banco de dados usando `prisma db push`. Os campos foram adicionados como opcionais, então não há impacto em registros existentes.

## Arquivos Modificados

1. `prisma/schema.prisma` - Adicionado enum e campos no modelo Client
2. `src/clients/dto/create-client.dto.ts` - Adicionados campos no DTO de criação
3. `src/clients/dto/update-client.dto.ts` - Adicionados campos no DTO de atualização
4. `src/clients/dto/client-response.dto.ts` - Adicionados campos no DTO de resposta
5. `src/clients/clients.service.ts` - Atualizado processamento dos campos

## Observações

- Os campos são totalmente opcionais, mantendo compatibilidade com cadastros existentes
- Quando `formalTitle` for `OTHER`, o campo `formalTitleOther` deve ser preenchido para especificar o tratamento desejado
- O campo `formalTitleOther` é ignorado quando `formalTitle` não é `OTHER`

