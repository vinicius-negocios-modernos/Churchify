# Relatorio Executivo de Divida Tecnica — Churchify

**Para:** Stakeholders e Lideranca do Projeto
**Data:** 2026-03-06
**Preparado por:** Alex (@analyst) — AIOX Research & Analysis Agent
**Base:** Technical Debt Assessment v1.0 FINAL (QA Score: 4.4/5.0)

---

## Resumo Executivo

O Churchify e uma plataforma que usa inteligencia artificial para transformar sermoes em conteudo para igrejas — posts para redes sociais, resumos, devocionais e mais. Hoje, o sistema existe como um **prototipo inicial** criado com auxilio de IA, e **nao esta pronto para uso real por igrejas**.

A avaliacao tecnica identificou **51 problemas** que precisam ser resolvidos antes que qualquer igreja possa usar a plataforma com seguranca. Os 3 mais urgentes sao:

1. **A chave de acesso a IA esta exposta publicamente** — qualquer pessoa com conhecimento basico pode extrair essa chave e gerar custos ilimitados na conta do projeto
2. **Nenhum dado e salvo** — todo conteudo gerado pela IA desaparece quando o usuario fecha ou atualiza a pagina
3. **A plataforma nao e segura para dados de igrejas** — nao existe separacao entre dados de diferentes igrejas, nem protecao de informacoes

O investimento total estimado para resolver todos os problemas e de **R$ 42.000** (280 horas x R$ 150/hora). Porem, existe um **caminho acelerado para o MVP** que custa **R$ 16.200** (108 horas) e entrega uma plataforma funcional em 4 semanas.

---

## Numeros-Chave

| Indicador | Valor |
|-----------|-------|
| Problemas identificados | 51 |
| Criticos (impedem qualquer uso) | 9 |
| Altos (impedem testes com usuarios) | 14 |
| Investimento total estimado | **R$ 42.000** (280h) |
| Investimento MVP (app funcional) | **R$ 16.200** (108h) |
| Margem de variacao | +/- 20% (R$ 33.600 a R$ 50.400 total) |
| Prazo total estimado | 9 semanas |
| Prazo ate MVP funcional | 4 semanas |
| Nota de experiencia do usuario atual | **3 de 10** |
| Nota-alvo apos correcoes | 7+ de 10 |

---

## Analise de Custos: Corrigir vs. Nao Corrigir

### Custo de Corrigir (Investimento)

| Fase | O Que Resolve | Horas | Custo (R$) | Prazo |
|------|--------------|-------|-----------|-------|
| **Fase 0** — Fundacao | Ferramentas de qualidade, build limpo | 24h | R$ 3.600 | Semana 1 |
| **Fase 1** — Migracao + Melhorias Rapidas | Login seguro, interface acessivel | 38h | R$ 5.700 | Semana 1-2 |
| **Fase 2** — Dados Persistentes | App salva e recupera dados | 46h | R$ 6.900 | Semana 2-4 |
| **Fase 3** — Funcionalidades + Seguranca | API protegida, video real, dashboard | 56h | R$ 8.400 | Semana 4-6 |
| **Fase 4** — Multi-igreja + Acabamento | Separacao por igreja, qualidade de codigo | 70h | R$ 10.500 | Semana 6-8 |
| **Fase 5** — Qualidade Final | Testes completos, polimento | 46h | R$ 6.900 | Semana 8-9 |
| **TOTAL** | | **280h** | **R$ 42.000** | **9 semanas** |

### Custo de NAO Corrigir (Risco)

| Risco | Probabilidade | Impacto Financeiro Estimado |
|-------|--------------|---------------------------|
| **Abuso da chave de IA exposta** — qualquer pessoa pode usar a chave para gerar conteudo e o custo vai para a conta do Churchify | Alta | R$ 5.000 a R$ 50.000+/mes em chamadas nao autorizadas |
| **Perda de usuarios por dados perdidos** — pastores gastam 30+ minutos gerando conteudo que desaparece ao fechar a pagina | Certa (100%) | Churn de 80%+ dos usuarios apos primeira experiencia |
| **Vazamento de dados entre igrejas** — sem isolamento, dados de uma igreja podem ser acessados por outra | Alta | Dano reputacional irreversivel; potencial acao judicial (LGPD) |
| **Plataforma inacessivel** — pessoas com deficiencia nao conseguem usar; nota de acessibilidade abaixo do minimo legal | Certa (100%) | Exclusao de ~25% do publico-alvo; risco legal |
| **Performance degradada** — carregamento de 3MB+ so de estilos visuais; imagens armazenadas em memoria | Alta | Experiencia lenta em celulares (maioria do publico de igrejas) |
| **Impossibilidade de escalar** — sem testes automatizados, cada nova funcionalidade pode quebrar as existentes | Certa (100%) | Custo de desenvolvimento 3-5x maior no futuro |

**Conclusao:** O custo de NAO agir supera amplamente o investimento de R$ 42.000. Somente o risco de abuso da chave de IA pode gerar prejuizos maiores que o investimento total em um unico mes.

---

## Impacto nos Negocios

### Seguranca — CRITICO

A chave da inteligencia artificial (Gemini/Google) esta visivel no codigo que roda no navegador do usuario. Isso significa que:
- Qualquer pessoa com conhecimento basico pode extrair essa chave
- Pode gerar custos ilimitados na conta do projeto
- Nao existe nenhuma protecao contra uso abusivo

**Analogia:** E como deixar a chave do carro no painel com a porta aberta.

### Experiencia do Usuario — INSATISFATORIA (3/10)

| Problema | Efeito para o Pastor/Lider |
|----------|--------------------------|
| Conteudo gerado desaparece ao fechar pagina | Trabalho perdido, frustacao |
| Nao existe indicador de progresso durante geracao | Parece que a plataforma travou |
| Upload de imagem nao funciona (so aparencia visual) | Promessa nao cumprida |
| Mensagens de erro em formato tecnico (alert) | Confusao, sensacao de produto amador |
| Nenhum tutorial de primeiro uso | Pastor nao sabe por onde comecar |
| Dashboard com dados falsos/fixos | Informacoes enganosas |

### Performance

- O carregamento visual (CSS) atual pesa **3MB sem compressao** — em conexoes lentas (comum em igrejas menores), a pagina pode demorar 10+ segundos para carregar
- Imagens sao armazenadas na memoria do navegador (2-10MB por sessao), causando lentidao em celulares

### Manutenibilidade

- **Zero testes automatizados** — qualquer mudanca no codigo pode quebrar funcionalidades sem que ninguem perceba ate o usuario reclamar
- **Sem padrao de codigo** — a medida que a equipe cresce, cada desenvolvedor escreve de um jeito diferente, aumentando bugs
- **Sem pipeline de qualidade** — nao existe verificacao automatica antes de publicar mudancas

---

## Caminho Recomendado: MVP em 4 Semanas

A recomendacao e investir nas **Fases 0 a 2** (R$ 16.200 / 108h) para ter um produto funcional:

```
Semana 1      Semana 2      Semana 3      Semana 4
[Fundacao]    [Migracao]    [Persistencia de Dados]
 R$ 3.600      R$ 5.700           R$ 6.900
                                                    -> MVP FUNCIONAL
```

**O que o MVP entrega:**
- Login seguro com Google (via Supabase)
- Dados salvos no banco de dados (nunca mais perde conteudo)
- Separacao basica de dados por usuario
- Interface acessivel com componentes profissionais
- Upload de imagem funcional
- Validacao de formularios amigavel
- Testes automatizados funcionando
- Build otimizado (pagina carrega rapido)

**O que fica para depois do MVP:**
- Analise de video real (atualmente a IA "adivinha" pelo titulo)
- Multi-igreja completo (convites, papeis, isolamento total)
- Dashboard com dados reais
- Proxy seguro para a API de IA
- Cobertura de testes em 80%

---

## Analise de Retorno (ROI)

### Cenario 1: Investir no MVP (R$ 16.200)

| Metrica | Sem Investimento | Com MVP |
|---------|-----------------|---------|
| Retencao de usuarios | ~10% (dados perdidos) | ~60%+ (dados persistentes) |
| Risco financeiro por chave exposta | R$ 5.000-50.000+/mes | Reduzido (mitigacao parcial) |
| Capacidade de captar igrejas-piloto | Nenhuma (produto inutilizavel) | 10-20 igrejas |
| Time-to-market para beta | Indefinido | 4 semanas |
| Custo de desenvolvimento futuro | 3-5x maior (sem testes/padrao) | Normal (fundacao solida) |

### Cenario 2: Investir nas Fases 0-3 (R$ 24.600 / 164h)

Alem do MVP, adiciona:
- **API de IA protegida** — elimina o risco de R$ 5.000-50.000+/mes
- **Analise de video real** — diferencial competitivo (a IA realmente entende o sermao)
- **Dashboard funcional** — metricas reais para lideres de igreja
- **CI/CD** — atualizacoes seguras e frequentes

**ROI estimado:** O investimento se paga em **1-2 meses** somente pela eliminacao do risco de abuso da chave de IA.

### Cenario 3: Investimento Completo (R$ 42.000 / 280h)

Entrega uma plataforma **production-ready**:
- Multi-igreja com isolamento completo
- Conformidade com acessibilidade (WCAG 2.1 AA)
- 80% de cobertura de testes
- Testes de ponta a ponta dos fluxos criticos
- Pronta para escalar para centenas de igrejas

---

## Decisoes Estrategicas Ja Validadas

Tres decisoes tecnologicas foram avaliadas e aprovadas por todos os especialistas:

| Decisao | Por Que | Impacto |
|---------|---------|---------|
| **Migrar para Supabase** (banco de dados) | O projeto nao usa banco de dados real hoje. Supabase oferece banco relacional (ideal para igrejas → episodios → conteudo), seguranca nativa por linhas, e custo gratuito ate 50.000 usuarios | Resolve 12 dos 51 problemas automaticamente |
| **Adotar shadcn/ui** (interface) | Componentes profissionais com acessibilidade nativa. Elimina ~8h de trabalho manual em acessibilidade | Interface profissional sem reinventar a roda |
| **Vitest para testes** | Rapido, moderno, compativel com o ecossistema. Permite testar a integracao com IA de forma confiavel | Fundacao de qualidade para o futuro |

---

## Proximos Passos

### Acoes Imediatas (Esta Semana)

- [ ] **Aprovar investimento minimo:** Fases 0-2 (R$ 16.200) para MVP funcional em 4 semanas
- [ ] **Decisao recomendada:** Fases 0-3 (R$ 24.600) para eliminar riscos de seguranca e ter diferencial competitivo
- [ ] **Validar spike de Supabase** (2h) — confirmar que a migracao de login funciona antes de comprometer o caminho completo

### Apos Aprovacao

- [ ] Iniciar Fase 0 (fundacao tecnica) — 1 semana
- [ ] Migracao de autenticacao e melhorias rapidas de interface — 1 semana
- [ ] Implementar persistencia de dados — 2 semanas
- [ ] Primeira versao testavel com igrejas-piloto — semana 5

### Governanca Sugerida

- **Checkpoints quinzenais** — demonstracao do progresso a cada 2 semanas
- **Metricas de acompanhamento:** nota de UX (meta: 7+/10), cobertura de testes (meta: 60%+ no MVP), tempo de carregamento (meta: <3s)
- **Criterio de sucesso do MVP:** pastor consegue gerar conteudo, fechar a pagina, voltar e encontrar tudo salvo

---

## Distribuicao do Investimento por Area

| Area | Investimento | % do Total | Descricao |
|------|-------------|-----------|-----------|
| Banco de Dados / Backend | R$ 13.350 | 31.8% | Onde os dados moram e como sao protegidos |
| Interface / Experiencia | R$ 12.375 | 29.5% | O que o usuario ve e como interage |
| Sistema / Arquitetura | R$ 11.550 | 27.5% | A "fundacao" tecnica do produto |
| Qualidade / Testes | R$ 4.800 | 11.4% | Garantia de que tudo funciona |
| **TOTAL** | **R$ 42.000** | **100%** | |

---

*Relatorio preparado com base na avaliacao tecnica validada por 4 especialistas (Arquitetura, Banco de Dados, UX/Acessibilidade, Qualidade) com nota de aprovacao 4.4/5.0.*

*Churchify — Brownfield Discovery Phase 9 — COMPLETE*
