-- CreateTable
CREATE TABLE "SiteEvent" (
"id" SERIAL,
    "requestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completeTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventName" TEXT NOT NULL,
    "siteId" INTEGER NOT NULL,
    "address" TEXT[],
    "payload" JSONB,
    "userId" INTEGER,
    "siteNodeId" INTEGER,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiteEvent" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteEvent" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteEvent" ADD FOREIGN KEY("siteNodeId")REFERENCES "SiteNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
