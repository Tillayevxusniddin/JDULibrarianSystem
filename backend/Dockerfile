# 1-Bosqich: Dasturni qurish (Build)
FROM node:18-alpine AS builder

WORKDIR /app

# Faqat kerakli fayllarni ko'chiramiz
COPY package*.json ./
COPY prisma ./prisma/

# Paketlarni o'rnatamiz
RUN npm install

# Prisma klientini generatsiya qilamiz
RUN npx prisma generate

# Barcha kodlarni ko'chiramiz
COPY . .

# TypeScript kodni JavaScript'ga kompilyatsiya qilamiz
RUN npm run build


# 2-Bosqich: Ishchi (Production) Image'ni Yaratish
FROM node:18-alpine

WORKDIR /app

# Kerakli paketlarni `builder`dan ko'chiramiz
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Qurilgan `dist` papkasini ko'chiramiz
COPY --from=builder /app/dist ./dist
# Prisma sxemasini ko'chiramiz (migration uchun kerak)
COPY --from=builder /app/prisma ./prisma

# Dasturni ishga tushirish buyrug'i
CMD ["node", "dist/server.js"]