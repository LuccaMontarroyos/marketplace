/*
  Warnings:

  - Made the column `ordem` on table `imagens_produto` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."imagens_produto" ALTER COLUMN "ordem" SET NOT NULL;
