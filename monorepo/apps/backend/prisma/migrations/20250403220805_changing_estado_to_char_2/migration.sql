/*
  Warnings:

  - You are about to alter the column `estado` on the `enderecos` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(2)`.

*/
-- AlterTable
ALTER TABLE "enderecos" ALTER COLUMN "estado" SET DATA TYPE CHAR(2);
