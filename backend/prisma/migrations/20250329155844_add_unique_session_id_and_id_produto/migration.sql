/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,idProduto]` on the table `Carrinho` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Carrinho_sessionId_idProduto_key" ON "Carrinho"("sessionId", "idProduto");
