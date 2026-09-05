type LogLevel = "debug" | "info" | "warn" | "error"

interface LogFields {
    [key: string]: unknown
}

class Logger {
    private write(level: LogLevel, message: string, fields: LogFields = {}): void {
        const payload = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...fields,
        }

        if (process.env.NODE_ENV === "test") {
            return
        }

        // console.log(JSON.stringify(payload))
        console.log(payload)
    }

    debug(message: string, fields?: LogFields): void {
        this.write("debug", message, fields)
    }

    info(message: string, fields?: LogFields): void {
        this.write("info", message, fields)
    }

    warn(message: string, fields?: LogFields): void {
        this.write("warn", message, fields)
    }

    error(message: string, fields?: LogFields): void {
        this.write("error", message, fields)
    }
}

export const logger = new Logger()
