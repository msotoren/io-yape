# IO Neobanco 

## Reto

Implementar un sistema de emisión de tarjetas VISA para IO Neobanco (fintech peruana) usando arquitectura event-driven con Node.js, Kafka, PostgreSQL y Docker Compose.

**Restricción clave:** Un cliente solo puede tener UNA tarjeta activa. El sistema maneja la emisión de forma asíncrona con idempotencia garantizada.

## Solución propuesta

**`card-issuer`** (API REST):
- Recibe solicitudes de emisión, genera `requestId` internamente (UUID v4)
- Persiste solicitud + evento outbox en una transacción atómica
- Responde `202 Accepted` inmediatamente
- Outbox Relay publica eventos a Kafka asíncrónamente
- La idempotencia del POST se valida con `x-idempotency-key` y Redis (`SET NX`)

**`card-processor`** (Consumer Kafka):
- Consume eventos de solicitud, simula procesamiento externo
- Implementa **retry exponencial** (1s, 2s, 4s) + **circuit breaker** para resiliencia
- Publica eventos de éxito (`issued`) o DLQ en caso de fallo tras 3 reintentos

**Aporta:**
- Idempotencia real en el servicio (`x-idempotency-key` + Redis NX)
- Resiliencia ante fallos (Outbox Pattern, Circuit Breaker, Retry, DLQ)
- Observabilidad (Prometheus + Grafana + Tempo/OTel, trazabilidad con X-Trace-ID)
- Hexagonal Architecture completa (application = casos de uso, infrastructure = adaptadores)

### Diagrama N2 del C4

```mermaid
flowchart TD
  Client[Cliente Mobile/Web] --> IssuerApi[card-issuer API\nFastify :3000]

  subgraph Issuer[card-issuer]
	IssuerApi --> Idem[Idempotency Middleware\nX-Idempotency-Key + Redis NX]
	Idem --> Cmd[IssueCardService]
	IssuerApi --> Query[GetCardStatusService]
	Cmd --> IssuerDb[(issuer-db\ncard_requests)]
	Cmd --> Outbox[(issuer-db\noutbox_events)]
	Outbox --> Signal[EventEmitter\nOutboxSignal.NEW_EVENT]
	Signal --> Relay[OutboxRelayWorker]
	KafkaIssued[(io.cards.issued.v1)] --> ConsIssued[IssuedConsumer]
	KafkaProc[(io.cards.processing.v1)] --> ConsProc[ProcessingConsumer]
	KafkaDLQ[(io.card.requested.v1.dlq)] --> ConsDLQ[DLQConsumer]
	ConsIssued --> IssuerDb
	ConsProc --> IssuerDb
	ConsDLQ --> IssuerDb
  end

  subgraph Processor[card-processor]
	KafkaReq[(io.card.requested.v1)] --> Consumer[CardRequestedConsumer]
	Consumer --> Retry[Retry + CircuitBreaker\nCockatiel]
	Retry --> External[ExternalProcessorSimulator]
	Retry --> ProcessorDb[(processor-db\ncard_issuances)]
	Retry --> KafkaIssued
	Retry --> KafkaProc
	Retry --> KafkaDLQ
  end

  subgraph Obs[Observabilidad]
	Prom[Prometheus :9090]
	OTel[OTel Collector :4318]
	Tempo[Tempo :3200]
	Grafana[Grafana :3001]
  end

  Relay --> KafkaReq
  IssuerApi --> Prom
  Consumer --> Prom
  IssuerApi --> OTel
  Consumer --> OTel
  OTel --> Tempo
  Tempo --> Grafana
  Prom --> Grafana
```

### Arquitectura de Alto Nivel

```mermaid
flowchart LR
  A[POST /v1/cards/issue] --> B[Fastify + JSON Schema]
  B --> C[Idempotency Middleware\nRedis SET NX]
  C --> D[IssueCardService]
  D --> E[(issuer-db\ncard_requests + outbox_events\nmisma transacción)]
  E --> F[HTTP 202 pendiente]
  E --> G[Outbox NEW_EVENT]
  G --> H[OutboxRelayWorker]
  H --> I[(Kafka io.card.requested.v1)]
  I --> J[Processor Consumer]
  J --> K[processWithRetry\nCockatiel retry + breaker]
  K --> L{resultado}
  L -->|éxito| M[(io.cards.issued.v1)]
  L -->|progreso| N[(io.cards.processing.v1)]
  L -->|fallo final| O[(io.card.requested.v1.dlq)]
  M --> P[issuer IssuedConsumer -> emitido]
  N --> Q[issuer ProcessingConsumer -> en_proceso]
  O --> R[issuer DLQConsumer -> fallido]
  P --> S[GET /v1/cards/:requestId/status]
  Q --> S
  R --> S
```

### Flujo Happy Path + Error Path

```mermaid
sequenceDiagram
  autonumber
  participant U as Cliente
  participant ISS as card-issuer
  participant DBI as issuer-db
  participant K as Kafka
  participant PRC as card-processor
  participant DBP as processor-db

  U->>ISS: POST /v1/cards/issue + x-idempotency-key
  ISS->>DBI: INSERT card_request + outbox_event (1 TX)
  ISS-->>U: 202 {status: pendiente, requestId}
  ISS->>K: OutboxRelay -> io.card.requested.v1
  K->>PRC: consume requested
  PRC->>K: publish io.cards.processing.v1 (attempt=1)
  K->>ISS: consume processing -> en_proceso

  alt Happy path
	PRC->>DBP: INSERT card_issuances (emitido)
	PRC->>K: publish io.cards.issued.v1
	K->>ISS: consume issued -> emitido
	U->>ISS: GET /status
	ISS-->>U: 200 emitido + card data
  else Error path
	PRC->>PRC: Retry #1/#2/#3 (cockatiel)
	PRC->>K: publish io.card.requested.v1.dlq
	K->>ISS: consume dlq -> fallido
	U->>ISS: GET /status
	ISS-->>U: 200 fallido + attempts=3 + failureReason
  end
```

### Endpoints de la API

| Método | Ruta | Descripción | Response |
|---|---|---|---|
| POST | `/v1/cards/issue` | Solicitar emisión | 202, 409, 422, 429 |
| GET | `/v1/cards/:requestId/status` | Consultar estado | 200, 404 |
| GET | `/health` | Health check | 200, 503 |
| GET | `/metrics` | Prometheus (9091) | 200 |

📄 **Documentación Swagger:** [http://localhost:3000/docs](http://localhost:3000/docs)
📋 **OpenAPI Spec:** `docs/swagger/openapi.yaml`

---
## Estructura de carpetas

```
io-yape/
├── docker-compose.yml ← single source of truth
├── docs/swagger/openapi.yaml
├── README.md ← this file
├── card-issuer/
│   ├── src/
│   │   ├── application/services/ ← IssueCardService, GetCardStatusService
│   │   ├── domain/ ← CardRequest (aggregate), CardStatus (enum), events, ports
│   │   ├── infrastructure/ ← HTTP routes, DB repos, Kafka consumers, KafkaEventPublisher
│   │   └── index.ts ← bootstrap
│   ├── tests/
│   │   ├── unit/ ← domain + services
│   │   ├── integration/ ← endpoint contracts
│   │   ├── e2e/ ← flows + observability
│   │   └── support/ ← in-memory repo mock
│   ├── migrations/init.sql
│   └── Dockerfile ← multi-stage
├── card-processor/
│   ├── src/
│   │   ├── application/services/ ← ProcessCardIssuanceService
│   │   ├── domain/ ← CardIssuance, ports (IExternalProcessor)
│   │   ├── infrastructure/ ← Kafka, DB, external adapter
│   │   ├── shared/ ← RetryEngine, CircuitBreaker
│   │   └── index.ts ← bootstrap
│   ├── tests/
│   │   ├── unit/ ← domain + resilience (retry, circuit breaker)
│   │   └── e2e/ ← end-to-end flows
│   ├── migrations/init.sql
│   └── Dockerfile ← multi-stage
├── prometheus/ ← prometheus.yml
├── grafana/ ← provisioning + datasources
└── otel/ ← otel-collector.yaml
```

---

## Ejecución del proyecto

### Requisitos previos
- Docker + Docker Compose
- Node.js 20+

### Levantar en local

```bash
cd io-yape

# 1. Levantar infraestructura
docker compose up -d

# 2. Verificar salud
docker compose ps
curl http://localhost:3000/health
```

### Prueba rápida (curl)

```bash
# 1. Emitir tarjeta
REQUEST_ID=$(curl -s -X POST http://localhost:3000/v1/cards/issue \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: quick-demo-1" \
  -d '{
	"customer": {
	  "documentType": "DNI",
	  "documentNumber": "12345678",
	  "fullName": "Jose Perez",
	  "birthDate": "02/03/2000",
	  "email": "jose@example.com"
	},
	"product": { "type": "VISA", "currency": "PEN" },
	"forceError": false
  }' | jq -r '.requestId')

echo "Request ID: $REQUEST_ID"

# 2. Esperar procesamiento (2-3s happy path)
sleep 3

# 3. Consultar estado
curl -s http://localhost:3000/v1/cards/$REQUEST_ID/status | jq .

# Esperado: status: "emitido"
```

---

## Observabilidad

| Herramienta | URL | Credenciales |
|---|---|---|
| Grafana | http://localhost:3001 | admin / admin |
| Prometheus | http://localhost:9090 | — |
| Tempo | http://localhost:3200 | — |
| Swagger UI | http://localhost:3000/docs | — |
| card-issuer metrics | http://localhost:9091/metrics | — |
| card-processor metrics | http://localhost:9093/metrics | — |

**Traceabilidad:**
- `X-Trace-ID` header propagado en todas las solicitudes
- Correlación end-to-end en logs, métricas y trazas OTEL exportadas a Tempo
