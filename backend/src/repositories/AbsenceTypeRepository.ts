import { PrismaClient, AbsenceType as PrismaAbsenceType } from '@prisma/client'
import { IAbsenceTypeRepository } from '../interfaces/repositories/IAbsenceTypeRepository.js'
import { AbsenceType } from '../types/index.js'

export class AbsenceTypeRepository implements IAbsenceTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(prismaType: PrismaAbsenceType): AbsenceType {
    return {
      id: prismaType.id,
      name: prismaType.name,
      companyId: prismaType.companyId,
    }
  }

  private toPrismaUpdateData(patch: Partial<Omit<AbsenceType, 'id'>>): Partial<Omit<AbsenceType, 'id'>> {
    const data: Partial<Omit<AbsenceType, 'id'>> = {}
    if (patch.name !== undefined) data.name = patch.name
    if (patch.companyId !== undefined) data.companyId = patch.companyId
    return data
  }

  async createAbsenceType(name: string, companyId: number): Promise<AbsenceType> {
    const type = await this.prisma.absenceType.create({
      data: { name, companyId },
    })
    return this.toDomain(type)
  }

  async getAbsenceTypeById(id: number): Promise<AbsenceType | null> {
    const type = await this.prisma.absenceType.findUnique({
      where: { id },
    })
    return type ? this.toDomain(type) : null
  }

  async getAbsenceTypesByCompanyId(companyId: number): Promise<AbsenceType[]> {
    const types = await this.prisma.absenceType.findMany({
      where: { companyId },
    })
    return types.map((t) => this.toDomain(t))
  }

  async absenceTypeExistsOnCompanyId(companyId: number, name: string): Promise<boolean> {
    return (
      (await this.prisma.absenceType.findUnique({
        where: {
          absenceTypeCompany: { companyId, name },
        },
      })) !== null
    )
  }

  async updateAbsenceType(id: number, patch: Partial<Omit<AbsenceType, 'id'>>): Promise<AbsenceType> {
    const type = await this.prisma.absenceType.update({
      where: { id },
      data: this.toPrismaUpdateData(patch),
    })
    return this.toDomain(type)
  }

  async deleteAbsenceType(id: number): Promise<AbsenceType> {
    const type = await this.prisma.absenceType.delete({
      where: { id },
    })
    return this.toDomain(type)
  }

  async deleteAbsenceTypeByCompanyIdAndName(companyId: number, name: string): Promise<AbsenceType> {
    const type = await this.prisma.absenceType.delete({
      where: {
        absenceTypeCompany: { companyId, name },
      },
    })
    return this.toDomain(type)
  }
}
