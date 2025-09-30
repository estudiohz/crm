# 1. Fase de Construcción (Build Stage)
# Usamos una imagen Node.js más pequeña y segura
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos package.json y yarn.lock/package-lock.json para instalar dependencias
COPY package.json package-lock.json ./

# Instalamos dependencias de producción y desarrollo
# Esto también ejecuta el 'postinstall' que debería incluir 'prisma generate'
RUN npm install

# Copiamos el resto del código
COPY . .

# Ejecutamos el build de Next.js (esto crea la carpeta .next)
# Se incluye la migración de prisma aquí, si no se hizo en el pre-build de EasyPanel
# Si estás seguro de que el pre-build lo hace, puedes omitir esta línea, pero es más seguro:
RUN npx prisma generate && npm run build


# 2. Fase de Producción (Production Stage)
# Imagen base mínima para correr la aplicación
FROM node:20-alpine AS runner

WORKDIR /app

# Establece el puerto que la aplicación escuchará
ENV PORT 3000

# Next.js requiere la DATABASE_URL en runtime.
# EasyPanel se la inyectará automáticamente.

# Copiamos solo lo necesario desde la fase de construcción
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# La migración de Prisma DEBE ejecutarse en el entorno de producción
# durante el arranque o en el paso pre-build de EasyPanel.
# Mantenemos el comando "npx prisma migrate deploy" en la configuración de EasyPanel
# como lo habíamos discutido, pero esto es lo que correrá la app:

EXPOSE 3000
CMD ["npm", "start"]
