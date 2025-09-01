import { PrismaClient, AbsenceType } from '@prisma/client'
import { AbsenceType as AbsenceTypeDTO } from 'shared'
import { IAbsenceTypeRepository } from '../interfaces/repositories/IAbsenceTypeRepository.js'

export class AbsenceTypeRepository implements IAbsenceTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAbsenceType(name: string, companyId: number): Promise<AbsenceTypeDTO> {
    const type = await this.prisma.absenceType.create({
      data: { name, companyId },
    })
    return this.translateToDTO(type)
  }

  async getAbsenceTypeById(id: number): Promise<AbsenceTypeDTO | null> {
    const type = await this.prisma.absenceType.findUnique({
      where: { id },
    })
    return type ? this.translateToDTO(type) : null
  }

  async getAbsenceTypesByCompanyId(companyId: number): Promise<AbsenceTypeDTO[]> {
    const types = await this.prisma.absenceType.findMany({
      where: { companyId },
    })
    return types.map(this.translateToDTO)
  }

  async absenceTypeExistsOnCompanyId(companyId: number, name: string): Promise<boolean> {
    return (
      (await this.prisma.absenceType.findUnique({
        where: {
          absenceTypeCompany: { companyId, name }, // matches @@unique([name, companyId], name: "absenceTypeCompany")
        },
      })) !== null
    )
  }

  async updateAbsenceType(id: number, data: Partial<Omit<AbsenceType, 'id'>>): Promise<AbsenceTypeDTO> {
    const type = await this.prisma.absenceType.update({
      where: { id },
      data,
    })
    return this.translateToDTO(type)
  }

  async deleteAbsenceType(id: number): Promise<AbsenceTypeDTO> {
    const type = await this.prisma.absenceType.delete({
      where: { id },
    })
    return this.translateToDTO(type)
  }

  async deleteAbsenceTypeByCompanyIdAndName(companyId: number, name: string): Promise<AbsenceTypeDTO> {
    const type = await this.prisma.absenceType.delete({
      where: {
        absenceTypeCompany: { companyId, name },
      },
    })
    return this.translateToDTO(type)
  }

  private translateToDTO(absenceType: AbsenceType): AbsenceTypeDTO {
    return {
      id: absenceType.id,
      name: absenceType.name,
      companyId: absenceType.companyId,
    }
  }
}
