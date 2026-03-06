# AIOX Context & Workflow Optimization Guide

> Guia consolidado das praticas que otimizam uso de subagentes, qualidade de entregas e gestao da janela de contexto em projetos AIOX com Claude Code.
>
> **Origem:** Projeto Central MKT — ~360 sessoes, 39 stories, ~201 SP entregues.
> **Adaptado para:** Churchify (AIOX) — 2026-03-06
> **Versao:** 2.0 (AIOX)

---

## Sumario

1. [5 Regras Fundamentais](#1-5-regras-fundamentais)
2. [Gestao de Contexto & Subagentes](#2-gestao-de-contexto--subagentes)
3. [Delegacao Obrigatoria](#3-delegacao-obrigatoria)
4. [Agent Boundaries](#4-agent-boundaries)
5. [Agent Handoff Protocol](#5-agent-handoff-protocol)
6. [Memory Protection](#6-memory-protection)
7. [Templates de Prompt para Subagentes](#7-templates-de-prompt-para-subagentes)
8. [Parallel Batching Patterns](#8-parallel-batching-patterns)
9. [Anti-Patterns](#9-anti-patterns)

---

## 1. 5 Regras Fundamentais

> Detalhes completos: `.claude/rules/5-core-rules.md`

| # | Regra | Verificacao |
|---|-------|------------|
| 1 | **Delegar, Nunca Executar** | Zero Edit/Write em app code por Orion |
| 2 | **Evidencia, Nao Intencao** | MEMORY.md so registra fatos verificados |
| 3 | **Root Cause Antes de Fix** | 1 commit resolve tudo, nao incremental |
| 4 | **Subagentes com Limite** | Context counter visivel antes de cada batch |
| 5 | **MEMORY = Estado Real** | Secoes BLOCKING + Estado Atual obrigatorias |

---

## 2. Gestao de Contexto & Subagentes

> Detalhes completos: `.claude/rules/context-management.md`

### Resumo

- Orion = coordenacao SOMENTE. NUNCA edita codigo, NUNCA faz git commit/push
- 1 subagente = 1 arquivo ou 1 concern (micro-task decomposition)
- Max 5 subagentes por batch paralelo
- Output maximo: 40 linhas por subagente
- 4+ resultados -> delegar consolidacao a haiku
- Model: opus (julgamento) ou haiku (mecanico). NUNCA sonnet
- Context counter obrigatorio: `[context_rounds = N/40 · subagents = M/30 · GREEN/YELLOW/RED]`

---

## 3. Delegacao Obrigatoria

> Detalhes completos: `.claude/rules/delegation-enforcement.md`

### Regra de Ouro: 2+ Tool Calls = Delegar

Orion so executa direto: 1 Read, 1 git status/log, 1 Grep/Glob. Tudo mais -> Task tool.

### Read-to-Edit Trap

Se Orion le um arquivo e depois precisa edita-lo, a sequencia INTEIRA (read -> edit -> verify) pertence ao agente responsavel.

---

## 4. Agent Boundaries

| Operacao | Agente Exclusivo |
|----------|-----------------|
| Write app code | @dev (Dex) |
| Write/run tests | @dev (Dex) |
| `git commit`, `git push`, `gh pr` | @devops (Gage) |
| Database schema changes | @data-engineer (Dara) |
| QA gate (PASS/FAIL) | @qa (Quinn) |
| Architecture decisions | @architect (Aria) |
| PRD creation | @pm (Morgan) |
| Story creation | @sm (River) |
| UI/UX design | @ux-design-expert (Uma) |
| AIOX framework files | @aiox-master (Orion) |

**Universalmente permitido:** git status/log/diff, Read, Glob/Grep, quality checks (validacao apenas).

---

## 5. Agent Handoff Protocol

> Detalhes completos: `.claude/rules/agent-handoff.md`

Ao trocar de agente, o anterior gera handoff artifact (~379 tokens) com: story context, decisions, files modified, blockers, next action.

| Switches | Sem handoff | Com handoff | Economia |
|----------|------------|-------------|----------|
| 1 | ~8K tokens | ~5.4K | 33% |
| 2 | ~12K tokens | ~5.2K | 57% |
| 3+ | ~15K+ tokens | ~5.5K | 63%+ |

---

## 6. Memory Protection

> Detalhes completos: `.claude/rules/context-management.md` (secao Memory Protection)

- Max 1 subagente Node.js pesado por vez (test, build, lint, typecheck)
- QA gates SEMPRE serializados
- Verificacao pre-lancamento: `[memory_check: heavy_node_running = YES/NO]`

---

## 7. Templates de Prompt para Subagentes

> Templates completos: `.claude/rules/delegation-enforcement.md` (secao Prompt Templates)

| Template | Model | Uso |
|----------|-------|-----|
| Quick Research | haiku | Busca no codebase, read-only |
| Implement Task | opus | Implementacao de codigo |
| Git Operations | haiku/opus | Commit, push, PR |
| QA Gate | opus | Tests + lint + typecheck |
| Story Creation | opus | Draft de stories |
| Codebase Exploration | haiku | Mapear estrutura de modulos |
| MEMORY.md Update | haiku | Salvar progresso da sessao |

---

## 8. Parallel Batching Patterns

### Story Implementation (tipico)
```
Phase 1 — Research (parallel, haiku)
Phase 2 — Implement (parallel, opus)
Phase 3 — Validate (serial, opus — memory protection)
Phase 4 — Ship (serial, opus)
```

### Bug Fix (tipico)
```
Phase 1 — Diagnose (parallel, haiku)
Phase 2 — Fix (serial, opus)
Phase 3 — Validate + Ship (serial)
```

---

## 9. Anti-Patterns

| # | ERRADO | CERTO |
|---|--------|-------|
| 1 | Orion Read -> Orion Edit | Task(@dev, "Read + Edit") |
| 2 | Orion multi-Grep -> analisa | Task(@dev/haiku, "Find + analyze") |
| 3 | Orion git add -> commit -> push | Task(@devops, "Commit + push") |
| 4 | npm test + lint + typecheck paralelo | Serial: test -> lint -> typecheck |
| 5 | QA gate A + QA gate B paralelo | Serial: QA A -> QA B |
| 6 | 5 results -> Orion constroi tabela | Task(haiku, "Consolidate") |

---

## Resultados Medidos (Central MKT)

| Metrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Duracao media de sessao | ~15 rounds | ~35 rounds | 2.3x |
| Crashes por RAM | Frequente | Zero | 100% |
| Commits por bug fix | 3-4 | 1 | 75% menos |
| Context overflow | Frequente | Zero | 100% |
| Qualidade MEMORY.md | Intencoes vagas | Fatos com evidencia | Confiavel |
| Agente fora do escopo | Recorrente | Raro | ~90% menos |

---

*Adaptado por Orion (AIOX Master) — Churchify Project, 2026-03-06*
*Baseado em licoes de ~360 sessoes de desenvolvimento real (Central MKT)*
