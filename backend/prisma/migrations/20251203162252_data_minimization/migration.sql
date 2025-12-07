/*
  Warnings:

  - You are about to drop the column `address` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `hourlySalary` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyHours` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `monthlySalary` on the `Employee` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[Company] DROP CONSTRAINT [Company_name_address_key];

-- AlterTable
ALTER TABLE [dbo].[Company] DROP COLUMN [address];

-- AlterTable
ALTER TABLE [dbo].[Employee] DROP COLUMN [address],
[city],
[hourlySalary],
[monthlyHours],
[monthlySalary];

-- CreateIndex
ALTER TABLE [dbo].[Company] ADD CONSTRAINT [Company_name_key] UNIQUE NONCLUSTERED ([name]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
