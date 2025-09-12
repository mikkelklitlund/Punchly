/*
  Warnings:

  - You are about to drop the column `absenceType` on the `AbsenceRecord` table. All the data in the column will be lost.
  - Added the required column `absenceTypeId` to the `AbsenceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AbsenceRecord" DROP COLUMN "absenceType",
ADD COLUMN     "absenceTypeId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "AbsenceType";

-- CreateTable
CREATE TABLE "AbsenceType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "AbsenceType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbsenceType_companyId_idx" ON "AbsenceType"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "AbsenceType_name_companyId_key" ON "AbsenceType"("name", "companyId");

-- CreateIndex
CREATE INDEX "AbsenceRecord_absenceTypeId_idx" ON "AbsenceRecord"("absenceTypeId");

-- CreateIndex
CREATE INDEX "AbsenceRecord_employeeId_startDate_idx" ON "AbsenceRecord"("employeeId", "startDate");

-- CreateIndex
CREATE INDEX "AbsenceRecord_employeeId_endDate_idx" ON "AbsenceRecord"("employeeId", "endDate");

-- AddForeignKey
ALTER TABLE "AbsenceRecord" ADD CONSTRAINT "AbsenceRecord_absenceTypeId_fkey" FOREIGN KEY ("absenceTypeId") REFERENCES "AbsenceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceType" ADD CONSTRAINT "AbsenceType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
