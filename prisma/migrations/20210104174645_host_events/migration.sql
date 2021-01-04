-- CreateTable
CREATE TABLE "HostEvent" (
"id" SERIAL,
    "saveTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "host" TEXT NOT NULL,
    "events" JSONB NOT NULL,

    PRIMARY KEY ("id")
);
