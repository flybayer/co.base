-- CreateTable
CREATE TABLE "DeviceToken" (
"id" SERIAL,
    "token" TEXT NOT NULL,
    "requestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approveTime" TIMESTAMP(3),
    "userId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken.token_unique" ON "DeviceToken"("token");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
