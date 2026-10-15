# Format memorie de incident (bucla de învățare)

Când userul corectează ceva făcut NESOLICITAT, o buclă de încercare-eroare sau un „gata" neverificat,
salvez UN fișier per incident în memoria proiectului (`projects/<proiect>/memory/incident-<slug>.md`)
și un rând în `MEMORY.md` care începe cu `INCIDENT` (indexul se încarcă la fiecare sesiune).

```markdown
---
name: incident-<slug>
description: "INCIDENT <tip> — <ce am făcut, 1 rând>"
metadata:
  type: feedback
  incident: unsolicited-addition | trial-error-loop | unverified-done
  date: YYYY-MM-DD
---
Cerut: <cererea reală, 1 rând>
Am făcut în plus: <ce anume, fișier:linie>
De ce era greșit: <efectul concret: cine a pățit ce>
Semnalul ratat: <ce trebuia să mă oprească înainte să scriu>
Regula: [[scope-rule]] (CLAUDE.md global „Scope — rule #1")
```

Rând în `MEMORY.md`:
`- [INCIDENT <slug>](incident-<slug>.md) — <tip>: <ce, 1 rând>`
