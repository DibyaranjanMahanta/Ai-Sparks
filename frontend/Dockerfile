FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Accept build args — Expo EXPO_PUBLIC_* vars must be set at BUILD time
ARG EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
ARG EXPO_PUBLIC_GOOGLE_CLIENT_ID

ENV EXPO_PUBLIC_BACKEND_URL=$EXPO_PUBLIC_BACKEND_URL
ENV EXPO_PUBLIC_GOOGLE_CLIENT_ID=$EXPO_PUBLIC_GOOGLE_CLIENT_ID

EXPOSE 8081

# Use --host lan instead of 0.0.0.0
CMD ["npx", "expo", "start", "--web", "--port", "8081", "--host", "lan"]