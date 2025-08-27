# CRUD Configurações - Primata Estética API

## **🔐 AUTENTICAÇÃO**
```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS**

### **1. RELATÓRIOS - Relatório de Segurança**
```bash
GET /api/security/report?startDate=2024-12-01&endDate=2024-12-31
```

### **2. AUDITORIA - Logs de Auditoria**
```bash
GET /api/security/audit-logs?page=1&limit=50&userId=user123&action=LOGIN
```

### **3. EVENTOS - Eventos de Segurança**
```bash
GET /api/security/events?page=1&limit=50&severity=HIGH&eventType=FAILED_LOGIN
```

### **4. EVENTOS - Resolver Evento**
```bash
PUT /api/security/events/{id}/resolve
```
**Body:**
```json
{
  "notes": "Evento investigado e resolvido"
}
```

### **5. SESSÕES - Listar Sessões Ativas**
```bash
GET /api/security/sessions?userId=user123
```

### **6. SESSÕES - Terminar Sessão**
```bash
DELETE /api/security/sessions/{id}
```

### **7. SESSÕES - Terminar Todas as Sessões do Usuário**
```bash
DELETE /api/security/users/{userId}/sessions
```

### **8. CONFIG - Obter Configurações**
```bash
GET /api/security/config
```

### **9. CONFIG - Atualizar Configuração**
```bash
PUT /api/security/config
```
**Body:**
```json
{
  "key": "max_login_attempts",
  "value": "5",
  "description": "Máximo de tentativas de login",
  "category": "AUTHENTICATION",
  "sensitive": false
}
```

### **10. SENHA - Validar Política**
```bash
POST /api/security/validate-password
```
**Body:**
```json
{
  "password": "MinhaSenha123!"
}
```

### **11. ESTATÍSTICAS - Estatísticas de Segurança**
```bash
GET /api/security/stats
```

## **🔑 PERMISSÕES**
- **ADMINISTRADOR**: Todos os endpoints
- **MEDICO**: Apenas validação de senha
- **RECEPCIONISTA**: Apenas validação de senha

## **📊 ENUMS**

### **AuditAction**
- `CREATE` - Criação de recurso
- `READ` - Leitura de recurso
- `UPDATE` - Atualização de recurso
- `DELETE` - Exclusão de recurso
- `LOGIN` - Login de usuário
- `LOGOUT` - Logout de usuário
- `PASSWORD_CHANGE` - Alteração de senha
- `PERMISSION_CHANGE` - Alteração de permissões
- `SESSION_START` - Início de sessão
- `SESSION_END` - Fim de sessão

### **AuditSeverity**
- `LOW` - Baixa
- `INFO` - Informativo
- `MEDIUM` - Média
- `HIGH` - Alta
- `CRITICAL` - Crítica

### **SecurityEventType**
- `FAILED_LOGIN` - Tentativa de login falhada
- `BRUTE_FORCE_ATTEMPT` - Tentativa de força bruta
- `SUSPICIOUS_ACTIVITY` - Atividade suspeita
- `UNAUTHORIZED_ACCESS` - Acesso não autorizado
- `PRIVILEGE_ESCALATION` - Escalação de privilégios
- `DATA_BREACH` - Violação de dados
- `ACCOUNT_LOCKOUT` - Bloqueio de conta

### **SecurityConfigCategory**
- `AUTHENTICATION` - Autenticação
- `AUTHORIZATION` - Autorização
- `SESSION` - Sessão
- `PASSWORD` - Senha
- `RATE_LIMITING` - Limitação de taxa
- `ENCRYPTION` - Criptografia
- `LOGGING` - Logging
- `BACKUP` - Backup
- `MONITORING` - Monitoramento

## **📝 EXEMPLO RÁPIDO**
```bash
# 1. Login para obter token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@primata.com", "password": "admin123"}'

# 2. Ver logs de auditoria
curl -X GET "http://localhost:3000/api/security/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer {token}"

# 3. Ver eventos de segurança
curl -X GET "http://localhost:3000/api/security/events?severity=HIGH" \
  -H "Authorization: Bearer {token}"

# 4. Atualizar configuração
curl -X PUT http://localhost:3000/api/security/config \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "session_timeout",
    "value": "3600",
    "description": "Timeout da sessão em segundos",
    "category": "SESSION"
  }'

# 5. Ver estatísticas
curl -X GET http://localhost:3000/api/security/stats \
  -H "Authorization: Bearer {token}"
```
