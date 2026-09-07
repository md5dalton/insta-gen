import { extname } from "node:path"

import chokidar, { FSWatcher } from "chokidar"
import logUpdate from "log-update"

import prisma from "@/lib/prisma"

import {
    JobEvent,
    PrismaClient,
} from "@/prisma/generated/client"

export default class Watcher {

    private root: string

    private watcher: FSWatcher | null = null

    private exts: Set<string>

    private prisma: PrismaClient

    private stats = {
        files: {
            add: 0,
            delete: 0,
        },

        jobs: {
            add: {
                total: 0,
                success: 0,
                failed: 0,
            },

            delete: {
                total: 0,
                success: 0,
                failed: 0,
            },
        },
    }

    private status = "Starting..."

    constructor(
        mediaRoot: string,
        extensions: string[],
    ) {

        this.root = mediaRoot

        this.prisma = prisma

        this.exts = new Set(
            extensions.map((ext) =>
                ext.startsWith(".")
                    ? ext.toLowerCase()
                    : `.${ext.toLowerCase()}`
            )
        )
    }

    // ─────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────

    async initialize(
        ignoreInitial: boolean = false,
    ): Promise<void> {

        console.log("🔄 Initializing media watcher...")
        console.log(`📁 Root: ${this.root}`)
        console.log(
            `🎞️  Extensions: ${[...this.exts].join(", ")}`
        )

        this.status = "Starting..."

        this.render()

        this.watcher = chokidar.watch(this.root, {

            // Ignore hidden files/directories
            ignored: /(^|[\/\\])\../,

            persistent: true,

            // We want the initial scan
            ignoreInitial,

            depth: 10,
        })

        this.watcher

            .on("add", (filePath) => {
                void this.handleAdd(filePath)
            })

            .on("unlink", (filePath) => {
                void this.handleDelete(filePath)
            })

            .on("ready", () => {

                this.status = "Watching"

                this.render()
            })

            .on("error", (error) => {

                this.status = "Error"

                logUpdate.persist(
                    `❌ Watcher error: ${this.formatError(error)}`
                )

                this.render()
            })
    }

    // ─────────────────────────────────────────────
    // File ADD event
    // ─────────────────────────────────────────────

    private async handleAdd(
        filePath: string,
    ): Promise<void> {

        const ext = extname(filePath).toLowerCase()

        if (!this.exts.has(ext)) {
            return
        }

        this.stats.files.add++

        this.render()

        await this.enqueueMediaJob(
            filePath,
            "ADD",
        )
    }

    // ─────────────────────────────────────────────
    // File DELETE event
    // ─────────────────────────────────────────────

    private async handleDelete(
        filePath: string,
    ): Promise<void> {

        const ext = extname(filePath).toLowerCase()

        if (!this.exts.has(ext)) {
            return
        }

        this.stats.files.delete++

        this.render()

        await this.enqueueMediaJob(
            filePath,
            "DELETE",
        )
    }

    // ─────────────────────────────────────────────
    // Create media job
    // ─────────────────────────────────────────────

    private async enqueueMediaJob(
        filePath: string,
        event: JobEvent,
    ): Promise<void> {

        const dedupeKey = `${event}:${filePath}`

        const jobStats =
            event === "ADD"
                ? this.stats.jobs.add
                : this.stats.jobs.delete

        // A job was attempted
        jobStats.total++

        this.render()

        try {

            await this.prisma.job.create({

                data: {

                    payload: {
                        path: filePath,
                    },

                    type: "MEDIA",

                    event,

                    dedupeKey,
                },
            })

            // Job successfully created
            jobStats.success++

        } catch (error) {

            if (this.isDuplicateError(error)) {

                /**
                 * Duplicate jobs are not failures.
                 *
                 * The job already exists, so there is
                 * nothing else to enqueue.
                 */

                jobStats.total--
                jobStats.success++

            } else {

                jobStats.failed++

                logUpdate.persist(
                    `❌ Failed to create ${event} job\n` +
                    `   ${filePath}\n` +
                    `   ${this.formatError(error)}`
                )
            }
        }

        this.render()
    }

    // ─────────────────────────────────────────────
    // Prisma duplicate error
    // ─────────────────────────────────────────────

    private isDuplicateError(
        error: unknown,
    ): boolean {

        if (
            typeof error !== "object" ||
            error === null
        ) {
            return false
        }

        return (
            "code" in error &&
            error.code === "P2002"
        )
    }

    // ─────────────────────────────────────────────
    // Render terminal dashboard
    // ─────────────────────────────────────────────

    private render(): void {

        const add = this.stats.jobs.add
        const del = this.stats.jobs.delete

        const lines = [

            "╭──────────────────────────────────────────────────────────────╮",

            "│                       MEDIA WATCHER                         │",

            "╰──────────────────────────────────────────────────────────────╯",

            "",

            "Files:",

            `  ADD:    ${this.formatNumber(
                this.stats.files.add
            )}`,

            `  DEL: ${this.formatNumber(
                this.stats.files.delete
            )}`,

            "",

            "Jobs:                 TOTAL       SUCCESS       FAILED",

            `  ADD:                ${this.pad(add.total, 10)}${this.pad(
                add.success,
                14
            )}${this.pad(
                add.failed,
                13
            )}`,

            `  DELETE:             ${this.pad(del.total, 10)}${this.pad(
                del.success,
                14
            )}${this.pad(
                del.failed,
                13
            )}`,

            "",

            `Status: ${this.status}`,
        ]

        logUpdate(lines.join("\n"))
    }

    // ─────────────────────────────────────────────
    // Terminal number formatting
    // ─────────────────────────────────────────────

    private pad(
        value: number,
        width: number,
    ): string {

        return this.formatNumber(value).padStart(width)
    }

    private formatNumber(
        value: number,
    ): string {

        return value.toLocaleString("en-US")
    }

    // ─────────────────────────────────────────────
    // Error formatting
    // ─────────────────────────────────────────────

    private formatError(
        error: unknown,
    ): string {

        if (error instanceof Error) {
            return error.message
        }

        return String(error)
    }

    // ─────────────────────────────────────────────
    // Dispose
    // ─────────────────────────────────────────────

    async dispose(): Promise<void> {

        this.status = "Stopping..."

        this.render()

        if (this.watcher) {

            await this.watcher.close()

            this.watcher = null
        }

        this.status = "Stopped"

        this.render()

        /**
         * Do not disconnect the shared Prisma singleton.
         */
    }
}