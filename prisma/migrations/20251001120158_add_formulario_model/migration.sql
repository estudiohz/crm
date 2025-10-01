-- CreateTable
CREATE TABLE "public"."Formulario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formulario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Formulario" ADD CONSTRAINT "Formulario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
