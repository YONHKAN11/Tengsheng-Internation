FROM node:22-alpine

RUN apk add --no-cache python3

WORKDIR /app

COPY site ./site
COPY site-builder/server.mjs ./server.mjs

ENV CMS_URL=http://cms:3000
ENV PUBLIC_URL=http://localhost
ENV DIST_DIR=/srv/site
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.mjs"]
