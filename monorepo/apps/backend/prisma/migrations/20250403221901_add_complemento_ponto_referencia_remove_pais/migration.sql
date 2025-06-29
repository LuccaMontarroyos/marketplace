/*
  Warnings:

  - You are about to drop the column `pais` on the `enderecos` table. All the data in the column will be lost.
  - Added the required column `bairro` to the `enderecos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `enderecos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "enderecos" DROP COLUMN "pais",
ADD COLUMN     "bairro" TEXT NOT NULL,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "numero" TEXT NOT NULL,
ADD COLUMN     "pontoReferencia" TEXT,
ALTER COLUMN "estado" SET DATA TYPE TEXT;
