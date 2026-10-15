// SessionStart (global, orice proiect)
// Utilizatorul a semnalat 2026-09-12: CONTEXT.md e o convenție, nu o garanție -- depinde 100% ca
// Claude sa-si aminteasca sa-l deschida. Acest hook nu rezolva asta cu memorie (uitabila), ci
// mecanic: la pornirea sesiunii, daca proiectul curent are un CONTEXT.md, il semnaleaza.
// Nu ii toarna continutul (ar anula exact rostul CONTEXT.md -- tinut AFARA contextului implicit).
const fs = require("fs");
const path = require("path");

try {
  const candidate = path.join(process.cwd(), "CONTEXT.md");
  const stat = fs.statSync(candidate);
  const kb = Math.round((stat.size / 1024) * 10) / 10;
  process.stdout.write(
    "<context-md-reminder>\n" +
    `This project has a CONTEXT.md (${kb} KB) at ${candidate}.\n` +
    "It is not loaded automatically. Read it once if the task touches domain/business/architecture " +
    "-- not needed for an isolated one-line fix.\n" +
    "</context-md-reminder>\n"
  );
} catch {
  // fara CONTEXT.md in acest proiect, sau eroare de citire -- nu blocam, nu semnalam nimic
}
process.exit(0);
