## Getting Started

First, set env variables:

```bash
MEDIA_ROOT
# /media or c:\users\user\media
MEDIA_ROOT=/home/mjr/media

MEDIA_ASSETS_ROOT
# /.insta-assets or c:\users\user\.insta-assets

DATABASE_URL
# postgresql://user:password@localhost:5432/db

JWT_SECRET
# openssl rand -hex 32
```


Second, run the server:

```bash
npm run dev
# run dev server

npm run build
# run a build

npm run start
# start a build

npm run dev:all
# run dev server and workers

npm run start:all
# run server and workers

```