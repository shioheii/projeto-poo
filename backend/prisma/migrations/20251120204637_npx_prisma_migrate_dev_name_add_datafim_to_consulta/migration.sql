/*
  Warnings:

  - You are about to drop the column `diaSemana` on the `horarios_disponiveis` table. All the data in the column will be lost.
  - Added the required column `dataFim` to the `consultas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `horarios_disponiveis` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_consultas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "dataHora" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "consultas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consultas_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_consultas" ("createdAt", "dataHora", "id", "medicoId", "observacoes", "pacienteId", "status", "updatedAt") SELECT "createdAt", "dataHora", "id", "medicoId", "observacoes", "pacienteId", "status", "updatedAt" FROM "consultas";
DROP TABLE "consultas";
ALTER TABLE "new_consultas" RENAME TO "consultas";
CREATE TABLE "new_horarios_disponiveis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicoId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "horarios_disponiveis_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_horarios_disponiveis" ("ativo", "createdAt", "horaFim", "horaInicio", "id", "medicoId", "updatedAt") SELECT "ativo", "createdAt", "horaFim", "horaInicio", "id", "medicoId", "updatedAt" FROM "horarios_disponiveis";
DROP TABLE "horarios_disponiveis";
ALTER TABLE "new_horarios_disponiveis" RENAME TO "horarios_disponiveis";
CREATE UNIQUE INDEX "horarios_disponiveis_medicoId_data_horaInicio_key" ON "horarios_disponiveis"("medicoId", "data", "horaInicio");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
