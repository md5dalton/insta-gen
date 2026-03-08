import { startMediaProcessor, stopMediaProcessor } from "./workers/media.worker"
import { registerShutdown } from "./lib/shutdown"

import { createServer } from 'http'
import next from 'next'
 
const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
 
// app.prepare().then(() => {
//   createServer((req, res) => {
//     handle(req, res)
//   }).listen(port)
 
//   console.log(
//     `> Server listening at http://localhost:${port} as ${
//       dev ? 'development' : process.env.NODE_ENV
//     }`
//   )
// })

async function main() {
    await app.prepare()

    // ✅ START BACKGROUND WORKER HERE
    await startMediaProcessor()

    const server = createServer((req, res) => handle(req, res))

    server.listen(3000, () => {
        console.log("🚀 Server ready on http://localhost:3000")
    })

    // ✅ GRACEFUL SHUTDOWN
    registerShutdown(async () => {
        server.close()
        await stopMediaProcessor()
    })
}

main()