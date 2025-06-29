/*
  Warnings:

  - A unique constraint covering the columns `[idUsuario,idProduto]` on the table `carrinho` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "carrinho_idUsuario_idProduto_key" ON "carrinho"("idUsuario", "idProduto");
