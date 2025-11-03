BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Company] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Company_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Company_name_address_key] UNIQUE NONCLUSTERED ([name],[address])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000),
    [password] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [deletedAt] DATETIME2,
    [shouldChangePassword] BIT NOT NULL CONSTRAINT [User_shouldChangePassword_df] DEFAULT 0,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[RefreshToken] (
    [id] INT NOT NULL IDENTITY(1,1),
    [token] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [expiryDate] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RefreshToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [revoked] BIT NOT NULL CONSTRAINT [RefreshToken_revoked_df] DEFAULT 0,
    CONSTRAINT [RefreshToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[UserCompanyAccess] (
    [userId] INT NOT NULL,
    [companyId] INT NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [UserCompanyAccess_pkey] PRIMARY KEY CLUSTERED ([userId],[companyId])
);

-- CreateTable
CREATE TABLE [dbo].[Department] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [companyId] INT NOT NULL,
    CONSTRAINT [Department_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Department_name_companyId_key] UNIQUE NONCLUSTERED ([name],[companyId])
);

-- CreateTable
CREATE TABLE [dbo].[Employee] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [profilePicturePath] NVARCHAR(1000) NOT NULL CONSTRAINT [Employee_profilePicturePath_df] DEFAULT 'default-avatar.jpg',
    [companyId] INT NOT NULL,
    [departmentId] INT NOT NULL,
    [checkedIn] BIT NOT NULL CONSTRAINT [Employee_checkedIn_df] DEFAULT 0,
    [birthdate] DATE NOT NULL,
    [employeeTypeId] INT NOT NULL,
    [monthlySalary] FLOAT(53),
    [monthlyHours] FLOAT(53),
    [hourlySalary] FLOAT(53),
    [address] NVARCHAR(1000) NOT NULL,
    [city] NVARCHAR(1000) NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Employee_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EmployeeType] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [companyId] INT NOT NULL,
    CONSTRAINT [EmployeeType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [EmployeeType_name_companyId_key] UNIQUE NONCLUSTERED ([name],[companyId])
);

-- CreateTable
CREATE TABLE [dbo].[AbsenceRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [employeeId] INT NOT NULL,
    [startDate] DATE NOT NULL,
    [endDate] DATE NOT NULL,
    [absenceTypeId] INT NOT NULL,
    CONSTRAINT [AbsenceRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AttendanceRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [employeeId] INT NOT NULL,
    [checkIn] DATETIME2 NOT NULL CONSTRAINT [AttendanceRecord_checkIn_df] DEFAULT CURRENT_TIMESTAMP,
    [checkOut] DATETIME2,
    [autoClosed] BIT NOT NULL CONSTRAINT [AttendanceRecord_autoClosed_df] DEFAULT 0,
    CONSTRAINT [AttendanceRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AbsenceType] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [companyId] INT NOT NULL,
    CONSTRAINT [AbsenceType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AbsenceType_name_companyId_key] UNIQUE NONCLUSTERED ([name],[companyId])
);

-- CreateTable
CREATE TABLE [dbo].[ManagerInvite] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [companyId] INT NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expiryDate] DATETIME2 NOT NULL,
    [used] BIT NOT NULL CONSTRAINT [ManagerInvite_used_df] DEFAULT 0,
    CONSTRAINT [ManagerInvite_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ManagerInvite_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_email_idx] ON [dbo].[User]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_username_idx] ON [dbo].[User]([username]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_deletedAt_idx] ON [dbo].[User]([deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefreshToken_userId_idx] ON [dbo].[RefreshToken]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefreshToken_expiryDate_idx] ON [dbo].[RefreshToken]([expiryDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefreshToken_revoked_idx] ON [dbo].[RefreshToken]([revoked]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_companyId_idx] ON [dbo].[Employee]([companyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_departmentId_idx] ON [dbo].[Employee]([departmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AbsenceRecord_employeeId_idx] ON [dbo].[AbsenceRecord]([employeeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AbsenceRecord_absenceTypeId_idx] ON [dbo].[AbsenceRecord]([absenceTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AbsenceRecord_employeeId_startDate_idx] ON [dbo].[AbsenceRecord]([employeeId], [startDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AbsenceRecord_employeeId_endDate_idx] ON [dbo].[AbsenceRecord]([employeeId], [endDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AttendanceRecord_employeeId_idx] ON [dbo].[AttendanceRecord]([employeeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AbsenceType_companyId_idx] ON [dbo].[AbsenceType]([companyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ManagerInvite_companyId_idx] ON [dbo].[ManagerInvite]([companyId]);

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserCompanyAccess] ADD CONSTRAINT [UserCompanyAccess_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserCompanyAccess] ADD CONSTRAINT [UserCompanyAccess_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Department] ADD CONSTRAINT [Department_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_departmentId_fkey] FOREIGN KEY ([departmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_employeeTypeId_fkey] FOREIGN KEY ([employeeTypeId]) REFERENCES [dbo].[EmployeeType]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmployeeType] ADD CONSTRAINT [EmployeeType_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AbsenceRecord] ADD CONSTRAINT [AbsenceRecord_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[Employee]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AbsenceRecord] ADD CONSTRAINT [AbsenceRecord_absenceTypeId_fkey] FOREIGN KEY ([absenceTypeId]) REFERENCES [dbo].[AbsenceType]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AttendanceRecord] ADD CONSTRAINT [AttendanceRecord_employeeId_fkey] FOREIGN KEY ([employeeId]) REFERENCES [dbo].[Employee]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AbsenceType] ADD CONSTRAINT [AbsenceType_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ManagerInvite] ADD CONSTRAINT [ManagerInvite_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
