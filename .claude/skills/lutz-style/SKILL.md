---
name: lutz-style
description: >
  Write code, comments, commit messages, and technical docs the way Lutz writes
  them: opinionated, decision-first prose in Brazilian Portuguese, code that puts
  business rules in entities and hides dependencies behind interfaces. Use when
  the user says "my style", "write like me", "lutz-style", asks for a project
  README or blog-style writeup, or when working in a repo that belongs to Lutz.
---

# Lutz Style

Lutz writes technical prose in **Brazilian Portuguese**, first person, opinionated. He explains decisions, not features. He admits what is missing. Match that.

## Prose voice

- Open with one paragraph: what the thing is and why he built it. Bold the key tech. Example: "Peguei para treinar **Java + Spring Boot** com foco em organizar o código de um jeito que eu defenderia numa code review."
- State the decision, then the reason. "Escolhi **fanout** porque o `processor` não precisa saber quem está ouvindo."
- Defend choices as if in a code review. Name the tradeoff out loud.
- Be honest about gaps and ugly spots. End writeups with what's missing: "Faltou **idempotência**..." Flag warts inline: "Ficou um `\"\"` ali."
- Mark opinions as opinions when unsure: "_As definições sobre os princípios SOLID são apenas rascunhos sobre meu entendimento delas._"
- Demonstrate concretely instead of asserting: "Mando um `10`, vejo a mensagem cair na DLQ."
- Ask a short question, answer it: "Sensor sem alerta configurado? A leitura é ignorada."
- Land a section with a short declarative after the explanation: "A entidade não deixa."

## Prose mechanics

- Section headers are short and describe the idea, not the topic: "A regra de negócio mora na entidade", "Publicar e esquecer", "O service orquestra, não decide tudo".
- **Bold** for key technical terms and patterns: **BigDecimal**, **Strategy/Adapter**, **dead letter queue**, **TSID**.
- `Inline code` for class, method, file, and value names: `User`, `TransactionService`, `Counter.php`.
- Code block first, then the decision behind it. Never a wall of code with no reasoning.
- Apply the `stop-slop` skill to every paragraph: active voice, no adverbs, no em-dashes, no "not X but Y" contrasts, varied rhythm.

## Code conventions

- Business rules live in the entity, not scattered in the service. The entity protects its own state: `subtractBalance` throws before it goes negative.
- The service orchestrates and validates what is its own, then delegates. It does not decide everything.
- Hide external dependencies behind an interface (DIP). Ship a real impl and a fake one (`MockyGateway` / `FakeGateway`) so dev needs no network.
- Money is `BigDecimal`, never `double`. Compare with `compareTo`.
- Reach for design patterns by name and say which one: Strategy, Chain of Responsibility, Adapter.
- Minimize branching. One business `if`. Prefer `ifPresentOrElse` over nested `if`.
- IDs ordenáveis por tempo (TSID) over random UUID when ordering or paging matters.
- Layer the project clean-architecture style: `domain` (entidades, regras), `application` (services, DTOs, gateways), `presentation` (controllers).

## Code comments

Comments name the concept, not the mechanics. They tag the pattern or the intent:

```java
if (validateTransaction()) { // bate no autorizador externo
```

```php
public function __construct(Rule $ruleChain) // Inversão de Dependência (DIP)
```

Not "loop over the list" or "increment counter". Explain why this exists or which principle it serves.

## Commits

Follow the repo's existing convention (Conventional Commits in his projects: `feat:`, `fix:`, `docs:`). Subject in imperative, lowercase, short. Body only when the why isn't obvious.

---

Source style: `public/projects/details/*.md` writeups (Solid FizzBuzz, desafio-picpay, alga-sensors). Refine by adding examples as new patterns show up.
