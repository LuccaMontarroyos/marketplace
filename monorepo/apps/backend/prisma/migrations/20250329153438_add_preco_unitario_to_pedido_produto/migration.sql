/*
  Warnings:

  - Added the required column `precoUnitario` to the `pedido_produtos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pedido_produtos" ADD COLUMN     "precoUnitario" DECIMAL(65,30) NOT NULL;
