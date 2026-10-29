# Weather App — Plano Técnico

> **Fonte da verdade:** [specs/weather-app-spec.md](../specs/weather-app-spec.md).
> Este plano define arquitetura, decisões técnicas e contratos para a fase
> Tasks; não contém implementação final.

## 1. Architecture

### Contrato do fluxo integrado atual

`useWeather` expõe `status`, `data`, `cities`, `error`, `query`, `search`,
`selectCity` e `retry`. Busca enviada consulta geocoding e carrega o primeiro
resultado automaticamente, conforme decisão de integração registrada na spec.
`retry` repete a última etapa: geocoding se a busca falhou; forecast se já
existe cidade resolvida. Sem repetição automática. Respostas substituídas e
resultados após desmontagem são descartados; operação idêntica pendente não
é duplicada. Requests substituídos ainda podem completar na camada de serviço.

`App` não conhece endpoints, mocks nem conversão de payload. `unit` pertence
somente à UI; o hook mantém dados Celsius. O texto local do SearchBar é um
rascunho, enquanto `query` é o último termo enviado, não estados duplicados.
O serviço normaliza HTTP, rede, timeout e JSON inválido em WeatherServiceError;
`retryable` distingue falhas transitórias de erros permanentes/dados inválidos.
UI oferece retry somente para as transitórias. Cache, persistência,
combobox/debounce e respeito a Retry-After ainda são incrementos pendentes.

Aplicação SPA client-side sem backend próprio. Componentes de UI não conhecem
URLs nem formatos externos: a camada de serviço converte as respostas da
Open-Meteo para modelos internos e valida os campos antes de disponibilizá-los.

```text
┌───────────────────────────────────────────────┐
│ React UI                                      │
│ Search combobox · Current weather · 5-day view│
└──────────────────────┬────────────────────────┘
                       │ eventos e view state
┌──────────────────────▼────────────────────────┐
│ Hooks / estado da aplicação                   │
│ busca · cidade selecionada · clima · unidade  │
└──────────────┬─────────────────────┬───────────┘
               │                     │
┌──────────────▼───────────┐ ┌───────▼──────────┐
│ Weather services         │ │ Local preferences│
│ geocoding · forecast     │ │ unidade · cidade │
│ cache · timeout · parse  │ │ localStorage     │
└──────────────┬───────────┘ └──────────────────┘
               │ HTTPS
┌──────────────▼────────────────────────────────┐
│ Open-Meteo Geocoding API + Forecast API        │
└───────────────────────────────────────────────┘
```

- **UI:** recebe dados normalizados e apresenta os estados definidos em FR-06.
- **Estado/hooks:** orquestra eventos e impede que respostas obsoletas alterem
  a consulta atual (AC-01.5 e AC-03.5).
- **Services:** únicos responsáveis por HTTP, timeout, cache, validação,
  mapeamento de códigos meteorológicos e normalização.
- **Persistência local:** guarda apenas unidade e a última cidade; nunca
  previsão ou clima (FR-07).
- **Deploy:** artefato estático HTTPS. Hospedagem e SLO continuam pendentes em
  OQ-07.

## 2. Tech Stack

| Tecnologia | Uso e justificativa |
| ---------- | ------------------- |
| TypeScript strict | Tipar contratos internos e respostas normalizadas; detectar incompatibilidades no build (NFR-05). |
| React + Vite | SPA responsiva e build estático, conforme stack do projeto e D-04. |
| Tailwind CSS | Estilização mobile-first e tema dark glassmorphism conforme NFR-01. |
| Fetch API | Requisições HTTPS sem dependência adicional; suporta `AbortController` para timeout e cancelamento. |
| Vitest + Testing Library | Testes de funções, hooks e componentes com foco no comportamento e nos ACs. |
| Playwright | Testes E2E e viewports mobile/desktop; interceptação das APIs para resultados determinísticos. |
| Biome | Lint e formatação conforme configuração do repositório. |
| Open-Meteo | Geocoding e previsão sem API key (D-01); confirmar termos, limites e atribuição antes de produção (OQ-09). |

Não introduzir biblioteca de estado global, cliente HTTP ou camada de backend:
os fluxos e o volume de estado do MVP não justificam essas dependências.

## 3. Project Structure

Estrutura proposta, alinhada às convenções do projeto:

```text
src/
├── components/
│   ├── CitySearch.tsx          # Campo de busca e combobox acessível
│   ├── CurrentWeather.tsx      # Condições atuais da cidade
│   ├── ForecastList.tsx        # Previsão diária
│   ├── UnitToggle.tsx          # Alternância °C/°F
│   └── WeatherState.tsx        # Estados comuns de loading/erro/vazio
├── hooks/
│   ├── useCitySearch.ts        # Debounce, seleção e descarte de resposta antiga
│   └── useWeather.ts           # Carga de clima e controle de requisição vigente
├── services/
│   ├── openMeteoClient.ts      # Fetch, timeout, status HTTP e parsing
│   ├── geocodingService.ts     # Busca e normalização de cidades
│   ├── forecastService.ts      # Busca e normalização de clima/previsão
│   └── weatherCache.ts         # Cache em memória TTL 600 s
├── lib/
│   ├── weatherCodes.ts         # Código meteorológico → descrição pt-BR/ícone
│   ├── temperature.ts          # Conversão e formatação de temperaturas
│   └── dateTime.ts             # Formatação pt-BR usando fuso da cidade
├── storage/
│   └── preferences.ts          # Leitura/escrita segura de preferências locais
├── types/
│   ├── weather.ts              # Modelos internos de clima e previsão
│   ├── city.ts                 # Modelo interno de cidade
│   └── api.ts                  # Contratos mínimos das respostas externas
└── App.tsx                     # Composição da tela e estado inicial

tests/
├── unit/                       # Serviços, parsing, conversões, storage, hooks
└── e2e/                        # Busca, clima, erros e fluxos completos
```

Separar módulos somente onde há responsabilidades distintas. Não criar
repositórios, adaptadores intercambiáveis ou camadas de domínio adicionais no
MVP.

## 4. Data Model

Os modelos internos não expõem os tipos crus da Open-Meteo à UI. Campos
necessários para a renderização são validados no service; coordenadas e
identificador do provedor sustentam consulta e persistência.

```ts
type TemperatureUnit = "celsius" | "fahrenheit";

interface City {
  providerId?: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  region: string | null;
  timezone: string | null; // Identificador IANA quando fornecido
}

interface CurrentWeather {
  observedAt: string; // ISO 8601 do provedor
  temperatureC: number;
  apparentTemperatureC: number;
  relativeHumidityPercent: number;
  windSpeedKmh: number;
  precipitationMm: number; // Acumulado no intervalo atual do provedor
  pressureMslHpa: number; // Pressão ao nível do mar
  weatherCode: number;
}

interface ForecastDay {
  date: string; // YYYY-MM-DD no fuso da cidade
  temperatureMaxC: number;
  temperatureMinC: number;
  precipitationProbabilityPercent: number; // Maior probabilidade diária, 0–100%
  weatherCode: number;
}

interface WeatherSnapshot {
  city: City;
  timezone: string; // IANA validado; necessário para exibir datas
  current: CurrentWeather;
  days: ForecastDay[]; // Exatamente 5 dias consecutivos
}

interface WeatherPreferences {
  unit: TemperatureUnit;
  lastCity: City | null;
}
```

**Invariantes:**

- `days` contém exatamente cinco datas consecutivas, começando pela data local
  da cidade; máximas e mínimas são valores Celsius originais da API.
- A UI converte temperaturas a partir dos valores não arredondados e só
  arredonda na apresentação (FR-05).
- Valores ausentes, não finitos, código de resposta inválido ou timezone não
  utilizável não são convertidos em valores substitutos silenciosos: a
  resposta é rejeitada como erro de dados (EC-09). Se o timezone faltar, usar
  `timezone=auto` no request e aceitar apenas um timezone IANA retornado.
- Região/país são opcionais; nunca inventar nome de região. Se ambos faltarem,
  a UI apresenta coordenadas com duas casas decimais (FR-02).
- `providerId` não é obrigatório para restaurar uma cidade; latitude/longitude
  identificam a consulta salva.

## 5. Data Flow

1. **Inicialização:** carregar `WeatherPreferences`. Se houver cidade salva,
   solicitar forecast atualizado por coordenadas, sem geocoding. Sem cidade,
   mostrar a tela inicial e não solicitar clima (FR-08).
2. **Busca:** normalizar com trim; termos abaixo de dois pontos de código
   Unicode limpam sugestões e não chamam a API. Caso contrário, reiniciar
   debounce de 300 ms e chamar geocoding.
3. **Proteção de concorrência:** associar cada consulta a um identificador
   crescente e abortar a chamada anterior quando possível. Só aplicar resposta
   se o identificador e o termo ainda forem os atuais.
4. **Seleção:** o usuário escolhe explicitamente um resultado, por ponteiro ou
   teclado. Persistir somente a cidade selecionada e solicitar forecast.
5. **Serviço:** consultar cache válido ou executar request com timeout;
   verificar status HTTP, formato e campos necessários; normalizar a
   resposta em `City`/`WeatherSnapshot`.
6. **Renderização:** atualizar o estado somente se a cidade/request ainda
   forem os selecionados. Formatar condição, unidade, data e hora na UI.
7. **Alternância:** converter os valores Celsius mantidos no modelo, sem nova
   chamada. Salvar unidade local quando a persistência estiver disponível.
8. **Retry:** repetir manualmente a mesma operação em falhas transitórias;
   nunca fazer retry automático. Respeitar `Retry-After` para HTTP 429 se
   presente.

## 6. External APIs

### Geocoding

**Request**

```http
GET https://geocoding-api.open-meteo.com/v1/search
    ?name=Salvador
    &count=8
    &language=pt
    &format=json
```

| Parâmetro | Valor/uso |
| --------- | --------- |
| `name` | Termo digitado após `trim`; buscar com no mínimo 2 pontos de código Unicode. |
| `count` | `8`, limite máximo de resultados para a UI. |
| `language` | `pt`, para localizar nomes administrativos quando suportado. |
| `format` | `json`. |

**Exemplo resumido de resposta**

```json
{
  "results": [
    {
      "id": 3450554,
      "name": "Salvador",
      "latitude": -12.97111,
      "longitude": -38.51083,
      "country_code": "BR",
      "admin1": "Bahia",
      "timezone": "America/Bahia",
      "country": "Brasil"
    }
  ],
  "generationtime_ms": 0.2
}
```

**Mapeamento para `City`**

| JSON geocoding | Modelo interno |
| -------------- | -------------- |
| `id` | `providerId` (opcional) |
| `name` | `name` |
| `latitude`, `longitude` | `latitude`, `longitude` |
| `country` | `country` ou `null` |
| `admin1` | `region` ou `null` |
| `timezone` | `timezone` ou `null`; forecast ainda solicita `timezone=auto` |

`results` ausente ou vazio é uma busca sem correspondência (`empty`). Campos
de localização opcionais não são inventados; se país e região estiverem
ausentes, apresentar coordenadas conforme FR-02. Validar o tipo e a faixa das
coordenadas antes de usar um resultado. Ignorar respostas que não correspondam
à busca ativa.

### Forecast

**Request**

```http
GET https://api.open-meteo.com/v1/forecast
    ?latitude=-12.97111
    &longitude=-38.51083
    &current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,pressure_msl,weather_code
    &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max
    &forecast_days=5
    &temperature_unit=celsius
    &wind_speed_unit=kmh
    &timezone=auto
    &timeformat=iso8601
```

| Parâmetro | Valor/uso |
| --------- | --------- |
| `latitude`, `longitude` | Coordenadas da cidade selecionada ou salva. |
| `current` | `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `wind_speed_10m`, `precipitation`, `pressure_msl`, `weather_code`. Precipitação em mm no intervalo atual (não probabilidade); pressão ao nível do mar em hPa. |
| `daily` | `weather_code`, `temperature_2m_max`, `temperature_2m_min`, `precipitation_probability_max` (maior probabilidade diária, 0–100%). |
| `forecast_days` | `5` — hoje + 4 dias, conforme D-02. |
| `temperature_unit` | `celsius`; temperaturas internas permanecem Celsius. |
| `wind_speed_unit` | `kmh`. |
| `timezone` | `auto`, para obter o fuso local da coordenada; datas diárias são interpretadas nesse fuso. |
| `timeformat` | `iso8601`, para timestamps explícitos. |

**Exemplo resumido de resposta**

```json
{
  "latitude": -12.95,
  "longitude": -38.45,
  "timezone": "America/Bahia",
  "timezone_abbreviation": "-03",
  "utc_offset_seconds": -10800,
  "current_units": {
    "time": "iso8601",
    "temperature_2m": "°C",
    "apparent_temperature": "°C",
    "relative_humidity_2m": "%",
    "wind_speed_10m": "km/h",
    "precipitation": "mm",
    "pressure_msl": "hPa",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2026-10-29T14:00",
    "temperature_2m": 27.4,
    "apparent_temperature": 30.1,
    "relative_humidity_2m": 72,
    "wind_speed_10m": 13.2,
    "precipitation": 0.2,
    "pressure_msl": 1013.2,
    "weather_code": 2
  },
  "daily_units": {
    "time": "iso8601",
    "weather_code": "wmo code",
    "temperature_2m_max": "°C",
    "temperature_2m_min": "°C",
    "precipitation_probability_max": "%"
  },
  "daily": {
    "time": [
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02"
    ],
    "weather_code": [2, 3, 61, 2, 0],
    "temperature_2m_max": [29.1, 28.7, 26.4, 29.0, 30.2],
    "temperature_2m_min": [23.0, 22.8, 22.1, 22.5, 23.2],
    "precipitation_probability_max": [20, 35, 80, 10, 0]
  }
}
```

**Mapeamento para `WeatherSnapshot`**

| JSON forecast | Modelo interno |
| ------------- | -------------- |
| Cidade escolhida pelo usuário | `WeatherSnapshot.city` |
| `timezone` | `WeatherSnapshot.timezone`; validar como identificador de fuso utilizável |
| `current.time` | `current.observedAt` |
| `current.temperature_2m` | `current.temperatureC` |
| `current.apparent_temperature` | `current.apparentTemperatureC` |
| `current.relative_humidity_2m` | `current.relativeHumidityPercent` |
| `current.wind_speed_10m` | `current.windSpeedKmh` |
| `current.precipitation` | `current.precipitationMm` |
| `current.pressure_msl` | `current.pressureMslHpa` |
| `current.weather_code` | `current.weatherCode`; mapear para texto pt-BR/ícone na UI |
| Índice `i` de `daily.time` | `days[i].date` |
| Índice `i` de `daily.temperature_2m_max/min` | `days[i].temperatureMaxC/temperatureMinC` |
| Índice `i` de `daily.precipitation_probability_max` | `days[i].precipitationProbabilityPercent`; validar valor finito de 0 a 100 |
| Índice `i` de `daily.weather_code` | `days[i].weatherCode`; mapear para texto pt-BR/ícone |

Arrays de `daily` são paralelos: validar que todos os campos têm exatamente
cinco valores e associar valores pelo mesmo índice, sem ordenar
independentemente. Validar todos os valores numéricos como finitos e as datas
como cinco dias consecutivos. Unidades retornadas em `current_units` e
`daily_units` devem ser conferidas durante a validação do contrato; não assumir
unidades diferentes das requisitadas silenciosamente.

### Contrato resumido de resposta e normalização

1. Tratar os JSONs acima como exemplos documentais, não como fixtures exatas da
   API (campos adicionais podem ser retornados).
2. No service, validar o formato externo e selecionar somente os campos
   necessários; converter `admin1` para região, valores ausentes para `null`
   onde o modelo permite, e rejeitar campos meteorológicos obrigatórios
   ausentes/invalidos.
3. Produzir os modelos internos definidos na seção 4. A UI não depende dos
   nomes de parâmetros ou da estrutura de arrays do provedor.
4. Executar o spike técnico para confirmar disponibilidade real de
   `apparent_temperature`, nomes de unidades, forma do timestamp e timezone
   retornado antes de fechar as tarefas de integração (R-03).

Não enviar localização do dispositivo. Coordenadas só são enviadas após a
seleção de uma cidade obtida pelo geocoding ou carregamento da cidade salva.
As origens da API devem ser permitidas explicitamente na CSP de produção
(NFR-10).

## 7. State Management

O estado vive na tela principal e é organizado por hooks (`useCitySearch` e
`useWeather`). Cada hook mantém o estado da operação que orquestra; componentes
recebem dados, status e callbacks por props. Não usar store global no MVP.

```ts
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty" }
  | { status: "error"; error: AppError };

interface WeatherViewState {
  searchTerm: string;
  search: AsyncState<City[]>;
  selectedCity: City | null;
  weather: AsyncState<WeatherSnapshot>;
  unit: TemperatureUnit;
}
```

### Ciclo e ownership do estado

- **Busca:** `idle` até o termo atingir 2 pontos de código Unicode; depois do
  debounce de 300 ms passa a `loading`. Sucesso com resultados → `success`;
  resultado vazio → `empty`; falha → `error`. Alterar o termo invalida as
  sugestões anteriores e uma resposta só atualiza a tela se ainda pertencer
  ao termo/request ativo (AC-01.5/01.6).
- **Clima:** sem cidade selecionada → `idle`; seleção ou restauração da cidade
  → `loading`; resposta validada → `success`; falha → `error`. `empty` não é
  usado para forecast. Cada request é associado à cidade selecionada; resposta
  tardia de outra cidade é descartada (AC-03.5).
- **Loading acessível:** mostrar indicador somente após 200 ms de operação;
  antes disso, manter a UI sem flicker. O indicador usa `role="status"` e nome
  acessível (AC-06.1).
- **Estado persistente:** `unit` inicia em `"celsius"` se não houver
  preferência válida. Persistir somente unidade e última cidade; no reload,
  restaurar a cidade e buscar um snapshot atualizado. Se storage falhar,
  continuar em memória sem interromper a aplicação (FR-07/08, AC-07.3).

### Unidade e derivação de apresentação

O modelo de dados mantém todas as temperaturas em Celsius, sem arredondamento.
`unit` é estado de preferência/apresentação; nenhum valor Fahrenheit é salvo
como dado meteorológico.

```ts
function toDisplayTemperature(valueC: number, unit: TemperatureUnit): number {
  const converted = unit === "fahrenheit" ? (valueC * 9) / 5 + 32 : valueC;
  return roundHalfAwayFromZero(converted);
}
```

Componentes derivam o texto formatado durante a renderização a partir do valor
canônico e da unidade ativa. Ao alternar °C/°F, somente o estado `unit` muda:
não se altera o snapshot, não se encadeia conversão de valor já arredondado e
nenhuma requisição é enviada. Vento continua em km/h. A regra de empate exato
em 0,5 arredonda para longe de zero, conforme a política da spec (FR-05).

## 8. Error Handling

Services convertem falhas de `fetch`, status HTTP e parsing em um contrato
tipado; hooks controlam a transição da operação para `error`; componentes
apresentam texto pt-BR e a ação permitida. Não usar catches que escondam falhas
nem retornar dados parciais como sucesso.

```ts
type AppError =
  | { kind: "network"; retryable: true }
  | { kind: "timeout"; retryable: true }
  | { kind: "rate-limit"; retryable: true; retryAfterSeconds?: number }
  | { kind: "upstream"; retryable: true; status: number }
  | { kind: "request"; retryable: false; status: 400 | 401 | 403 | 404 }
  | { kind: "invalid-data"; retryable: false };
```

| Condição | Transição | Comportamento |
| -------- | --------- | ------------- |
| Busca válida sem resultados | `loading → empty` | Mostrar a mensagem literal de AC-06.4; sem retry. |
| Request em andamento | `idle/success → loading` | Após 200 ms, mostrar indicador acessível `role="status"`. |
| Erro de rede (inclui offline/CORS/falha de conexão) | `loading → error(network)` | Mensagem genérica pt-BR; retry manual refaz a mesma operação; nenhuma repetição automática. |
| Timeout | `loading → error(timeout)` | Abortar request ao completar 10 s; oferecer retry manual. |
| HTTP 408 ou 5xx | `loading → error(upstream)` | Erro transitório; retry manual. |
| HTTP 429 | `loading → error(rate-limit)` | Retry manual; se `Retry-After` existir, impedir nova chamada antes do instante indicado. |
| HTTP 400/401/403/404 | `loading → error(request)` | Erro permanente em pt-BR; não oferecer retry. |
| HTTP status não previsto | `loading → error` | Tratar como falha de upstream não retryable até classificar explicitamente; não mascarar como sucesso. |
| JSON inválido, campo obrigatório ausente, tipo inválido, arrays desalinhados ou valores não finitos | `loading → error(invalid-data)` | Rejeitar o snapshot completo; não renderizar cartão parcial, `NaN` ou `undefined`. |
| Região/país ausentes no geocoding | `success` | Campo permanece `null`; mostrar coordenadas conforme FR-02, sem fabricar dados. |
| Código meteorológico desconhecido | `success` | Renderizar “Condição meteorológica indisponível” + ícone neutro; registrar somente o código. |
| localStorage indisponível/corrompido | Manter estado em memória | Usar Celsius e tela inicial se não houver cidade em memória; não bloquear o app nem exibir erro técnico. |
| Exceção de renderização | Error boundary | Mostrar fallback de UI pt-BR; preservar diagnóstico sem query, coordenadas ou dados pessoais. |

Retry é acionado pelo usuário e não permite requests concorrentes idênticos.
Erros de uma seleção anterior são descartados junto com sua resposta; o estado
visível sempre corresponde ao termo/cidade atuais. Se o snapshot armazenado em
cache expirou, buscar novamente; cache expirado nunca é exibido como dado atual.

## 9. Testing Strategy

Os critérios de aceite da seção 4 da spec são a fonte dos testes. Testes
automatizados usam respostas controladas; nenhuma suíte depende da
disponibilidade real da Open-Meteo. Testes de integração dos services substituem
`fetch` por mock para inspecionar requests, respostas e abortos.

### Unitários — Vitest

- Funções puras de conversão Celsius/Fahrenheit, arredondamento incluindo empate
  e ida-e-volta, sem mutar os valores canônicos (FR-05; AC-05.4).
- Services com `fetch` mockado: URLs e parâmetros corretos; parsing/validação de
  geocoding e forecast; campos ausentes, tipos/valores inválidos e normalização
  para modelos internos (FR-02/03/04; EC-09/11).
- Debounce, trim, mínimo de caracteres, limite de resultados, cache hit/miss,
  TTL e descarte de respostas fora de ordem (FR-01; AC-01.1–01.6).
- Mapeamento de códigos meteorológicos conhecidos e desconhecidos (AC-03.3/04).
- Fuso IANA, data local e cinco dias consecutivos, inclusive virada de dia/ano
  (FR-04; AC-04.1–04.3).
- Timeout, `AbortController`, status HTTP (incluindo 408, 429 e toda a faixa
  5xx), `Retry-After`, política de retry e bloqueio de requests duplicados
  (FR-06; AC-06.2–06.6).
- Persistência segura de unidade/cidade, dados corrompidos e storage bloqueado
  (FR-07; AC-07.1–07.3).

### Componentes — Testing Library

- Seleção explícita e navegação do combobox por setas, Enter e Escape.
- Estados de loading, erro (transitório e permanente), vazio e sucesso;
  rótulos acessíveis, mensagens e conteúdo renderizado em cada estado.
- Troca de unidade sem novo request e sem perder a cidade selecionada.

### E2E — Playwright

- Primeira visita → busca → seleção → clima atual e forecast → alternância de
  unidade; validar dados visíveis e ausência de request adicional ao trocar °C/°F.
- Reabertura com cidade/unidade salva; mock confirma ausência de geocoding e
  nova chamada de forecast.
- Respostas de busca/forecast fora de ordem; verificar que dados antigos não
  substituem seleção atual.
- Sem resultados, erro transitório, erro permanente, 429/`Retry-After`,
  timeout e retry manual.
- Viewports 320, 360, 768 e 1280 CSS px, orientação retrato/paisagem e ausência
  de rolagem horizontal; verificar os alvos interativos e controles nos fluxos
  principais para NFR-01.
- Fluxos de teclado e axe conforme NFR-02; executar Chromium, Firefox e WebKit,
  complementando com verificação manual em Chrome Android e Safari iOS conforme
  NFR-07.
- Build de produção: medição Lighthouse em cinco execuções com mediana e
  bundle JavaScript gzip conforme NFR-03.

Gate de qualidade conforme NFR-05: `pnpm lint`, `pnpm build`, `pnpm test` e,
para E2E, `pnpm test:e2e`.

## 10. Risks & Trade-offs

### Principais trade-offs técnicos

| Decisão | Alternativas consideradas | Trade-off |
| ------- | ------------------------- | --------- |
| Separar UI, hooks, services e funções puras | Componentes chamando a API diretamente; arquitetura mais distribuída | A separação exige contratos e arquivos adicionais, mas mantém regras de negócio testáveis sem renderizar a aplicação e permite mockar a rede no service. |
| Manter o estado na tela/hooks, sem store global | Context ou biblioteca de estado global | Reduz dependências e complexidade para o escopo de uma tela; não oferece compartilhamento sofisticado entre rotas, que não é requisito do MVP. |
| Chamar Open-Meteo diretamente do cliente | Backend/proxy próprio | Evita custo e operação de servidor, mas deixa o cliente sujeito a indisponibilidade, CORS e limites do provedor; termos e limites precisam ser confirmados antes de produção. |
| Celsius como unidade canônica e conversão no cliente | Solicitar ao provedor a unidade selecionada ou armazenar ambas | Evita requests e divergência entre valores; a conversão e o arredondamento ficam sob responsabilidade da aplicação. |
| Cache apenas em memória, sem servir dados vencidos | Persistência/offline com stale-while-revalidate | Mantém o comportamento simples e evita apresentar clima antigo como atual; não atende uso offline nem conserva cache após recarregar a página. |
| Mockar APIs nos testes automatizados | Chamar a Open-Meteo em cada execução | Torna os testes determinísticos, rápidos e independentes do serviço externo; a conformidade com o contrato real depende de validação/spike separado. |
| Vitest/Testing Library para unidade e componentes; Playwright para fluxos | Cobrir tudo somente em E2E | A divisão reduz lentidão e localiza falhas, mas mantém duas camadas de testes e não substitui verificação manual nos navegadores/dispositivos reais. |

### Riscos e gates em aberto

| Risco/questão | Decisão ou mitigação | Referência/gate |
| ------------- | -------------------- | --------------- |
| Contrato real da Open-Meteo divergir dos campos esperados | Validar endpoints, nomes, unidades, timezone e payloads antes de detalhar tarefas de integração; manter normalização isolada no service. | R-03; spike técnico obrigatório no Plan |
| Termos, limites, atribuição ou disponibilidade comercial do provedor não confirmados | Não assumir que “sem API key” equivale a uso irrestrito; confirmar licença e obrigações antes de produção. | OQ-09; bloqueante para produção |
| Indisponibilidade/rate limit | Timeout 10 s, debounce 300 ms, cache apenas em memória por 600 s e retry manual; não adicionar backend proxy no MVP. | R-01/R-02; FR-06/NFR-09/11 |
| Campos de clima não aprovados pelo stakeholder | Manter contrato FR-03 proposto, mas não congelar spec até aprovação do conjunto de dados. | OQ-04; bloqueante para congelar spec |
| Hosting/SLO e distribuição | Deploy estático é compatível com arquitetura, mas fornecedor, monitoramento e alvo de disponibilidade dependem de decisão. Confirmar também canal web vs. lojas. | OQ-07/OQ-08; gates de produção |
| Preferências locais não persistem entre dispositivos | Aceitar a limitação; sem autenticação/backend, `localStorage` é simples e suficiente para o MVP. | FR-07; D-04 |
| Cache não funciona offline e não fornece stale data | Preferir correção e transparência a mostrar dados vencidos como atuais; offline/PWA fica fora do MVP. | FR-07, NFR-09, Out of Scope |
| Conversão de temperatura no cliente | Manter °C como representação canônica e converter localmente; evita requests duplicados, à custa de arredondamento visual explicitamente definido. | FR-05 |
| Acessibilidade do autocomplete | Usar padrão ARIA combobox e validar teclado, foco e leitor de tela; não criar componente de busca ad hoc sem testes. | NFR-02; R-08 |
| Esforço de operação e analytics | Sem analytics externos no MVP; logs locais de desenvolvimento não incluem termos, coordenadas ou dados do usuário. Definir métricas de negócio sem presumir coleta de telemetria. | NFR-08/13; OQ-05 |

**Decisões que permanecem abertas:** aprovação dos campos FR-03 (OQ-04),
hospedagem/SLO (OQ-07), distribuição (OQ-08), termos da Open-Meteo (OQ-09)
e métricas de sucesso (OQ-05). A aprovação dos campos pode alterar o contrato
de clima; os demais itens afetam decisões de release/operação. Resolva os
gates aplicáveis antes de congelar a spec ou publicar em produção.
