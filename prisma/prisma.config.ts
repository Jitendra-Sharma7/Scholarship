import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",

    migrations: {
        path: "prisma/migrations",
        seed: "npx tsx prisma/seed.ts",
    },

    datasource: {
        url: env("postgresql://postgres.kolfyuyyvwydklxjqnli:lrHY9wSBpdqGOvIo@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"),
    },
});