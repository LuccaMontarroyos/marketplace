/*
  Warnings:

  - You are about to drop the `_PedidoToProduto` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[idUsuario,idProduto,sessionId]` on the table `Carrinho` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionId]` on the table `pedidos` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_PedidoToProduto" DROP CONSTRAINT "_PedidoToProduto_A_fkey";

-- DropForeignKey
ALTER TABLE "_PedidoToProduto" DROP CONSTRAINT "_PedidoToProduto_B_fkey";

-- DropIndex
DROP INDEX "Carrinho_idUsuario_idProduto_key";

-- DropIndex
DROP INDEX "Carrinho_sessionId_idProduto_key";

-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN     "idUsuario" INTEGER;

-- DropTable
DROP TABLE "_PedidoToProduto";

-- CreateIndex
CREATE UNIQUE INDEX "Carrinho_idUsuario_idProduto_sessionId_key" ON "Carrinho"("idUsuario", "idProduto", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_sessionId_pedido" ON "pedidos"("sessionId");

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
