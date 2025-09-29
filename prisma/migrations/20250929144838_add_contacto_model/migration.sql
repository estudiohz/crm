-- CreateTable
CREATE TABLE "public"."Contacto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "empresa" TEXT,
    "estado" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contacto_pkey" PRIMARY KEY ("id")
);
