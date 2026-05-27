module.exports = {
    apps: [
        {
            name: "nextjs",
            cwd: "/home/app/apps/insta-gen",

            script: "npm",
            args: "start",

            env: {
                NODE_ENV: "production",
                PORT: 4000
            },

            instances: 1,
            exec_mode: "fork",

            autorestart: true,
            watch: false,

            max_memory_restart: "1G",

            error_file: "/home/app/.pm2/logs/nextjs-error.log",
            out_file: "/home/app/.pm2/logs/nextjs-out.log",
            log_file: "/home/app/.pm2/logs/nextjs-combined.log",

            time: true
        },

        {
            name: "watcher",
            cwd: "/home/app/apps/insta-gen",

            script: "npm",
            args: "run watcher",

            env: {
                NODE_ENV: "production"
            },

            instances: 1,
            exec_mode: "fork",

            autorestart: true,
            watch: false,

            max_memory_restart: "512M",

            error_file: "/home/app/.pm2/logs/watcher-error.log",
            out_file: "/home/app/.pm2/logs/watcher-out.log",
            log_file: "/home/app/.pm2/logs/watcher-combined.log",

            time: true
        }
    ]
}