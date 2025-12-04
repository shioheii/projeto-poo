/*
  Warnings:

  - You are about to drop the column `dataFim` on the `consultas` table. All the data in the column will be lost.
  - You are about to drop the column `dataHora` on the `consultas` table. All the data in the column will be lost.
  - Added the required column `horarioId` to the `consultas` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_consultas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "consultas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consultas_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consultas_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios_disponiveis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_consultas" ("createdAt", "id", "medicoId", "observacoes", "pacienteId", "status", "updatedAt") SELECT "createdAt", "id", "medicoId", "observacoes", "pacienteId", "status", "updatedAt" FROM "consultas";
DROP TABLE "consultas";
ALTER TABLE "new_consultas" RENAME TO "consultas";
CREATE UNIQUE INDEX "consultas_horarioId_key" ON "consultas"("horarioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
