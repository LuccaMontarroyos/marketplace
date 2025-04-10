/*
  Warnings:

  - You are about to drop the `carrinho` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `idEnderecoEntrega` to the `pedidos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "carrinho" DROP CONSTRAINT "carrinho_idProduto_fkey";

-- DropForeignKey
ALTER TABLE "carrinho" DROP CONSTRAINT "carrinho_idUsuario_fkey";

-- AlterTable
ALTER TABLE "enderecos" ADD COLUMN     "complemento" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "idEnderecoEntrega" INTEGER NOT NULL;

-- DropTable
DROP TABLE "carrinho";

-- CreateTable
CREATE TABLE "Carrinho" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT,
    "idUsuario" INTEGER,
    "idProduto" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoAtual" DECIMAL(65,30) NOT NULL,
    "dataExpiracao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_precos" (
    "id" SERIAL NOT NULL,
    "idProduto" INTEGER NOT NULL,
    "preco" DECIMAL(65,30) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_precos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrinho_idUsuario_idProduto_key" ON "Carrinho"("idUsuario", "idProduto");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_idEnderecoEntrega_fkey" FOREIGN KEY ("idEnderecoEntrega") REFERENCES "enderecos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrinho" ADD CONSTRAINT "Carrinho_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrinho" ADD CONSTRAINT "Carrinho_idProduto_fkey" FOREIGN KEY ("idProduto") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_precos" ADD CONSTRAINT "historico_precos_idProduto_fkey" FOREIGN KEY ("idProduto") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
