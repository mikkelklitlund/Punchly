-- CreateTable
CREATE TABLE "public"."ManagerInvite" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiryDate" TIMESTAMPTZ(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ManagerInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManagerInvite_token_key" ON "public"."ManagerInvite"("token");

-- CreateIndex
CREATE INDEX "ManagerInvite_companyId_idx" ON "public"."ManagerInvite"("companyId");

-- AddForeignKey
ALTER TABLE "public"."ManagerInvite" ADD CONSTRAINT "ManagerInvite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
