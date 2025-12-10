# Imagen base
FROM node:20

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar todo el proyecto
COPY server ./server
COPY src ./src
COPY public ./public
COPY credentials ./credentials

# Exponer el puerto que usará la app
ENV PORT=8080
EXPOSE 8080

# Comando para ejecutar el servidor
CMD ["node", "server/server.js"]
