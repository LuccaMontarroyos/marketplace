-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_idComprador_fkey";

-- AlterTable
ALTER TABLE "pedidos" ALTER COLUMN "idComprador" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_idComprador_fkey" FOREIGN KEY ("idComprador") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
