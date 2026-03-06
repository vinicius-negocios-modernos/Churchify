# Claude Code Agent Teams — Pesquisa & Plano de Integração AIOX

> **Data:** 2026-02-11
> **Autor:** Orion (AIOX Master)
> **Status:** Pesquisa concluída, aguardando decisão de implementação
> **Versão:** 1.0

---

## Sumário Executivo

Claude Code Agent Teams é uma feature experimental lançada com o Opus 4.6 (Fev/2026) que permite orquestrar **múltiplas sessões Claude Code trabalhando em paralelo**, com comunicação direta entre si via mailbox e coordenação via task list compartilhada.

Nossa análise demonstra que o framework Synkra AIOX já possui uma arquitetura fortemente alinhada com essa feature — 13 agentes especializados, agent bundles, workflows com fases e quality gates. A integração pode ser feita em **3 níveis progressivos**, desde ativação imediata (zero mudanças) até integração profunda com spawn prompts por persona.

---

## Índice

1. [Visão Geral da Feature](#1-visão-geral-da-feature)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Configuração e Uso](#3-configuração-e-uso)
4. [Casos de Uso e Benchmarks](#4-casos-de-uso-e-benchmarks)
5. [Análise: AIOX vs Agent Teams](#5-análise-aiox-vs-agent-teams)
6. [Plano de Integração](#6-plano-de-integração)
7. [Cenários de Uso Paralelo](#7-cenários-de-uso-paralelo)
8. [Considerações de Custo](#8-considerações-de-custo)
9. [Limitações e Riscos](#9-limitações-e-riscos)
10. [Recomendações](#10-recomendações)
11. [Fontes](#11-fontes)

---

## 1. Visão Geral da Feature

### O que são Agent Teams?

Agent Teams permite coordenar múltiplas instâncias do Claude Code como um time. Uma sessão atua como **Team Lead** (coordenador), enquanto **Teammates** trabalham independentemente, cada um com seu próprio context window, comunicando-se diretamente entre si.

### Subagents vs Agent Teams

| Aspecto | Subagents (Task tool) | Agent Teams |
|---|---|---|
| **Contexto** | Compartilha janela do pai | Cada um tem contexto próprio |
| **Comunicação** | Só reporta ao principal | Teammates conversam entre si |
| **Coordenação** | Agente principal gerencia tudo | Task list compartilhada + auto-coordenação |
| **Melhor para** | Tarefas focadas, resultado único | Trabalho complexo, discussão e colaboração |
| **Custo (tokens)** | Menor (~440k p/ 3 agents) | Maior (~800k p/ 3 teammates) |

### Quando usar cada um

- **Subagents:** pesquisa rápida, verificação pontual, tarefas onde só o resultado importa
- **Agent Teams:** features multi-camada, QA paralelo, debug com hipóteses concorrentes, research que requer cruzamento de informações

---

## 2. Arquitetura Técnica

### Componentes Principais

```
┌─────────────────────────────────────────────────────┐
│                    TEAM LEAD                         │
│  (sessão principal, coordena, delega, sintetiza)     │
├──────────┬──────────┬──────────┬───────────────────┤
│          │          │          │                     │
▼          ▼          ▼          ▼                     │
┌────────┐┌────────┐┌────────┐┌────────┐              │
│Teammate││Teammate││Teammate││Teammate│              │
│   #1   ││   #2   ││   #3   ││   #N   │              │
└───┬────┘└───┬────┘└───┬────┘└───┬────┘              │
    │         │         │         │                    │
    └─────────┴────┬────┴─────────┘                    │
                   │                                   │
            ┌──────┴──────┐                            │
            │  SHARED     │                            │
            │  TASK LIST  │◄───────────────────────────┘
            │  + MAILBOX  │
            └─────────────┘
```

### 7 Primitivas (Tools)

| # | Primitiva | Função |
|---|-----------|--------|
| 1 | `TeamCreate` | Inicializa time, cria diretório e config.json |
| 2 | `TaskCreate` | Cria tarefas como JSON em disco com descrição detalhada |
| 3 | `TaskUpdate` | Claim/complete de tarefas com file locking |
| 4 | `TaskList` | Lista status de todas as tarefas |
| 5 | `Task` (team) | Spawna teammate como sessão Claude Code completa |
| 6 | `SendMessage` | Comunicação direta: message, broadcast, shutdown |
| 7 | `TeamDelete` | Cleanup de config e tarefas |

### 13 Operações Internas (TeammateTool)

**Gestão:** spawnTeam, discoverTeams, cleanup
**Membership:** requestJoin, approveJoin, rejectJoin
**Coordenação:** write (peer msg), broadcast (all)
**Plano:** approvePlan, rejectPlan
**Shutdown:** requestShutdown, approveShutdown, rejectShutdown

### Storage Local

```
~/.claude/teams/{team-name}/
├── config.json                    # members array (name, agentId, agentType)
└── messages/{session-id}/         # mailbox por sessão

~/.claude/tasks/{team-name}/
└── {task-id}.json                 # subject, description, status, owner, dependencies
```

### Variáveis de Ambiente (por teammate)

```bash
CLAUDE_CODE_TEAM_NAME=my-team
CLAUDE_CODE_AGENT_ID=teammate-abc123
CLAUDE_CODE_AGENT_TYPE=developer
```

### Ciclo de Vida de uma Task

```
pending ──► in_progress ──► completed
   │                           │
   │   (file locking previne   │
   │    claims simultâneos)    │
   │                           │
   └── blocked by dependency ──┘
        (auto-unblock quando
         dependência completa)
```

---

## 3. Configuração e Uso

### Ativar a Feature

```json
// settings.json (ou ~/.claude/settings.json)
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### Display Modes

| Modo | Descrição | Requisitos |
|------|-----------|------------|
| `in-process` | Todos no mesmo terminal | Qualquer terminal |
| `tmux` | Split panes via tmux | tmux instalado |
| `iTerm2` | Split panes nativo | iTerm2 + it2 CLI |
| `auto` (default) | Split se já em tmux, senão in-process | — |

```json
{ "teammateMode": "tmux" }
```

Override por sessão:
```bash
claude --teammate-mode in-process
```

### Controles de Teclado

| Atalho | Função |
|--------|--------|
| `Shift+Up/Down` | Selecionar teammate |
| `Enter` | Ver sessão do teammate |
| `Escape` | Interromper turno atual |
| `Ctrl+T` | Toggle task list |
| `Shift+Tab` | Delegate mode (lead só coordena) |

### Criação Natural de Times

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
```

### Plan Approval para Teammates

```
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```

O teammate trabalha em **read-only plan mode** até o lead aprovar. Critérios configuráveis via prompt.

### Quality Gate Hooks

| Hook | Trigger | Exit Code 2 = |
|------|---------|----------------|
| `TeammateIdle` | Teammate vai ficar idle | Feedback + continua trabalhando |
| `TaskCompleted` | Task marcada complete | Bloqueia completion + feedback |

---

## 4. Casos de Uso e Benchmarks

### Caso Real: Compilador C em Rust (Anthropic, Fev/2026)

| Métrica | Valor |
|---------|-------|
| Agentes | 16 |
| Sessões Claude Code | ~2.000 |
| Custo API | ~$20.000 |
| Linhas de código | 100.000 |
| Resultado | Compilador Rust que compila Linux 6.9 (x86, ARM, RISC-V) |

### Cenários Ideais

1. **QA Swarm** — 5 teammates verificam URLs, posts, links, SEO, a11y em paralelo
2. **Debug Adversarial** — teammates testam hipóteses concorrentes e debatem entre si
3. **Code Review Multi-Lente** — segurança, performance, cobertura de testes simultâneamente
4. **Cross-Layer Feature** — frontend, backend, database, testes em paralelo

---

## 5. Análise: AIOX vs Agent Teams

### Mapeamento de Conceitos

| Conceito AIOX | Conceito Agent Teams | Compatibilidade |
|---|---|---|
| 13 agentes especializados | Teammates com roles | Direta |
| Agent bundles (`agent-teams/*.yaml`) | Team configurations | Direta |
| Workflows com fases + handoffs | Task lists + dependencies | Adaptável |
| Quality gates (3 camadas) | Hooks (TeammateIdle, TaskCompleted) | Mapeável |
| GreetingBuilder + session context | CLAUDE.md (lido por todos) | Automática |
| Story files como shared state | Task files em disco | Complementar |
| `*task`, `*workflow` commands | TeamCreate, TaskCreate | Ponte necessária |
| CodeRabbit self-healing | Plan approval workflow | Análogo |
| YOLO/Interactive/Pre-flight modes | Delegate mode + plan approval | Mapeável |
| Decision recorder | Mailbox messages | Integrável |

### Bundles Existentes (prontos para uso)

```yaml
# .aiox-core/development/agent-teams/
team-fullstack.yaml     # @analyst, @pm, @ux-expert, @architect, @po
team-qa-focused.yaml    # @dev, @qa, @devops (quality gates, CodeRabbit)
team-no-ui.yaml         # @analyst, @pm, @architect, @po (service only)
team-all.yaml           # todos os agentes
team-ide-minimal.yaml   # configuração mínima
```

### Gaps Identificados

| Gap | Descrição | Impacto |
|-----|-----------|---------|
| Spawn prompt por persona | Teammates não recebem persona YAML automaticamente | Médio |
| Workflow parallelism flag | Workflows não declaram fases paralelizáveis | Médio |
| Hook integration | Quality gates não mapeados para hooks | Baixo |
| Cost tracking | Sem monitoramento de tokens por team | Baixo |

---

## 6. Plano de Integração

### Nível 1 — Imediato (zero mudanças no framework)

**Esforço:** Configuração apenas
**Valor:** Alto — permite usar Agent Teams com nossos agentes existentes

- [ ] Ativar `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` em settings.json
- [ ] Testar criação de time com natural language referenciando nossos agentes
- [ ] Validar que CLAUDE.md é lido corretamente por todos teammates
- [ ] Testar delegate mode com Orion como lead
- [ ] Documentar spawn prompts eficazes para cada agente AIOX

**Exemplo de uso imediato:**
```
Create an agent team for our Churchify project:
- Lead: orchestrator (coordinates all work)
- Teammate 1: frontend developer (React components in src/components/)
- Teammate 2: backend developer (API in src/api/)
- Teammate 3: QA reviewer (tests in src/__tests__/)
Require plan approval for all teammates.
```

### Nível 2 — Adaptação dos Workflows

**Esforço:** Médio
**Valor:** Alto — workflows paralelos nativos

- [ ] Adicionar campo `execution: parallel | sequential` nas fases dos workflows YAML
- [ ] Criar hooks AIOX para `TeammateIdle` e `TaskCompleted`:
  - Layer 1 (pre-commit) → `TaskCompleted` hook no @dev
  - Layer 2 (PR automation) → `TaskCompleted` hook no @devops
  - Layer 3 (human review) → `TeammateIdle` hook no @qa
- [ ] Atualizar GreetingBuilder para detectar context de team (env vars)
- [ ] Criar task `*create-team` que lê bundle YAML e gera prompt de criação

### Nível 3 — Integração Profunda

**Esforço:** Alto
**Valor:** Máximo — AIOX nativo com Agent Teams

- [ ] Mapear cada agente AIOX para `agent_type` com spawn prompt que inclui persona YAML
- [ ] Task descriptions que referenciam story files como dependencies
- [ ] Decision recorder integrado com mailbox (log de decisões entre teammates)
- [ ] Workflow navigator sugere team compositions baseado no tipo de tarefa
- [ ] Cost tracker por team/session integrado ao quality dashboard
- [ ] Agent bundle YAML gera automaticamente prompt de criação de team

---

## 7. Cenários de Uso Paralelo

### 7.1 Greenfield Fullstack — Workflow Paralelo

**Hoje (sequencial):**
```
@analyst → @pm → @ux → @architect → @po → @sm → @dev → @qa
(~8 handoffs sequenciais)
```

**Proposta (paralelo com Agent Teams):**
```
Fase 1 — Discovery (paralelo):
  ├── Teammate @analyst: research & project brief
  └── Teammate @ux-expert: user research & wireframes

Fase 2 — Planning (paralelo, após Fase 1):
  ├── Teammate @pm: PRD (baseado no research)
  └── Teammate @architect: architecture (baseado no research)

Fase 3 — Validation (sequencial, gate):
  └── Lead @po: valida PRD + architecture juntos

Fase 4 — Implementation (paralelo):
  ├── Teammate @dev-frontend: componentes UI
  ├── Teammate @dev-backend: API endpoints
  └── Teammate @data-engineer: database + migrations

Fase 5 — Quality (paralelo):
  ├── Teammate @qa: code review + testes
  └── Teammate @devops: PR automation + deploy gates
```

**Ganho estimado:** ~60% redução no tempo total (fases 1, 2, 4 e 5 paralelas)

### 7.2 QA Swarm

```
Lead: @qa (coordena e sintetiza)
├── Teammate 1: security review — foco em auth, tokens, input validation
├── Teammate 2: performance analysis — queries N+1, bundle size, load time
├── Teammate 3: test coverage — gaps, edge cases, error scenarios
└── Teammate 4: @devops — PR validation gates, lint, CI
```

### 7.3 Story Implementation (stories grandes)

```
Lead: @sm (coordena sprint)
├── Teammate @dev-1: frontend components (src/components/)
├── Teammate @dev-2: API endpoints (src/api/)
├── Teammate @dev-3: database migrations (src/db/)
└── Teammate @qa: review contínuo conforme code é produzido
```

### 7.4 Debug com Hipóteses Concorrentes

```
Lead: Orion (orquestra debate)
├── Teammate 1: investiga race condition nos workers
├── Teammate 2: investiga memory leak no cache layer
└── Teammate 3: investiga misconfiguration no environment
→ Teammates debatem entre si via mailbox
→ Lead sintetiza conclusão final
```

---

## 8. Considerações de Custo

### Token Usage por Configuração

| Configuração | Tokens Estimados | Custo Relativo |
|---|---|---|
| Sessão solo | ~200k | 1x |
| 3 subagents | ~440k | 2.2x |
| 3-person team | ~800k | 4x |
| 5-person team | ~1.2M | 6x |

### Recomendações de Custo

| Cenário | Recomendação |
|---------|--------------|
| Pesquisa pontual | Subagent (Task tool) |
| Bug fix simples | Sessão solo |
| Feature multi-camada | Agent Team (3-4 teammates) |
| QA completo | Agent Team (4-5 teammates) |
| Debug complexo | Agent Team (3 teammates adversariais) |
| Sprint planning | Sessão solo com Orion |

### Estratégia de Otimização

**Plan first (barato) → Team execution (caro mas rápido)**

1. `*plan` com Orion em sessão solo (~200k tokens)
2. Revisão e aprovação do plano pelo usuário
3. Agent Team execution com teammates especializados (~800k+ tokens)

Isso evita "teams que vão na direção errada" (500k+ tokens desperdiçados).

---

## 9. Limitações e Riscos

### Limitações Técnicas

| Limitação | Impacto | Mitigação |
|-----------|---------|-----------|
| Feature experimental | Pode mudar/quebrar | Manter fallback para workflow sequencial |
| Sem session resumption | Perde teammates no /resume | Usar tasks pequenas e auto-contidas |
| File conflicts | Overwrites entre teammates | Dividir ownership por diretório/arquivo |
| Um team por sessão | Sem nested orchestration | Planejar teams como unidades completas |
| Lead fixo | Não pode trocar coordenador | Escolher lead adequado desde o início |
| Split panes limitado | Não funciona em VS Code terminal | Usar tmux ou iTerm2 |
| Custo alto | 4-6x mais tokens que solo | Usar seletivamente, plan first |

### Riscos para o AIOX

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Feature removida/alterada | Média | Alto | Abstrair via camada AIOX |
| Custo descontrolado | Média | Médio | Limitar teammates, monitorar tokens |
| Perda de persona | Alta | Médio | Spawn prompts com YAML completo |
| Task status lag | Alta | Baixo | Verificação manual + nudge |

---

## 10. Recomendações

### Curto Prazo (esta semana)

1. **Ativar a feature** e testar com um cenário simples (QA swarm de 3 teammates)
2. **Documentar spawn prompts** eficazes para cada agente AIOX
3. **Validar compatibilidade** com nossos CLAUDE.md e agent-teams bundles

### Médio Prazo (próximas 2 semanas)

4. **Criar task `*create-team`** que lê bundle YAML e gera team automaticamente
5. **Atualizar workflows** com flags de paralelismo
6. **Implementar hooks** para quality gates

### Longo Prazo (próximo mês)

7. **Integração profunda** com spawn prompts por persona YAML
8. **Cost tracking** e dashboard de uso
9. **Workflow navigator** sugere team composition automaticamente
10. **Story automática** para rastrear progresso (Story X.X — Agent Teams Integration)

---

## 11. Fontes

| Fonte | Tipo | URL |
|-------|------|-----|
| Claude Code Docs (oficial) | Documentação | https://code.claude.com/docs/en/agent-teams |
| TechCrunch — Opus 4.6 Launch | Notícia | https://techcrunch.com/2026/02/05/anthropic-releases-opus-4-6-with-new-agent-teams/ |
| VentureBeat — Agent Teams | Análise | https://venturebeat.com/technology/anthropics-claude-opus-4-6-brings-1m-token-context-and-agent-teams-to-take |
| alexop.dev — Tasks to Swarms | Deep Dive | https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/ |
| Addy Osmani — Code Swarms | Best Practices | https://addyosmani.com/blog/claude-code-agent-teams/ |
| paddo.dev — Hidden Multi-Agent | Internals | https://paddo.dev/blog/claude-code-hidden-swarm/ |
| The Register — $20K Compiler | Case Study | https://www.theregister.com/2026/02/09/claude_opus_46_compiler/ |
| Anthropic — Building C Compiler | Official | https://www.anthropic.com/engineering/building-c-compiler |

---

*Documento gerado por Orion (AIOX Master) — Synkra AIOX Framework*
*Churchify Project — 2026-02-11*
