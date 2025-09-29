-- AlterTable
ALTER TABLE "public"."Cliente" ADD COLUMN     "partnerRecordId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Cliente" ADD CONSTRAINT "Cliente_partnerRecordId_fkey" FOREIGN KEY ("partnerRecordId") REFERENCES "public"."Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
