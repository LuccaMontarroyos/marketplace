/*
  Warnings:

  - Added the required column `tipo` to the `produtos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('ELETRONICOS', 'ROUPA', 'LIVRO', 'MOVEIS', 'AUTOMOVEIS', 'OUTROS');

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "tipo" "TipoProduto" NOT NULL;
