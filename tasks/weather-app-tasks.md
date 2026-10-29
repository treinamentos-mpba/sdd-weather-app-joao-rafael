# Weather App — Backlog de Implementação

> **Fontes:** [plano técnico](../plans/weather-app-plan.md) e
> [especificação de produto](../specs/weather-app-spec.md). A spec é a fonte de
> verdade dos requisitos e critérios de aceite.
>
> Ordem de implementação: tipos → funções puras → services → hooks →
> componentes → integração → testes → hardening. Cada tarefa tem um escopo
> limitado, dependências explícitas e critérios de aceite verificáveis.

## Gates externos

- **OQ-04:** aprovar os campos meteorológicos antes de congelar os contratos e a
  UI de clima. As tarefas usam FR-03 da spec enquanto a decisão estiver pendente.
- **OQ-05:** definir métricas de sucesso antes do ship; não adicionar analytics
  ou telemetria externa sem aprovação.
- **OQ-07/OQ-08/OQ-09:** decidir hospedagem, canal de distribuição e termos/
  atribuição da Open-Meteo antes de produção. Configuração de headers depende da
  escolha da hospedagem.
- Política HTTP: 408, 429 e 5xx são transitórios; 400/401/403/404 são
  permanentes; outros status não recebem retry até classificação aprovada.

## Prioridade, tamanho e sequência de entrega

### Critérios de classificação

- **P0:** caminho crítico para uma fatia utilizável ou gate obrigatório de
  qualidade/liberação. Pode ocorrer depois da primeira demonstração, mas não deve
  ser removido do escopo de entrega.
- **P1:** necessário para completar o MVP ou comprovar requisitos não funcionais,
  mas pode vir após a primeira fatia demonstrável.
- **P2:** adiável sem descumprir os requisitos aprovados. Nenhuma tarefa atual foi
  classificada como P2: todas atendem a requisitos da spec ou ao gate de release.
- **P (pequeno):** uma mudança localizada, normalmente um arquivo e um
  comportamento verificável.
- **M (médio):** alguns contratos/estados ou integração limitada, normalmente
  dois ou três arquivos.
- **G (grande):** integração de ponta a ponta ou validação com múltiplos fluxos,
  ambientes ou plataformas.

Prioridade expressa importância; tamanho expressa esforço relativo. P0 não
significa necessariamente que a tarefa venha primeiro na ordem de execução.

| Tarefa | Prioridade | Tamanho |
| ------ | ---------- | ------- |
| T-01 | P0 | M |
| T-02 | P0 | M |
| T-03 | P0 | M |
| T-04 | P0 | P |
| T-05 | P0 | P |
| T-06 | P0 | P |
| T-07 | P0 | M |
| T-08 | P0 | M |
| T-09 | P0 | M |
| T-10 | P0 | M |
| T-11 | P1 | M |
| T-12 | P0 | M |
| T-13 | P0 | M |
| T-14 | P0 | P |
| T-15 | P0 | M |
| T-16 | P0 | P |
| T-17 | P0 | P |
| T-18 | P0 | P |
| T-19 | P1 | M |
| T-20 | P0 | G |
| T-21 | P1 | P |
| T-22 | P0 | P |
| T-23 | P0 | P |
| T-24 | P0 | P |
| T-25 | P0 | M |
| T-26 | P0 | M |
| T-27 | P0 | P |
| T-28 | P0 | M |
| T-29 | P0 | M |
| T-30 | P1 | P |
| T-31 | P0 | M |
| T-32 | P0 | M |
| T-33 | P0 | P |
| T-34 | P0 | P |
| T-35 | P0 | P |
| T-36 | P0 | P |
| T-37 | P0 | P |
| T-38 | P1 | P |
| T-39 | P0 | M |
| T-40 | P0 | G |
| T-41 | P0 | G |
| T-42 | P1 | M |
| T-43 | P0 | G |
| T-44 | P1 | M |
| T-45 | P1 | M |
| T-46 | P1 | G |
| T-47 | P1 | M |
| T-48 | P1 | M |
| T-49 | P1 | P |
| T-50 | P1 | M |
| T-51 | P1 | P |
| T-52 | P1 | P |
| T-53 | P1 | P |
| T-54 | P0 | G |

### Sequência sugerida em fatias verticais

| Ordem | Resultado demonstrável | Tarefas principais |
| ----- | ---------------------- | ----------------- |
| 1. Busca de cidades | Tela inicial em pt-BR, busca com debounce, lista de sugestões e seleção explícita. | T-01, T-03, T-07, T-08, T-09, T-12, T-14, T-15; testes T-27, T-28, T-31, T-33, T-34 e T-40. |
| 2. Clima, previsão e unidade | Selecionar uma cidade exibe clima atual e cinco dias; alternância de unidade sem nova chamada. | T-02, T-04, T-05, T-06, T-10, T-11, T-13, T-16, T-17, T-18, T-19, T-20, T-21; testes T-22–T-24, T-29, T-30, T-32, T-35–T-39, T-41 e T-43. |
| 3. Preferências restauradas | Reabrir o app restaura cidade/unidade e carrega dados atualizados, sem geocoding desnecessário. | T-42; validação adicional de armazenamento em T-52. |
| 4. Confiabilidade e release | Acessibilidade, responsividade, segurança, compatibilidade e evidências dos gates. | T-44–T-54. |

**Ajuste recomendado para antecipar a primeira entrega visível:** dividir T-20 em
duas integrações pequenas antes de iniciar a implementação: (a) integrar tela
inicial e busca, dependente de T-12, T-14 e T-15; (b) integrar clima, previsão e
unidades após T-13, T-16, T-17 e T-18. A primeira parte libera a fatia 1 sem
aguardar todo o dashboard. Ajustar T-40 para depender da composição inicial,
sem aguardar o teste integral T-39; manter T-39, T-41 e T-43 após a composição
do dashboard e do Error Boundary. T-11 entra na fatia 2 por ser dependência de
T-13; a experiência de preferências restauradas é validada na fatia 3.

Os grupos acima indicam ordem de entrega, não substituem as dependências
individuais listadas em cada tarefa. Gates P1 ligados à spec continuam
obrigatórios antes da liberação correspondente.

## Rastreabilidade

### Requisitos funcionais → tarefas

| Requisito da spec | Tarefas de implementação | Tarefas de verificação |
| ----------------- | ------------------------ | ---------------------- |
| FR-01 — Busca de cidades | T-09, T-12, T-15, T-20 | T-28, T-31, T-33, T-34, T-40 |
| FR-02 — Desambiguação de cidades | T-01, T-09, T-15 | T-28, T-33, T-34, T-40 |
| FR-03 — Clima atual | T-02, T-05, T-06, T-10, T-13, T-16, T-20 | T-23, T-24, T-29, T-32, T-35, T-41, T-43 |
| FR-04 — Previsão diária | T-02, T-05, T-06, T-10, T-17, T-20 | T-23, T-24, T-29, T-36, T-41 |
| FR-05 — Alternância de unidades | T-02, T-04, T-11, T-13, T-18, T-20 | T-22, T-30, T-32, T-37, T-41 |
| FR-06 — Estados de interface | T-03, T-07, T-12, T-13, T-14, T-15, T-19, T-20, T-21 | T-25, T-26, T-31, T-32, T-34, T-38, T-39, T-43 |
| FR-07 — Persistência local | T-01, T-02, T-11, T-13, T-18, T-20 | T-30, T-32, T-37, T-42, T-52 |
| FR-08 — Estado inicial | T-14, T-20 | T-39, T-40 |

Todos os requisitos funcionais FR-01–FR-08 têm tarefas de implementação e
verificação correspondentes; não há requisito funcional sem tarefa mapeada.

### Tarefas → requisitos e critérios

| Tarefa | Requisito(s) | Critério(s) relacionados |
| ------ | ------------ | ------------------------- |
| T-01 | FR-02, FR-07 | AC-02.1, AC-07.2 |
| T-02 | FR-03, FR-04, FR-05, FR-07 | AC-03.1, AC-04.1, AC-05.4, AC-07.1 |
| T-03 | FR-06, NFR-04, NFR-10 | AC-06.2, AC-06.3, AC-06.5 |
| T-04, T-22 | FR-05, NFR-12 | AC-05.4 |
| T-05, T-23 | FR-03, FR-04 | AC-03.3, AC-03.4 |
| T-06, T-24 | FR-03, FR-04, NFR-12 | AC-03.2, AC-04.3 |
| T-07, T-25, T-26 | FR-06, NFR-04, NFR-09, NFR-10 | AC-06.2, AC-06.3, AC-06.5 |
| T-08, T-27 | NFR-09, NFR-11 | Validação de TTL/cache |
| T-09, T-28 | FR-01, FR-02, NFR-06, NFR-08, NFR-11 | AC-01.2, AC-01.4, AC-02.1 |
| T-10, T-29 | FR-03, FR-04, NFR-04, NFR-06, NFR-09, NFR-12 | AC-03.1–AC-03.2, AC-04.1–AC-04.3 |
| T-11, T-30 | FR-07, NFR-08 | AC-07.1–AC-07.3 |
| T-12, T-31 | FR-01, FR-02, FR-06, NFR-11 | AC-01.1–AC-01.6, AC-06.6 |
| T-13, T-32 | FR-03, FR-04, FR-06, FR-07, NFR-04, NFR-09 | AC-03.5, AC-06.1–AC-06.6, AC-07.1–AC-07.4 |
| T-14 | FR-06, FR-08, NFR-06, NFR-12 | AC-06.1–AC-06.4, AC-08.1 |
| T-15, T-33, T-34 | FR-01, FR-02, FR-06, NFR-01, NFR-02 | AC-02.1–AC-02.3, AC-06.1, AC-06.4 |
| T-16, T-35 | FR-03, NFR-02, NFR-04, NFR-12 | AC-03.1–AC-03.4 |
| T-17, T-36 | FR-04, NFR-01, NFR-02, NFR-12 | AC-04.1–AC-04.3 |
| T-18, T-37 | FR-05, FR-07, NFR-02, NFR-12 | AC-05.1–AC-05.3, AC-07.1 |
| T-19, T-38 | NFR-04, NFR-13 | Diagnóstico seguro |
| T-20 | FR-06, FR-07, FR-08, NFR-01, NFR-02, NFR-06, NFR-12 | AC-06.1, AC-06.4, AC-07.2, AC-08.1 |
| T-21 | NFR-04, NFR-13 | Captura do boundary na raiz |
| T-39 | FR-06, FR-08, NFR-04, NFR-13 | AC-06.1, AC-08.1; fallback do boundary |
| T-40 | FR-01, FR-02, FR-06, FR-08, NFR-01, NFR-02, NFR-04, NFR-08, NFR-11, NFR-12 | AC-01.2, AC-02.2, AC-08.1 |
| T-41 | FR-03, FR-04, FR-05, NFR-01–NFR-04, NFR-08, NFR-11, NFR-12 | AC-03.1, AC-04.1, AC-05.1 |
| T-42 | FR-07, NFR-03, NFR-08 | AC-07.1, AC-07.2, AC-07.4 |
| T-43 | FR-06, NFR-04, NFR-09 | AC-06.2–AC-06.6; EC-14 |
| T-44 | NFR-01 | Viewports/alvos |
| T-45 | NFR-02 | Teclado, axe, contraste |
| T-46 | NFR-07 | Matriz de browsers |
| T-47, T-48, T-49 | NFR-03 | Renderização, Lighthouse, bundle |
| T-50 | NFR-10 | HTTPS/CSP |
| T-51 | NFR-08 | Dados mínimos nas requisições |
| T-52 | FR-07, NFR-08 | AC-07.1–AC-07.3 |
| T-53 | NFR-13 | Logs sem dados sensíveis |
| T-54 | NFR-05; gates OQ-04, OQ-05, OQ-07, OQ-08, OQ-09 | Gate de release |

## Entrega 1 — Tipos

### T-01 — Definir o modelo de cidade

- **Descrição:** Criar contrato interno da cidade, inclusive campos opcionais
  retornados pelo geocoding.
- **Critérios de aceite:**
  - `City` declara `providerId?: number`, `name: string`,
    `latitude: number`, `longitude: number`, `country: string | null`,
    `region: string | null` e `timezone: string | null`.
  - Cidade salva pode ser consultada por coordenadas sem `providerId`.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/city.ts`.
- **Tipo:** Data.

### T-02 — Definir os modelos meteorológicos

- **Descrição:** Criar contratos de unidade, clima, previsão, snapshot e
  preferências.
- **Critérios de aceite:**
  - `TemperatureUnit` é `"celsius" | "fahrenheit"`.
  - `CurrentWeather` declara `observedAt`, `temperatureC`,
    `apparentTemperatureC`, `relativeHumidityPercent`, `windSpeedKmh` e
    `weatherCode`.
  - `ForecastDay` declara `date`, `temperatureMaxC`, `temperatureMinC` e
    `weatherCode`; `WeatherSnapshot` contém cidade, timezone, clima atual e
    cinco dias.
  - `WeatherPreferences` contém apenas unidade e cidade opcional; temperaturas
    meteorológicas são Celsius.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Tipo:** Data.

### T-03 — Definir contratos externos e erros

- **Descrição:** Tipar payloads mínimos do provedor e erro compartilhado dos
  services.
- **Critérios de aceite:**
  - Contratos descrevem os campos de geocoding e forecast consumidos no plano e
    permitem propriedades opcionais do provedor.
  - `AppError` distingue `network`, `timeout`, `rate-limit`, `upstream`,
    `request` e `invalid-data`.
  - Status original pode ser número; status não classificado pode ser marcado
    não retryable.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/types/api.ts`.
- **Tipo:** Data.

## Entrega 2 — Funções puras

### T-04 — Implementar conversão de temperatura

- **Descrição:** Converter temperatura canônica em Celsius para apresentação
  Celsius/Fahrenheit.
- **Critérios de aceite:**
  - Usa `F = C * 9 / 5 + 32` e `C = (F - 32) * 5 / 9`.
  - Arredonda ao inteiro mais próximo; empate exato arredonda para longe de zero.
  - Não modifica nem armazena valores canônicos do snapshot.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Tipo:** Data.

### T-05 — Implementar mapeamento meteorológico

- **Descrição:** Mapear códigos meteorológicos para rótulo pt-BR e ícone.
- **Critérios de aceite:**
  - Cada código WMO suportado retorna rótulo pt-BR e identificador de ícone não
    vazio.
  - Código desconhecido retorna `Condição meteorológica indisponível` e ícone
    neutro.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`.
- **Tipo:** Data.

### T-06 — Implementar formatação temporal

- **Descrição:** Formatar timestamp e data diária com locale e timezone
  explícitos.
- **Critérios de aceite:**
  - Recebe locale `pt-BR` e timezone IANA como argumentos.
  - Datas `YYYY-MM-DD` e timestamp ISO não usam implicitamente o fuso do
    navegador.
  - Timezone IANA inválido produz erro explícito.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/dateTime.ts`.
- **Tipo:** Data.

## Entrega 3 — Services

### T-07 — Implementar cliente HTTP

- **Descrição:** Encapsular `fetch`, timeout, abort e classificação HTTP.
- **Critérios de aceite:**
  - Cada chamada usa `AbortController` e aborta em 10.000 ms.
  - 408, 429 e 500–599 são transitórios; 400/401/403/404 e status não
    classificados são não retryable.
  - Não há retry automático; falha de rede, resposta não-2xx ou falha ao ler JSON
    rejeitam com `AppError`.
- **Dependências:** T-03.
- **Arquivos prováveis:** `src/services/openMeteoClient.ts`.
- **Tipo:** Data.

### T-08 — Implementar cache em memória

- **Descrição:** Criar cache TTL para geocoding e forecast.
- **Critérios de aceite:**
  - Entradas válidas expiram após 600.000 ms; cache expirado é miss.
  - Falhas não são gravadas.
  - Chaves distinguem termos de busca normalizados e forecast por coordenadas e
    parâmetros relevantes.
  - Cache não grava no `localStorage`.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/services/weatherCache.ts`.
- **Tipo:** Data.

### T-09 — Implementar serviço de geocoding

- **Descrição:** Consultar Open-Meteo e normalizar resultados para `City`.
- **Critérios de aceite:**
  - Request `GET /v1/search` envia `name` trimado, `count=8`, `language=pt` e
    `format=json`.
  - Rejeita latitude fora de -90..90 e longitude fora de -180..180.
  - Região/país ausentes são `null`; ordem é preservada e no máximo oito
    resultados são retornados.
  - `results` ausente ou vazio retorna lista vazia.
- **Dependências:** T-01, T-07, T-08.
- **Arquivos prováveis:** `src/services/geocodingService.ts`.
- **Tipo:** Data.

### T-10 — Implementar serviço de previsão

- **Descrição:** Consultar e normalizar clima atual e cinco dias.
- **Critérios de aceite:**
  - Request usa campos `current`/`daily` do plano, Celsius, vento km/h,
    `forecast_days=5`, `timezone=auto` e `timeformat=iso8601`.
  - Valida timezone IANA, campos obrigatórios, unidades retornadas e valores
    numéricos finitos.
  - Arrays diários têm cinco valores alinhados; datas são consecutivas e máxima
    é maior ou igual à mínima.
  - Produz snapshot completo em Celsius; payload inválido é rejeitado por inteiro.
- **Dependências:** T-01, T-02, T-03, T-05, T-06, T-07, T-08.
- **Arquivos prováveis:** `src/services/forecastService.ts`.
- **Tipo:** Data.

### T-11 — Implementar persistência de preferências

- **Descrição:** Ler e gravar unidade e cidade em `localStorage`.
- **Critérios de aceite:**
  - Persiste somente unidade e campos de cidade da FR-07, nunca clima/forecast.
  - Unidade inválida/ausente resulta em Celsius; cidade inválida/ausente em
    `null`.
  - Exceções de leitura/gravação do storage não escapam das funções.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/storage/preferences.ts`.
- **Tipo:** Data.

## Entrega 4 — Hooks

### T-12 — Implementar hook de busca

- **Descrição:** Orquestrar termo, debounce, resultados e seleção de cidade.
- **Critérios de aceite:**
  - Trim e mínimo de dois pontos de código Unicode; abaixo do mínimo não chama
    service.
  - Busca ocorre uma vez após 300 ms sem alterações.
  - Alterar termo limpa sugestões; resposta antiga não muda o estado atual.
  - Estados `idle`, `loading`, `success`, `empty` e `error` são alcançáveis;
    request idêntico em andamento não é duplicado.
- **Dependências:** T-09, T-08.
- **Arquivos prováveis:** `src/hooks/useCitySearch.ts`.
- **Tipo:** Data.

### T-13 — Implementar hook de clima

- **Descrição:** Orquestrar carregamento, seleção atual, cache e retry manual.
- **Critérios de aceite:**
  - Cidade salva inicia forecast sem geocoding; unidade salva inicia o estado
    selecionado.
  - Resposta de cidade que não é a selecionada é descartada.
  - Cache expirado provoca request novo e nunca é mostrado como atual.
  - Retry manual está disponível para rede/timeout/408/429/5xx, não para
    400/401/403/404/status desconhecido; não há retry automático/duplicado.
  - Grava cidade/unidade via service de preferências; falha de storage não
    interrompe estado em memória.
  - Indicador `role="status"` aparece aos 200 ms, não aos 199 ms, se request
    permanecer pendente.
- **Dependências:** T-10, T-08, T-11.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Tipo:** Data.

## Entrega 5 — Componentes

### T-14 — Centralizar mensagens da interface

- **Descrição:** Exportar strings visíveis em pt-BR usadas pelos componentes.
- **Critérios de aceite:**
  - Mensagens de boas-vindas, instrução, loading, vazio, erro transitório,
    permanente, retry e fallback estão definidas.
  - Cada mensagem é exportada uma vez para importação pelos componentes.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/lib/messages.ts`.
- **Tipo:** UI.

### T-15 — Implementar combobox de cidades

- **Descrição:** Renderizar busca, opções e estados recebidos por props.
- **Critérios de aceite:**
  - Setas navegam opções, Enter seleciona a opção ativa, Escape fecha a lista;
    nenhum resultado é selecionado automaticamente.
  - Resultado mostra contexto disponível; sem região e país, mostra
    coordenadas com duas casas.
  - Loading/vazio/erro usam mensagens centralizadas e roles/atributos ARIA
    coerentes.
- **Dependências:** T-12, T-14.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`.
- **Tipo:** UI.

### T-16 — Implementar cartão de clima atual

- **Descrição:** Renderizar clima atual, localização e horário de referência.
- **Critérios de aceite:**
  - Exibe temperatura, sensação, umidade, vento km/h, condição e ícone de FR-03.
  - Timestamp usa timezone do snapshot e não é rotulado como horário de
    atualização do app.
  - Mostra região/país disponíveis; sem ambos, mostra coordenadas com duas casas.
- **Dependências:** T-02, T-05, T-06.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`.
- **Tipo:** UI.

### T-17 — Implementar lista de previsão

- **Descrição:** Renderizar cinco dias da previsão diária.
- **Critérios de aceite:**
  - Renderiza exatamente os cinco dias, na ordem recebida.
  - Cada item mostra dia abreviado em pt-BR, data, máxima, mínima, condição e
    ícone.
  - Nenhum item renderiza campo ausente, `NaN` ou `undefined`.
- **Dependências:** T-02, T-05, T-06.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`.
- **Tipo:** UI.

### T-18 — Implementar controle de unidade

- **Descrição:** Renderizar controle acessível de alternância °C/°F.
- **Critérios de aceite:**
  - Controle tem nome acessível e expõe unidade selecionada.
  - Alternar não faz request nem modifica temperaturas Celsius do snapshot.
  - Temperaturas têm zero casas decimais; vento permanece em km/h.
- **Dependências:** T-02, T-04.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`.
- **Tipo:** UI.

### T-19 — Implementar Error Boundary

- **Descrição:** Criar fallback isolado para exceção de renderização.
- **Critérios de aceite:**
  - Child que lança erro é substituído por fallback pt-BR com `role="alert"`.
  - Fallback tem botão acessível `Recarregar página`.
  - Diagnóstico em desenvolvimento não inclui termo, coordenadas ou dados do
    usuário.
- **Dependências:** T-14.
- **Arquivos prováveis:** `src/components/ErrorBoundary.tsx`.
- **Tipo:** UI.

## Entrega 6 — Integração

### T-20 — Compor a tela principal

- **Descrição:** Conectar hooks e componentes à experiência da tela inicial.
- **Critérios de aceite:**
  - Sem cidade salva, mostra boas-vindas/instrução e não chama forecast nem
    geolocalização.
  - `App` compõe componentes por props; não importa services nem storage.
  - Estados de busca/clima idle, loading, success, empty e error têm
    apresentação correspondente.
- **Dependências:** T-12, T-13, T-15, T-16, T-17, T-18, T-14.
- **Arquivos prováveis:** `src/App.tsx`.
- **Tipo:** UI.

### T-21 — Instalar Error Boundary na raiz

- **Descrição:** Envolver a aplicação com o boundary sem alterar renderização
  normal.
- **Critérios de aceite:**
  - Erro em componente descendente exibe fallback do boundary.
  - Sem exceção, busca e tela principal renderizam normalmente.
- **Dependências:** T-19, T-20.
- **Arquivos prováveis:** `src/App.tsx`.
- **Tipo:** UI.

## Entrega 7 — Testes unitários e de componentes

### T-22 — Testar conversão de temperatura

- **Descrição:** Cobrir fórmula e arredondamento.
- **Critérios de aceite:**
  - Casos cobrem conversão nos dois sentidos, negativos, fracionários, empate e
    ida-e-volta com erro máximo de 1 °C.
  - Valor de origem permanece inalterado.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`.
- **Tipo:** Test.

### T-23 — Testar códigos meteorológicos

- **Descrição:** Cobrir tabela de códigos e fallback.
- **Critérios de aceite:**
  - Para cada código mapeado, teste verifica rótulo e ícone esperados.
  - Código desconhecido retorna texto literal da spec e ícone neutro.
- **Dependências:** T-05.
- **Arquivos prováveis:** `tests/unit/weatherCodes.test.ts`.
- **Tipo:** Test.

### T-24 — Testar formatação temporal

- **Descrição:** Cobrir locale, timezone e virada de dia.
- **Critérios de aceite:**
  - Mesmo timestamp tem datas esperadas em dois fusos fixos.
  - Testes passam sob timezone de processo diferente do timezone dos casos.
  - Timezone inválido é assertado como erro explícito.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/unit/dateTime.test.ts`.
- **Tipo:** Test.

### T-25 — Testar timeout e falha de rede no cliente HTTP

- **Descrição:** Verificar timeout/abort e rejeição de rede usando `fetch` mockado.
- **Critérios de aceite:**
  - Request pendente aborta aos 10.000 ms e não aborta antes.
  - Rejeição de rede resulta em `AppError` de rede e nenhuma chamada adicional.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/openMeteoClient.test.ts`.
- **Tipo:** Test.

### T-26 — Testar classificação HTTP e Retry-After

- **Descrição:** Verificar status transitórios/permanentes e bloqueio de retry.
- **Critérios de aceite:**
  - Casos individuais cobrem 408, 429, 500, 599, 400, 401, 403, 404 e 418.
  - `Retry-After` válido em segundos e data HTTP bloqueia retry até o instante;
    valor ausente/inválido não cria espera infinita.
  - Nenhuma classe de erro inicia retry automático.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/openMeteoClient.test.ts`.
- **Tipo:** Test.

### T-27 — Testar cache e TTL

- **Descrição:** Verificar hit/miss, expiração e isolamento das chaves.
- **Critérios de aceite:**
  - Com relógio falso, hit em 599.999 ms e miss em 600.000 ms.
  - Termos de busca e chaves de forecast diferentes têm misses independentes.
  - Resultado de falha seguido de leitura da mesma chave continua sendo miss.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/weatherCache.test.ts`.
- **Tipo:** Test.

### T-28 — Testar serviço de geocoding

- **Descrição:** Verificar request e normalização do geocoding via mocks.
- **Critérios de aceite:**
  - Assert dos método, origem, caminho e parâmetros `name`, `count`, `language`,
    `format`.
  - Fixture com mais de oito resultados retorna oito mantendo ordem.
  - Casos cobrem results ausente/vazio, contexto ausente, coordenadas nos
    limites e fora das faixas válidas.
  - Payload malformado resulta em `invalid-data`.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/unit/geocodingService.test.ts`.
- **Tipo:** Test.

### T-29 — Testar serviço de previsão

- **Descrição:** Validar request, mapeamento e rejeição de payload inválido.
- **Critérios de aceite:**
  - Request tem os campos e parâmetros exatos de T-10.
  - Fixture válida gera clima atual e cinco dias mapeados índice a índice.
  - Arrays de 4/6 itens, campos ausentes, números não finitos, unidades
    inesperadas ou timezone inválido resultam em `invalid-data`.
  - Relógio em `America/Sao_Paulo` às 22h e cidade em `Asia/Tokyo` confirmam
    primeiro dia com data de Tokyo.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/unit/forecastService.test.ts`.
- **Tipo:** Test.

### T-30 — Testar persistência de preferências

- **Descrição:** Verificar conteúdo persistido, defaults e falhas do storage.
- **Critérios de aceite:**
  - JSON contém somente unidade e cidade permitidas; não contém forecast/clima.
  - Unidade inválida retorna Celsius; cidade inválida/JSON corrompido retorna
    defaults.
  - `getItem`/`setItem` que lançam exceção não propagam a falha.
- **Dependências:** T-11.
- **Arquivos prováveis:** `tests/unit/preferences.test.ts`.
- **Tipo:** Test.

### T-31 — Testar hook de busca

- **Descrição:** Verificar debounce, estados e respostas fora de ordem.
- **Critérios de aceite:**
  - Fake timers confirmam sem chamada aos 299 ms e uma chamada aos 300 ms;
    termo de um ponto de código não chama service.
  - Casos assertam os estados vazio e erro.
  - Resposta antiga resolvida depois da atual não altera o estado final.
- **Dependências:** T-12.
- **Arquivos prováveis:** `tests/unit/useCitySearch.test.ts`.
- **Tipo:** Test.

### T-32 — Testar hook de clima

- **Descrição:** Cobrir restauração, transições, seleção vigente e retry.
- **Critérios de aceite:**
  - Preferência salva restaura cidade/unidade, chama forecast uma vez e
    geocoding zero vezes.
  - Estados idle/loading/success/erro transitório/permanente são assertados;
    loading aparece aos 200 ms, não aos 199 ms.
  - Resposta tardia da cidade A não substitui dados da B.
  - Retry manual refaz operação uma vez; erro permanente/status desconhecido
    não oferece retry.
- **Dependências:** T-13.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`.
- **Tipo:** Test.

### T-33 — Testar interação do combobox

- **Descrição:** Cobrir teclado, seleção explícita e estados do componente.
- **Critérios de aceite:**
  - Testes verificam setas, Enter, Escape e abertura/fechamento da lista.
  - Uma opção única não dispara seleção antes de ação explícita.
  - Roles, labels e atributos ARIA definidos no componente estão presentes.
- **Dependências:** T-15.
- **Arquivos prováveis:** `tests/unit/CitySearch.test.tsx`.
- **Tipo:** Test.

### T-34 — Testar apresentação dos resultados de busca

- **Descrição:** Cobrir contexto geográfico, fallback de coordenadas e mensagens.
- **Critérios de aceite:**
  - Fixture com país/região mostra esses campos; sem ambos mostra coordenadas
    com duas casas.
  - Loading, vazio e erro exibem as mensagens pt-BR esperadas.
- **Dependências:** T-15.
- **Arquivos prováveis:** `tests/unit/CitySearch.test.tsx`.
- **Tipo:** Test.

### T-35 — Testar cartão de clima atual

- **Descrição:** Verificar campos, horário e fallback de localização.
- **Critérios de aceite:**
  - Fixture assertada verifica cada campo de FR-03 e o horário formatado no
    timezone do snapshot.
  - Região/país ausentes mostram coordenadas; código desconhecido mostra
    fallback/ícone neutro.
- **Dependências:** T-16.
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`.
- **Tipo:** Test.

### T-36 — Testar lista de previsão

- **Descrição:** Verificar quantidade, ordem e conteúdo diário.
- **Critérios de aceite:**
  - Fixture válida produz exatamente cinco itens na ordem de entrada.
  - Cada item contém dia/data, máxima, mínima, condição e ícone esperados em
    pt-BR; saída não contém `NaN` ou `undefined`.
- **Dependências:** T-17.
- **Arquivos prováveis:** `tests/unit/ForecastList.test.tsx`.
- **Tipo:** Test.

### T-37 — Testar controle de unidade

- **Descrição:** Verificar unidade inicial, interação e estado acessível.
- **Critérios de aceite:**
  - Testes verificam unidades emitidas pelo callback ao selecionar cada opção.
  - Controle é consultável por role/nome e expõe a opção selecionada.
- **Dependências:** T-18.
- **Arquivos prováveis:** `tests/unit/UnitToggle.test.tsx`.
- **Tipo:** Test.

### T-38 — Testar Error Boundary

- **Descrição:** Cobrir fallback e diagnóstico seguro.
- **Critérios de aceite:**
  - Child que lança erro produz fallback com `role="alert"` e botão de recarga.
  - Logger em desenvolvimento recebe o erro sem query, latitude, longitude ou
    dados meteorológicos; modo produção não mostra detalhes técnicos.
- **Dependências:** T-19.
- **Arquivos prováveis:** `tests/unit/ErrorBoundary.test.tsx`.
- **Tipo:** Test.

### T-39 — Testar integração de `App`

- **Descrição:** Validar composição com hooks controlados por mocks.
- **Critérios de aceite:**
  - Casos separados assertam boas-vindas, loading, sucesso, vazio e erro.
  - `App` renderiza valores/callbacks dos hooks e não acessa services/storage.
  - Exceção lançada por componente descendente renderiza o fallback do boundary.
- **Dependências:** T-20, T-21.
- **Arquivos prováveis:** `tests/unit/App.test.tsx`.
- **Tipo:** Test.

## Entrega 8 — E2E e validação de qualidade

### T-40 — E2E de primeira visita e busca

- **Descrição:** Cobrir abertura inicial e seleção explícita com Playwright.
- **Critérios de aceite:**
  - Storage limpo exibe boas-vindas/instrução e não dispara forecast nem
    geolocalização.
  - Sugestões mockadas são exibidas; cidade só é selecionada após ação explícita.
  - Teste não faz requests reais à Open-Meteo.
- **Dependências:** T-20, T-39.
- **Arquivos prováveis:** `tests/e2e/search-flow.spec.ts`.
- **Tipo:** Test.

### T-41 — E2E de clima, previsão e unidade

- **Descrição:** Cobrir apresentação do snapshot e alternância de temperatura.
- **Critérios de aceite:**
  - Fixture de forecast exibe campos atuais e exatamente cinco dias.
  - Alternar °C/°F atualiza temperaturas; contador de requests permanece igual.
  - Geocoding e forecast são interceptados no teste.
- **Dependências:** T-20, T-39.
- **Arquivos prováveis:** `tests/e2e/weather-flow.spec.ts`.
- **Tipo:** Test.

### T-42 — E2E de preferências restauradas

- **Descrição:** Verificar persistência e atualização de clima após reload.
- **Critérios de aceite:**
  - Após gravar preferências e recarregar, cidade/unidade correspondem aos
    valores salvos.
  - Captura de rede confirma zero chamadas de geocoding e uma de forecast após
    iniciar a sessão restaurada.
  - Em build de produção, mock responde em até 2.000 ms e dados aparecem em
    menos de 10.000 ms desde a navegação.
- **Dependências:** T-20, T-39.
- **Arquivos prováveis:** `tests/e2e/preferences.spec.ts`.
- **Tipo:** Test.

### T-43 — E2E de erros e recuperação

- **Descrição:** Validar estados vazios, erros e recuperação manual.
- **Critérios de aceite:**
  - Casos separados cobrem vazio, erro transitório, permanente, 429 com
    `Retry-After`, timeout, retry e payload incompleto.
  - Retry aparece para rede/timeout/408/429/5xx e não para 400/401/403/404.
  - Sem ação do usuário, contador de requests não aumenta após a falha.
  - Forecast 404 de cidade salva oferece busca manual; geocoding só ocorre após
    nova pesquisa do usuário.
  - Resposta atrasada de A não substitui cidade B.
- **Dependências:** T-20, T-39.
- **Arquivos prováveis:** `tests/e2e/errors.spec.ts`.
- **Tipo:** Test.

### T-44 — Verificar responsividade

- **Descrição:** Testar viewports e dimensões dos controles.
- **Critérios de aceite:**
  - Viewports 320, 360, 768 e 1280 CSS px são testados em retrato/paisagem.
  - Em cada cenário, `scrollWidth <= clientWidth`.
  - Controles visíveis têm bounding box mínimo de 44×44 CSS px.
- **Dependências:** T-40, T-41.
- **Arquivos prováveis:** `tests/e2e/responsive.spec.ts`.
- **Tipo:** Test.

### T-45 — Verificar acessibilidade automatizada

- **Descrição:** Testar teclado, axe, foco e contraste dos fluxos principais.
- **Critérios de aceite:**
  - Tab/Shift+Tab alcançam controles; Enter/Espaço operam botões/toggle;
    setas/Enter/Escape operam combobox.
  - axe encontra zero violações críticas/sérias nas vistas inicial, sucesso,
    vazio e erro.
  - Contraste é ≥ 4,5:1 para texto normal e ≥ 3:1 para texto grande/controles.
- **Dependências:** T-40, T-41, T-43.
- **Arquivos prováveis:** `tests/e2e/accessibility.spec.ts`.
- **Tipo:** Test.

## Entrega 9 — Hardening e release

### T-46 — Validar compatibilidade de navegadores

- **Descrição:** Executar e registrar matriz de navegadores desktop e móveis.
- **Critérios de aceite:**
  - Duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari são
    verificadas; Chrome Android e Safari iOS cobrem duas versões principais
    atuais dos respectivos sistemas.
  - Registro informa navegador/SO, versões, data e resultados de abrir, buscar,
    selecionar, ver forecast e alternar unidade.
  - Falha fica registrada como bloqueio ou issue, não como aprovação.
- **Dependências:** T-40, T-41, T-42, T-44, T-45.
- **Arquivos prováveis:** Registro de validação do release.
- **Tipo:** Test.

### T-47 — Verificar tempo de renderização

- **Descrição:** Medir renderização após resposta bem-sucedida usando mock.
- **Critérios de aceite:**
  - Instante de resposta resolvida e primeiro render de resultado/clima são
    medidos no mesmo teste.
  - Diferença é ≤ 1.000 ms; latência de rede não entra no intervalo.
- **Dependências:** T-40, T-41.
- **Arquivos prováveis:** `tests/e2e/render-performance.spec.ts`.
- **Tipo:** Test.

### T-48 — Medir Lighthouse Mobile

- **Descrição:** Verificar Core Web Vitals no build de produção.
- **Critérios de aceite:**
  - Cinco execuções no mesmo build/ambiente registram LCP e TBT individualmente.
  - Mediana satisfaz LCP ≤ 2.500 ms e TBT ≤ 200 ms.
  - Registro informa build e ambiente utilizado.
- **Dependências:** T-20, T-41.
- **Arquivos prováveis:** Script/configuração Lighthouse ou registro de release.
- **Tipo:** Test.

### T-49 — Verificar orçamento de bundle

- **Descrição:** Medir JavaScript transferido na visita inicial.
- **Critérios de aceite:**
  - Relatório lista todos os chunks JS carregados na visita inicial do build
    de produção.
  - Soma dos tamanhos comprimidos em gzip é ≤ 200 KiB.
  - Arquivos incluídos e tamanho total ficam registrados.
- **Dependências:** T-20.
- **Arquivos prováveis:** Script/configuração de medição ou registro de release.
- **Tipo:** Test.

### T-50 — Configurar headers de segurança

- **Descrição:** Aplicar HTTPS e CSP no provedor de hospedagem aprovado.
- **Critérios de aceite:**
  - HTTP redireciona para HTTPS; app publicado não carrega por HTTP.
  - CSP inclui `default-src 'self'`, `connect-src` limitado a self e às duas
    origens Open-Meteo, `object-src 'none'`, `base-uri 'self'` e
    `frame-ancestors 'none'`.
  - CSP não contém `unsafe-eval`; headers no domínio publicado confirmam as
    diretivas.
- **Dependências:** T-20. **Bloqueios externos:** OQ-07 e OQ-08.
- **Arquivos prováveis:** Configuração de headers da hospedagem aprovada.
- **Tipo:** Infra.

### T-51 — Auditar privacidade das requisições

- **Descrição:** Confirmar dados mínimos enviados à Open-Meteo.
- **Critérios de aceite:**
  - Requisição de geocoding contém somente termo e parâmetros definidos no plano.
  - Forecast contém somente coordenadas selecionadas e parâmetros meteorológicos
    necessários.
  - Testes não encontram query pessoal ou campos locais desnecessários na URL.
- **Dependências:** T-07, T-09, T-10.
- **Arquivos prováveis:** `tests/unit/openMeteoClient.test.ts`.
- **Tipo:** Test.

### T-52 — Auditar armazenamento local

- **Descrição:** Confirmar que apenas preferências permitidas ficam persistidas.
- **Critérios de aceite:**
  - Inspeção da chave/JSON confirma apenas unidade e cidade permitida.
  - Nenhum campo de clima/forecast ou identificador de tracking é persistido.
- **Dependências:** T-11, T-30.
- **Arquivos prováveis:** `tests/unit/preferences.test.ts`.
- **Tipo:** Test.

### T-53 — Auditar logs de diagnóstico

- **Descrição:** Confirmar diagnóstico útil sem dados do usuário.
- **Critérios de aceite:**
  - Falhas de integração e de renderização são identificáveis em desenvolvimento.
  - Spy dos logs não recebe termo, latitude, longitude nem dados meteorológicos.
- **Dependências:** T-07, T-19, T-38.
- **Arquivos prováveis:** `tests/unit/ErrorBoundary.test.tsx`.
- **Tipo:** Test.

### T-54 — Executar gate final de qualidade

- **Descrição:** Consolidar resultados automatizados e evidências dos NFRs.
- **Critérios de aceite:**
  - `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` terminam com código
    0; build/commit e resultados ficam registrados.
  - Cada AC da matriz da spec tem teste executado ou justificativa registrada
    para ausência de automação.
  - Evidências de browsers, responsividade, axe/contraste, desempenho,
    bundle e CSP/HTTPS estão registradas.
  - Decisões de OQ-04/OQ-05/OQ-07/OQ-08/OQ-09 estão registradas; gate aberto
    bloqueia o release/produção correspondente.
- **Dependências:** T-22, T-23, T-24, T-25, T-26, T-27, T-28, T-29, T-30, T-31,
  T-32, T-33, T-34, T-35, T-36, T-37, T-38, T-39, T-40, T-41, T-42, T-43,
  T-44, T-45, T-46, T-47, T-48, T-49, T-50, T-51, T-52, T-53.
- **Arquivos prováveis:** Registro de release/CI; nenhum arquivo de produto.
- **Tipo:** Test.
