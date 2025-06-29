/*
  Warnings:

  - Added the required column `precoAtual` to the `carrinho` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "carrinho" DROP CONSTRAINT "carrinho_idUsuario_fkey";

-- AlterTable
ALTER TABLE "carrinho" ADD COLUMN     "precoAtual" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "idUsuario" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "carrinho" ADD CONSTRAINT "carrinho_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
