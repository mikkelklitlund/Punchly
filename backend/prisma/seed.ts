import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.upsert({
    where: {
      addressName: { name: 'NBV', address: 'Poulsensvej 89' },
    },
    update: {},
    create: {
      name: 'NBV',
      address: 'Poulsensvej 89',
      employeeTypes: {
        create: [{ name: 'Full-Time' }, { name: 'Part-Time' }],
      },
      departments: {
        create: [{ name: 'Snedkeri' }, { name: 'Køkken' }, { name: 'Service' }],
      },
    },
  })

  const user = await prisma.user.upsert({
    where: { username: 'testperson' },
    update: {},
    create: {
      email: 'test@test.com',
      password: '$2b$10$smAf8M/uuWsuULjdzlNDfuGwllA0UXZBdBvFL4d0BFv1s9gz48nYW', // Hashed password: "admin"
      username: 'testperson',
    },
  })

  await prisma.userCompanyAccess.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: {},
    create: {
      userId: user.id,
      companyId: company.id,
      role: Role.COMPANY,
    },
  })

  const departmentSnedkeri = await prisma.department.findFirst({
    where: { name: 'Snedkeri', companyId: company.id },
  })

  const departmentKokken = await prisma.department.findFirst({
    where: { name: 'Køkken', companyId: company.id },
  })

  const fullTimeEmployeeType = await prisma.employeeType.findFirst({
    where: { name: 'Full-Time', companyId: company.id },
  })

  const partTimeEmployeeType = await prisma.employeeType.findFirst({
    where: { name: 'Part-Time', companyId: company.id },
  })

  await prisma.employee.createMany({
    data: [
      {
        name: 'Jens Sørensens',
        profilePicturePath: 'default-avatar.jpg',
        companyId: company.id,
        departmentId: departmentSnedkeri?.id || 1,
        employeeTypeId: fullTimeEmployeeType?.id || 1,
        checkedIn: false,
        birthdate: new Date('1990-01-01'),
        hourlySalary: 64,
        address: 'Larsensvej 123',
        city: 'Hjørring',
      },
      {
        name: 'Anna Hansen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: company.id,
        departmentId: departmentKokken?.id || 1,
        employeeTypeId: partTimeEmployeeType?.id || 1,
        checkedIn: false,
        birthdate: new Date('1985-05-15'),
        hourlySalary: 45,
        address: 'Nørregade 45',
        city: 'Aalborg',
      },
      {
        name: 'Peter Nielsen',
        profilePicturePath: 'default-avatar.jpg',
        companyId: company.id,
        departmentId: departmentSnedkeri?.id || 1,
        employeeTypeId: partTimeEmployeeType?.id || 1,
        checkedIn: false,
        birthdate: new Date('1992-07-07'),
        hourlySalary: 50,
        address: 'Vestergade 10',
        city: 'Aarhus',
      },
    ],
  })
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
