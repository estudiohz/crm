-- AlterTable
ALTER TABLE "Cuenta" ADD COLUMN     "apellidos" TEXT,
ADD COLUMN     "nombre" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_email_key" ON "Cuenta"("email");