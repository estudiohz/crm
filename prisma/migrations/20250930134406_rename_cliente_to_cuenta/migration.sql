/*
  Warnings:

  - You are about to drop the column `clienteId` on the `Factura` table. All the data in the column will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Cliente" DROP CONSTRAINT "Cliente_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cliente" DROP CONSTRAINT "Cliente_partnerRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Factura" DROP CONSTRAINT "Factura_clienteId_fkey";

-- AlterTable
ALTER TABLE "public"."Contacto" ADD COLUMN     "empresaId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Factura" DROP COLUMN "clienteId",
ADD COLUMN     "contactoId" INTEGER;

-- DropTable
DROP TABLE "public"."Cliente";

-- CreateTable
CREATE TABLE "public"."Cuenta" (
    "id" SERIAL NOT NULL,
    "cuenta" TEXT NOT NULL,
    "empresa" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "imagen" TEXT,
    "estado" TEXT NOT NULL,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nif" TEXT,
    "modulo" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnerId" TEXT,
    "partnerRecordId" INTEGER,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Cuenta" ADD CONSTRAINT "Cuenta_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cuenta" ADD CONSTRAINT "Cuenta_partnerRecordId_fkey" FOREIGN KEY ("partnerRecordId") REFERENCES "public"."Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contacto" ADD CONSTRAINT "Contacto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Factura" ADD CONSTRAINT "Factura_contactoId_fkey" FOREIGN KEY ("contactoId") REFERENCES "public"."Contacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
