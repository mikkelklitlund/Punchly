import { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { addDays, subDays, subMonths } from 'date-fns'
import { Role } from 'shared'

const prisma = new PrismaClient()

async function ensureCompanyAbsenceTypes(companyId: number) {
  const defaults = ['VACATION', 'SICK', 'HOMEDAY', 'PUBLIC_HOLIDAY'] as const
  // Upsert defaults
  await Promise.all(
    defaults.map((name) =>
      prisma.absenceType.upsert({
        where: { absenceTypeCompany: { name, companyId } },
        update: {},
        create: { name, companyId },
      })
    )
  )
  // Return a name -> id map
  const rows = await prisma.absenceType.findMany({
    where: { companyId },
    select: { id: true, name: true },
  })
  return Object.fromEntries(rows.map((r) => [r.name, r.id])) as Record<(typeof defaults)[number], number>
}

async function main() {
  // Create companies (with employee types & departments)
  const companyNBV = await prisma.company.upsert({
    where: { addressName: { name: 'NBV', address: 'Poulsensvej 89' } },
    update: {},
    create: {
      name: 'NBV',
      address: 'Poulsensvej 89',
      employeeTypes: {
        create: [{ name: 'Full-Time' }, { name: 'Part-Time' }, { name: 'Contract' }, { name: 'Seasonal' }],
      },
      departments: {
        create: [
          { name: 'Snedkeri' },
          { name: 'Køkken' },
          { name: 'Service' },
          { name: 'Administration' },
          { name: 'Marketing' },
        ],
      },
    },
  })

  const companyARK = await prisma.company.upsert({
    where: { addressName: { name: 'ARK Design', address: 'Industrivej 42' } },
    update: {},
    create: {
      name: 'ARK Design',
      address: 'Industrivej 42',
      employeeTypes: {
        create: [{ name: 'Full-Time' }, { name: 'Part-Time' }, { name: 'Freelance' }],
      },
      departments: {
        create: [{ name: 'Design' }, { name: 'Production' }, { name: 'Sales' }, { name: 'Management' }],
      },
    },
  })

  // Users (same creds)
  const testUser = await prisma.user.upsert({
    where: { username: 'testperson' },
    update: {},
    create: {
      email: 'test@test.com',
      password: '$argon2id$v=19$m=65536,t=3,p=4$PS8AfAvW2oQqD+NS9WiasA$CskdQm00Fd8iPokG/kUVnMJyinLXrV4xMOQA2COhen8',
      username: 'testperson',
    },
  })

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      email: 'admin@system.com',
      password: '$argon2id$v=19$m=65536,t=3,p=4$PS8AfAvW2oQqD+NS9WiasA$CskdQm00Fd8iPokG/kUVnMJyinLXrV4xMOQA2COhen8',
      username: 'admin',
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      email: 'manager@nbv.com',
      password: '$argon2id$v=19$m=65536,t=3,p=4$PS8AfAvW2oQqD+NS9WiasA$CskdQm00Fd8iPokG/kUVnMJyinLXrV4xMOQA2COhen8',
      username: 'manager',
    },
  })

  const companyUser = await prisma.user.upsert({
    where: { username: 'company' },
    update: {},
    create: {
      email: 'company@ark.com',
      password: '$argon2id$v=19$m=65536,t=3,p=4$PS8AfAvW2oQqD+NS9WiasA$CskdQm00Fd8iPokG/kUVnMJyinLXrV4xMOQA2COhen8',
      username: 'company',
    },
  })

  await prisma.user.upsert({
    where: { username: 'deleted' },
    update: {},
    create: {
      email: 'deleted@test.com',
      password: '$argon2id$v=19$m=65536,t=3,p=4$PS8AfAvW2oQqD+NS9WiasA$CskdQm00Fd8iPokG/kUVnMJyinLXrV4xMOQA2COhen8',
      username: 'deleted',
      deletedAt: new Date(),
    },
  })

  // Access roles
  await prisma.userCompanyAccess.upsert({
    where: { userId_companyId: { userId: testUser.id, companyId: companyNBV.id } },
    update: {},
    create: { userId: testUser.id, companyId: companyNBV.id, role: Role.COMPANY },
  })
  await prisma.userCompanyAccess.upsert({
    where: { userId_companyId: { userId: adminUser.id, companyId: companyNBV.id } },
    update: {},
    create: { userId: adminUser.id, companyId: companyNBV.id, role: Role.ADMIN },
  })
  await prisma.userCompanyAccess.upsert({
    where: { userId_companyId: { userId: adminUser.id, companyId: companyARK.id } },
    update: {},
    create: { userId: adminUser.id, companyId: companyARK.id, role: Role.ADMIN },
  })
  await prisma.userCompanyAccess.upsert({
    where: { userId_companyId: { userId: managerUser.id, companyId: companyNBV.id } },
    update: {},
    create: { userId: managerUser.id, companyId: companyNBV.id, role: Role.MANAGER },
  })
  await prisma.userCompanyAccess.upsert({
    where: { userId_companyId: { userId: companyUser.id, companyId: companyARK.id } },
    update: {},
    create: { userId: companyUser.id, companyId: companyARK.id, role: Role.COMPANY },
  })

  // Refresh tokens
  const now = new Date()
  await prisma.refreshToken.createMany({
    data: [
      { token: `valid-refresh-token-1-${uuid()}`, userId: testUser.id, expiryDate: addDays(now, 7), revoked: false },
      { token: `valid-refresh-token-2-${uuid()}`, userId: adminUser.id, expiryDate: addDays(now, 30), revoked: false },
      { token: `expired-refresh-token-1-${uuid()}`, userId: testUser.id, expiryDate: subDays(now, 1), revoked: false },
      {
        token: `revoked-refresh-token-2-${uuid()}`,
        userId: managerUser.id,
        expiryDate: addDays(now, 7),
        revoked: true,
      },
    ],
  })

  // Lookup departments
  const [departmentSnedkeri, departmentKokken, departmentService, departmentAdmin, departmentMarketing] =
    await Promise.all([
      prisma.department.findFirst({ where: { name: 'Snedkeri', companyId: companyNBV.id } }),
      prisma.department.findFirst({ where: { name: 'Køkken', companyId: companyNBV.id } }),
      prisma.department.findFirst({ where: { name: 'Service', companyId: companyNBV.id } }),
      prisma.department.findFirst({ where: { name: 'Administration', companyId: companyNBV.id } }),
      prisma.department.findFirst({ where: { name: 'Marketing', companyId: companyNBV.id } }),
    ])

  const [departmentDesign, departmentProduction, departmentSales] = await Promise.all([
    prisma.department.findFirst({ where: { name: 'Design', companyId: companyARK.id } }),
    prisma.department.findFirst({ where: { name: 'Production', companyId: companyARK.id } }),
    prisma.department.findFirst({ where: { name: 'Sales', companyId: companyARK.id } }),
  ])

  // Employee types
  const [fullTimeNBV, partTimeNBV, contractNBV, seasonalNBV] = await Promise.all([
    prisma.employeeType.findFirst({ where: { name: 'Full-Time', companyId: companyNBV.id } }),
    prisma.employeeType.findFirst({ where: { name: 'Part-Time', companyId: companyNBV.id } }),
    prisma.employeeType.findFirst({ where: { name: 'Contract', companyId: companyNBV.id } }),
    prisma.employeeType.findFirst({ where: { name: 'Seasonal', companyId: companyNBV.id } }),
  ])
  const [fullTimeARK, partTimeARK, freelanceARK] = await Promise.all([
    prisma.employeeType.findFirst({ where: { name: 'Full-Time', companyId: companyARK.id } }),
    prisma.employeeType.findFirst({ where: { name: 'Part-Time', companyId: companyARK.id } }),
    prisma.employeeType.findFirst({ where: { name: 'Freelance', companyId: companyARK.id } }),
  ])

  // Employees NBV
  await prisma.employee.createMany({
    data: [
      {
        name: 'Jens Sørensens',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentSnedkeri?.id || 1,
        employeeTypeId: fullTimeNBV?.id || 1,
        checkedIn: true,
        birthdate: new Date('1990-01-01'),
        hourlySalary: 64,
        address: 'Larsensvej 123',
        city: 'Hjørring',
      },
      {
        name: 'Anna Hansen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentKokken?.id || 1,
        employeeTypeId: partTimeNBV?.id || 1,
        checkedIn: false,
        birthdate: new Date('1985-05-15'),
        hourlySalary: 45,
        address: 'Nørregade 45',
        city: 'Aalborg',
      },
      {
        name: 'Peter Nielsen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentSnedkeri?.id || 1,
        employeeTypeId: partTimeNBV?.id || 1,
        checkedIn: false,
        birthdate: new Date('1992-07-07'),
        hourlySalary: 50,
        address: 'Vestergade 10',
        city: 'Aarhus',
      },
      {
        name: 'Mette Pedersen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentService?.id || 1,
        employeeTypeId: fullTimeNBV?.id || 1,
        checkedIn: true,
        birthdate: new Date('1988-03-12'),
        hourlySalary: 58,
        address: 'Søndergade 78',
        city: 'Aalborg',
      },
      {
        name: 'Lars Jensen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentKokken?.id || 1,
        employeeTypeId: fullTimeNBV?.id || 1,
        checkedIn: true,
        birthdate: new Date('1975-11-30'),
        hourlySalary: 68,
        address: 'Borgergade 15',
        city: 'København',
      },
      {
        name: 'Sofie Andersen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentAdmin?.id || 1,
        employeeTypeId: fullTimeNBV?.id || 1,
        checkedIn: false,
        birthdate: new Date('1993-09-22'),
        monthlySalary: 32000,
        address: 'Frederiksalle 67',
        city: 'Aalborg',
      },
      {
        name: 'Thomas Christensen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentMarketing?.id || 1,
        employeeTypeId: contractNBV?.id || 1,
        checkedIn: false,
        birthdate: new Date('1987-06-14'),
        monthlySalary: 38000,
        address: 'Strandvej 45',
        city: 'Aalborg',
      },
      {
        name: 'Emma Rasmussen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentService?.id || 1,
        employeeTypeId: seasonalNBV?.id || 1,
        checkedIn: true,
        birthdate: new Date('1995-02-28'),
        hourlySalary: 42,
        address: 'Danmarksgade 23',
        city: 'Aalborg',
      },
      {
        name: 'Mikkel Larsen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyNBV.id,
        departmentId: departmentSnedkeri?.id || 1,
        employeeTypeId: fullTimeNBV?.id || 1,
        checkedIn: false,
        birthdate: new Date('1979-12-03'),
        hourlySalary: 60,
        address: 'Østergade 12',
        city: 'Hjørring',
        deletedAt: new Date(),
      },
    ],
  })

  // Employees ARK
  await prisma.employee.createMany({
    data: [
      {
        name: 'Julie Mikkelsen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyARK.id,
        departmentId: departmentDesign?.id || 1,
        employeeTypeId: fullTimeARK?.id || 1,
        checkedIn: true,
        birthdate: new Date('1991-04-17'),
        monthlySalary: 34000,
        address: 'Havnegade 8',
        city: 'København',
      },
      {
        name: 'Nikolaj Hansen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyARK.id,
        departmentId: departmentDesign?.id || 1,
        employeeTypeId: fullTimeARK?.id || 1,
        checkedIn: true,
        birthdate: new Date('1985-08-24'),
        monthlySalary: 36000,
        address: 'Vimmelskaftet 43',
        city: 'København',
      },
      {
        name: 'Maria Poulsen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyARK.id,
        departmentId: departmentProduction?.id || 1,
        employeeTypeId: partTimeARK?.id || 1,
        checkedIn: false,
        birthdate: new Date('1994-01-12'),
        hourlySalary: 52,
        address: 'Nyhavn 18',
        city: 'København',
      },
      {
        name: 'Anders Johansen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyARK.id,
        departmentId: departmentSales?.id || 1,
        employeeTypeId: fullTimeARK?.id || 1,
        checkedIn: false,
        birthdate: new Date('1982-05-30'),
        monthlySalary: 38000,
        address: 'Gammel Kongevej 123',
        city: 'København',
      },
      {
        name: 'Camilla Svendsen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: companyARK.id,
        departmentId: departmentProduction?.id || 1,
        employeeTypeId: freelanceARK?.id || 1,
        checkedIn: false,
        birthdate: new Date('1989-11-05'),
        hourlySalary: 65,
        address: 'Vesterbrogade 89',
        city: 'København',
      },
    ],
  })

  // Build absence types per company (model-based)
  const absenceIdsNBV = await ensureCompanyAbsenceTypes(companyNBV.id)
  const absenceIdsARK = await ensureCompanyAbsenceTypes(companyARK.id)

  // Employees to reference for records
  const nbvEmployeesList = await prisma.employee.findMany({
    where: { companyId: companyNBV.id, deletedAt: null },
    orderBy: { id: 'asc' },
  })
  const arkEmployeesList = await prisma.employee.findMany({
    where: { companyId: companyARK.id, deletedAt: null },
    orderBy: { id: 'asc' },
  })

  // Attendance records
  const today = new Date()
  const attendanceRecords: Array<{ employeeId: number; checkIn: Date; checkOut: Date | null }> = []

  for (const employee of nbvEmployeesList) {
    for (let i = 1; i <= 7; i++) {
      const date = subDays(today, i)
      if (date.getDay() === 0 || date.getDay() === 6) continue
      const checkIn = new Date(date)
      checkIn.setHours(8, Math.floor(Math.random() * 30), 0, 0)
      const checkOut = new Date(date)
      const hourOffset = Math.random() < 0.2 ? Math.floor(Math.random() * 2) - 1 : 0
      checkOut.setHours(16 + hourOffset, Math.floor(Math.random() * 30), 0, 0)
      attendanceRecords.push({ employeeId: employee.id, checkIn, checkOut })
    }
    if (employee.checkedIn) {
      const checkIn = new Date(today)
      checkIn.setHours(8, Math.floor(Math.random() * 30), 0, 0)
      attendanceRecords.push({ employeeId: employee.id, checkIn, checkOut: null })
    }
  }

  for (const employee of arkEmployeesList) {
    for (let i = 1; i <= 3; i++) {
      const date = subDays(today, i)
      if (date.getDay() === 0 || date.getDay() === 6) continue
      const checkIn = new Date(date)
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0)
      const checkOut = new Date(date)
      checkOut.setHours(17, Math.floor(Math.random() * 30), 0, 0)
      attendanceRecords.push({ employeeId: employee.id, checkIn, checkOut })
    }
    if (employee.checkedIn) {
      const checkIn = new Date(today)
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0)
      attendanceRecords.push({ employeeId: employee.id, checkIn, checkOut: null })
    }
  }

  await prisma.attendanceRecord.createMany({ data: attendanceRecords })

  // Absence records (now using absenceTypeId)
  await prisma.absenceRecord.createMany({
    data: [
      // Sick leave for Anna (NBV index 1)
      {
        employeeId: nbvEmployeesList[1].id,
        startDate: subDays(today, 10),
        endDate: subDays(today, 8),
        absenceTypeId: absenceIdsNBV['SICK'],
      },
      // Home day for Peter (NBV index 2)
      {
        employeeId: nbvEmployeesList[2].id,
        startDate: subDays(today, 3),
        endDate: subDays(today, 3),
        absenceTypeId: absenceIdsNBV['HOMEDAY'],
      },
      // Public holiday for NBV folks (3 entries)
      {
        employeeId: nbvEmployeesList[0].id,
        startDate: subMonths(today, 1),
        endDate: subMonths(today, 1),
        absenceTypeId: absenceIdsNBV['PUBLIC_HOLIDAY'],
      },
      {
        employeeId: nbvEmployeesList[1].id,
        startDate: subMonths(today, 1),
        endDate: subMonths(today, 1),
        absenceTypeId: absenceIdsNBV['PUBLIC_HOLIDAY'],
      },
      {
        employeeId: nbvEmployeesList[2].id,
        startDate: subMonths(today, 1),
        endDate: subMonths(today, 1),
        absenceTypeId: absenceIdsNBV['PUBLIC_HOLIDAY'],
      },
      // Upcoming vacation for Mette (NBV index 3)
      {
        employeeId: nbvEmployeesList[3].id,
        startDate: addDays(today, 5),
        endDate: addDays(today, 15),
        absenceTypeId: absenceIdsNBV['VACATION'],
      },
      // Home day for Lars (NBV index 4)
      {
        employeeId: nbvEmployeesList[4].id,
        startDate: subDays(today, 5),
        endDate: subDays(today, 5),
        absenceTypeId: absenceIdsNBV['HOMEDAY'],
      },
      // Vacation for Nikolaj at ARK (ARK index 1)
      {
        employeeId: arkEmployeesList[1].id,
        startDate: addDays(today, 10),
        endDate: addDays(today, 20),
        absenceTypeId: absenceIdsARK['VACATION'],
      },
      // Sick leave for Maria at ARK (ARK index 2)
      {
        employeeId: arkEmployeesList[2].id,
        startDate: subDays(today, 2),
        endDate: today,
        absenceTypeId: absenceIdsARK['SICK'],
      },
    ],
  })

  console.log('Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
