# Módulo de Registro de Ponto Eletrônico

Este módulo implementa um sistema completo de registro de ponto eletrônico com as seguintes funcionalidades:

## Funcionalidades Principais

### 1. Registro de Ponto
- **Identificação por Login**: Usuário já logado no sistema
- **Captura de Foto**: Captura e armazenamento de foto em tempo real
- **Localização Geográfica**: Captura automática de latitude e longitude
- **Validação de Localização**: Verificação se o usuário está em local permitido
- **Tipos de Registro**: Entrada, saída, intervalo e retorno

### 2. Validação e Aprovação
- **Status de Registro**: Pendente, aprovado, rejeitado, em análise
- **Validação Manual**: Administradores podem aprovar/rejeitar registros
- **Histórico de Validações**: Registro de todas as ações de validação

### 3. Configurações
- **Configurações por Usuário**: Personalização de regras de ponto
- **Locais Permitidos**: Definição de áreas onde é permitido registrar ponto
- **Horários de Trabalho**: Configuração de horários válidos
- **Aprovação Automática**: Opção de aprovação automática de registros

### 4. Relatórios
- **Geração de Relatórios**: Relatórios de horas trabalhadas por período
- **Cálculo de Horas**: Cálculo automático de horas regulares e extras
- **Aprovação de Relatórios**: Sistema de aprovação de relatórios

## Endpoints da API

### Registro de Ponto
- `POST /time-tracking/register` - Registrar ponto eletrônico
- `POST /time-tracking/capture-location` - Capturar localização atual
- `POST /time-tracking/capture-photo` - Capturar foto do usuário

### Consulta de Registros
- `GET /time-tracking` - Listar registros de ponto
- `GET /time-tracking/:id` - Buscar registro por ID

### Validação
- `PUT /time-tracking/validate` - Validar registro de ponto

### Configurações
- `GET /time-tracking/settings/my` - Buscar configurações do usuário
- `PUT /time-tracking/settings/my` - Atualizar configurações

### Relatórios
- `POST /time-tracking/reports/generate` - Gerar relatório
- `GET /time-tracking/reports` - Listar relatórios
- `GET /time-tracking/reports/:id` - Buscar relatório por ID
- `PUT /time-tracking/reports/:id/approve` - Aprovar relatório

## Estrutura do Banco de Dados

### Tabelas Principais
- `TimeTracking` - Registros de ponto
- `TimeTrackingValidation` - Validações de registros
- `TimeTrackingSettings` - Configurações por usuário
- `TimeTrackingReport` - Relatórios de horas

### Enums
- `TimeTrackingType` - Tipos de registro (ENTRADA, SAIDA, INTERVALO, RETORNO)
- `TimeTrackingStatus` - Status do registro (PENDING, APPROVED, REJECTED, UNDER_REVIEW)
- `ValidationAction` - Ações de validação (APPROVE, REJECT, REQUEST_INFO)
- `ReportStatus` - Status do relatório (PENDING, APPROVED, REJECTED, UNDER_REVIEW)

## Serviços Auxiliares

### CpfValidationService
- Validação de CPF
- Formatação de CPF
- Limpeza de caracteres especiais

### PhotoCaptureService
- Processamento de fotos em base64
- Validação de tipos de arquivo
- Armazenamento de fotos
- Redimensionamento de imagens

### LocationService
- Validação de coordenadas
- Cálculo de distâncias
- Validação de locais permitidos
- Detecção de localizações suspeitas
- Validação de horários de trabalho

## Fluxo de Uso

1. **Login**: Usuário faz login na aplicação
2. **Captura de Foto**: Sistema solicita e captura foto em tempo real
3. **Captura de Localização**: Sistema coleta automaticamente a localização
4. **Exibição de Dados**: Sistema exibe foto, dados do usuário e localização
5. **Confirmação**: Usuário confirma o registro
6. **Validação**: Registro é enviado para validação (manual ou automática)
7. **Aprovação**: Administrador aprova ou rejeita o registro

## Configurações de Ambiente

```env
# Configurações de upload
UPLOAD_PATH=./uploads/photos
BASE_URL=http://localhost:3000

# Configurações de localização
DEFAULT_TIMEZONE=America/Sao_Paulo
MAX_LOCATION_ACCURACY=100
```

## Segurança

- **Validação de CPF**: Verificação rigorosa de CPF
- **Validação de Localização**: Verificação de coordenadas e precisão
- **Detecção de Fraude**: Detecção de localizações suspeitas
- **Controle de Acesso**: Apenas usuários autorizados podem validar
- **Auditoria**: Registro de todas as ações e validações

## Exemplo de Uso

```typescript
// Registrar ponto
const registerData = {
  photoData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  location: {
    latitude: -23.5505,
    longitude: -46.6333,
    accuracy: 10
  },
  type: "ENTRADA"
};

const response = await fetch('/time-tracking/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(registerData)
});
```

## Considerações Técnicas

- **Performance**: Otimizado para processamento rápido de registros
- **Escalabilidade**: Suporta múltiplos usuários simultâneos
- **Confiabilidade**: Validações rigorosas e tratamento de erros
- **Manutenibilidade**: Código bem estruturado e documentado
- **Testabilidade**: Serviços isolados e testáveis
