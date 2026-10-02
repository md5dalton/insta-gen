## Getting Started

First, set env variables:

```bash
MEDIA_ROOT
# /media or c:\users\user\media
# add ending slash
MEDIA_ROOT=/home/usr/media/

MEDIA_ASSETS_ROOT
# /.insta-assets or c:\users\user\.insta-assets
# add ending slash
MEDIA_ASSETS_ROOT=/home/usr/Media/.insta/

DATABASE_URL
# postgresql://user:password@localhost:5432/db
DATABASE_URL=postgresql://usr:f7wU+sAn3kSTF@localhost:5432/insta_dev

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