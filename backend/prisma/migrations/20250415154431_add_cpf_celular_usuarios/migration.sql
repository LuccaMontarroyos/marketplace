-- AlterEnum
ALTER TYPE "TipoProduto" ADD VALUE 'CALÇADOS';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "celular" TEXT,
ADD COLUMN     "cpf" TEXT;
