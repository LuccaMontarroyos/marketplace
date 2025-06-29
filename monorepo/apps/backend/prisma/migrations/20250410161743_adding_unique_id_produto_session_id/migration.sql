/*
  Warnings:

  - A unique constraint covering the columns `[idUsuario,idProduto]` on the table `Carrinho` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionId,idProduto]` on the table `Carrinho` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Carrinho_idUsuario_idProduto_sessionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Carrinho_idUsuario_idProduto_key" ON "Carrinho"("idUsuario", "idProduto");

-- CreateIndex
CREATE UNIQUE INDEX "Carrinho_sessionId_idProduto_key" ON "Carrinho"("sessionId", "idProduto");
