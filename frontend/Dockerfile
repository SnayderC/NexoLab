# Imagen del frontend para docker compose (perfil "app"). Ver README.md.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host para que el servidor de Vite se pueda abrir desde fuera del contenedor.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
