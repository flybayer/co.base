-- CreateTable
CREATE TABLE "User" (
"id" SERIAL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT,
    "passwordHash" TEXT,
    "stripeCustomerId" TEXT,
    "giftedAccess" INTEGER NOT NULL DEFAULT 0,
    "subscribedAccess" INTEGER NOT NULL DEFAULT 0,
    "subscriptionEndTime" TIMESTAMP(3),
    "publicBio" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailValidation" (
"id" SERIAL,
    "emailTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "userId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedEmail" (
    "email" TEXT NOT NULL,
    "verifyTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "PhoneValidation" (
"id" SERIAL,
    "sendTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT NOT NULL,
    "secret" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
"id" SERIAL,
    "publishTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "page" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
"id" SERIAL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteNode" (
"id" SERIAL,
    "key" TEXT NOT NULL,
    "siteId" INTEGER NOT NULL,
    "parentNodeId" INTEGER,
    "schema" JSONB,
    "value" JSONB,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteToken" (
"id" SERIAL,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "token" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeRole" (
"id" SERIAL,
    "siteNodeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteRole" (
"id" SERIAL,
    "siteId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteRoleInvitation" (
"id" SERIAL,
    "inviteTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" INTEGER NOT NULL,
    "recipientUserId" INTEGER,
    "fromUserId" INTEGER NOT NULL,
    "acceptedTime" TIMESTAMP(3),
    "dismissTime" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "toEmail" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clip" (
"id" SERIAL,
    "draftTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishTime" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "caption" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClipTag" (
    "clipId" INTEGER NOT NULL,
    "tagId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User.username_unique" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User.phone_unique" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "EmailValidation.secret_unique" ON "EmailValidation"("secret");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneValidation.secret_unique" ON "PhoneValidation"("secret");

-- CreateIndex
CREATE UNIQUE INDEX "Site.name_unique" ON "Site"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SiteNodeId" ON "SiteNode"("siteId", "key", "parentNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteToken.token_unique" ON "SiteToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SiteRoleInviteUnique" ON "SiteRoleInvitation"("siteId", "recipientUserId", "toEmail");

-- CreateIndex
CREATE UNIQUE INDEX "ClipTag_id" ON "ClipTag"("clipId", "tagId");

-- AddForeignKey
ALTER TABLE "EmailValidation" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedEmail" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD FOREIGN KEY("ownerId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteNode" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteNode" ADD FOREIGN KEY("parentNodeId")REFERENCES "SiteNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteToken" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeRole" ADD FOREIGN KEY("siteNodeId")REFERENCES "SiteNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeRole" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRole" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRole" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRoleInvitation" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRoleInvitation" ADD FOREIGN KEY("recipientUserId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRoleInvitation" ADD FOREIGN KEY("fromUserId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipTag" ADD FOREIGN KEY("clipId")REFERENCES "Clip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipTag" ADD FOREIGN KEY("tagId")REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
