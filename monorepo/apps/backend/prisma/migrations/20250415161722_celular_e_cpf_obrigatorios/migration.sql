/*
  Warnings:

  - Made the column `celular` on table `usuarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cpf` on table `usuarios` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "celular" SET NOT NULL,
ALTER COLUMN "cpf" SET NOT NULL;
