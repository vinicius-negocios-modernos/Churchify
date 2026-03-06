# Delegation Enforcement — AIOX Rules

> Regras de delegacao obrigatoria e templates de prompt. Origem: ~360 sessoes, Central MKT.

## Regra: 2+ Tool Calls = Delegar

**Se uma tarefa requer 2 ou mais tool calls, ela DEVE ser delegada a um subagente.**

Orion so executa diretamente:
- 1 Read (arquivo pequeno, para coordenacao)
- 1 `git status` / `git log` / `git branch`
- 1 Grep/Glob (busca rapida para decidir delegacao)

Qualquer coisa alem disso -> Task tool com AIOX agent identity.

## Decision Matrix: Delegar ou Direto?

| Cenario | Tool Calls | Delegar? | Agent | Model |
|---------|-----------|----------|-------|-------|
| Ler 1 story para decidir proximo passo | 1 Read | NAO | — | — |
| Ler story + implementar task | 3+ | SIM | @dev | opus |
| Verificar PR status | 2-3 gh calls | SIM | @devops | haiku |
| Pesquisar padrao no codigo | 3+ Grep/Read | SIM | @dev | haiku |
| Criar story completa | 5+ Read/Write | SIM | @sm | opus |
| Rodar testes + lint | 2+ Bash | SIM | @qa | opus |
| Commit + push + PR | 3+ git/gh | SIM | @devops | opus |
| Ler MEMORY.md | 1 Read | NAO | — | — |
| git status | 1 Bash | NAO | — | — |
| Editar rules file (AIOX framework) | 1-2 Edit | NAO (dominio Orion) | — | — |

## The Read-to-Edit Trap

**Anti-pattern:** Orion le um arquivo "para preparar o edit", depois edita diretamente. Isso burla agent boundaries disfarçando implementacao como "investigacao".

**Regra:** Se ler um arquivo e pre-requisito para edita-lo, a sequencia INTEIRA (read -> analyze -> edit -> verify) pertence ao agente responsavel. Orion NAO participa de nenhuma etapa.

**Teste:** Antes de chamar `Read` em qualquer arquivo, perguntar: "Vou (Orion) precisar editar este arquivo?" Se SIM -> delegar a task inteira ao agente responsavel. Se NAO (info pura de coordenacao) -> prosseguir.

## Prompt Templates para Subagentes

### Quick Research (haiku)
```
You are Dex (@dev), the AIOX Development Agent.
BOUNDARIES: Read-only. Do NOT edit any files.
TASK: Find {WHAT} in the codebase.
CONTEXT: {WHY_NEEDED}
OUTPUT: File path(s) + 5-line summary of findings. Max 20 lines.
```

### Implement Task (opus)
```
You are Dex (@dev), the AIOX Development Agent.
BOUNDARIES: Write app code. No git commit/push (-> @devops). No schema changes (-> @data-engineer).
TASK: {TASK_DESCRIPTION}
STORY: {STORY_ID} — Task {TASK_NUMBER}
FILES: {EXACT_PATHS}
CONTEXT: {RELEVANT_CONTEXT}
OUTPUT: Summary of changes made + any issues found. Max 40 lines.
```

### Git Operations (haiku or opus)
```
You are Gage (@devops), the AIOX DevOps Agent.
BOUNDARIES: Git commit/push, gh pr create/merge, CI/CD. No app code changes.
TASK: {GIT_OPERATION}
CONTEXT: {WHAT_CHANGED_AND_WHY}
OUTPUT: Command outputs + confirmation. Max 20 lines.
```

### QA Gate (opus)
```
You are Quinn (@qa), the AIOX QA Agent.
BOUNDARIES: Run tests, lint, typecheck. Make PASS/FAIL decisions. No code changes.
TASK: Run QA gate for Story {STORY_ID}.
CONTEXT: {WHAT_WAS_IMPLEMENTED}
CONSTRAINTS: Run sequentially (memory protection rule). --maxWorkers=2.
OUTPUT: PASS or FAIL + issues list. Max 30 lines.
```

### Story/Doc Creation (opus)
```
You are River (@sm), the AIOX Scrum Master.
BOUNDARIES: Create/edit story files in docs/stories/. No app code.
TASK: Create story {STORY_ID} from epic context.
FILES: {EPIC_FILE}, {TEMPLATE_PATH}
CONTEXT: {EPIC_CONTEXT}
OUTPUT: Story file content. Max 80 lines.
```

### Codebase Exploration (haiku)
```
You are Dex (@dev), the AIOX Development Agent.
BOUNDARIES: Read-only. Do NOT edit any files.
TASK: Explore {MODULE/AREA} and map its structure.
CONTEXT: {WHY_EXPLORING}
OUTPUT: File tree + key patterns + entry points. Max 30 lines.
```

### MEMORY.md Update (haiku)
```
You are a consolidation agent.
TASK: Update MEMORY.md with session progress.
CURRENT_MEMORY: {PASTE_CURRENT_RELEVANT_SECTION}
NEW_FACTS: {LIST_OF_VERIFIED_FACTS}
OUTPUT: Updated MEMORY.md content for the changed sections only. Max 50 lines.
```

## Parallel Batching Patterns

### Story Implementation (tipico)
```
Phase 1 — Research (parallel, haiku):
  Agent A: Explore module structure
  Agent B: Read story + extract tasks
  Agent C: Check current branch/PR status

Phase 2 — Implement (parallel, opus):
  Agent D: Implement task 1 (file A)
  Agent E: Implement task 2 (file B)
  Agent F: Implement task 3 (file C)

Phase 3 — Validate (serial, opus — memory protection):
  Agent G: QA gate (tests + lint + typecheck)

Phase 4 — Ship (serial, opus):
  Agent H: Commit + push + PR
```

## Anti-Patterns

| # | Anti-Pattern | Correto |
|---|-------------|---------|
| 1 | Orion Read(file) -> Orion Edit(file) | Task(@dev, "Read + Edit file") |
| 2 | Orion Grep(p1) -> Grep(p2) -> Read -> analisa | Task(@dev/haiku, "Find pattern and analyze") |
| 3 | Orion git add -> git commit -> git push | Task(@devops, "Commit and push changes") |
| 4 | Orion Read(story) -> analisa -> planeja -> Read(code) | Orion Read(story) -> Task(@dev, "Implement") |
| 5 | Agent A (npm test) + Agent B (lint) paralelo | Serial: test -> lint -> typecheck |
| 6 | QA gate Story A + QA gate Story B paralelo | Serial: QA A -> QA B |
| 7 | 5 subagents retornam -> Orion constroi tabela | Task(haiku, "Consolidate 5 results into 30 lines") |
