-- AlterTable
ALTER TABLE "public"."Contacto" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Contacto" ADD CONSTRAINT "Contacto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
