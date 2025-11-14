-- DropForeignKey
ALTER TABLE "public"."enderecos" DROP CONSTRAINT "enderecos_idUsuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."pedidos" DROP CONSTRAINT "pedidos_idEnderecoEntrega_fkey";

-- AlterTable
ALTER TABLE "public"."enderecos" ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "idUsuario" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."pedidos" ALTER COLUMN "idEnderecoEntrega" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."pedidos" ADD CONSTRAINT "pedidos_idEnderecoEntrega_fkey" FOREIGN KEY ("idEnderecoEntrega") REFERENCES "public"."enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enderecos" ADD CONSTRAINT "enderecos_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
