import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Datos de barrios (extracto del SQL de migración)
const barrios = [
  { codigo: 'BAR001', nombre: 'ANTONIO NARIÑO' },
  { codigo: 'BAR002', nombre: 'BARRIO NORMANDIA' },
  { codigo: 'BAR003', nombre: 'BELLA MURILLO' },
  { codigo: 'BAR004', nombre: 'COSTA DE ORO' },
  { codigo: 'BAR005', nombre: 'EL ENCANTO' },
  { codigo: 'BAR006', nombre: 'EL EXITO' },
  { codigo: 'BAR007', nombre: 'ELPARQUE' },
  { codigo: 'BAR008', nombre: 'LA ALIANZA' },
  { codigo: 'BAR009', nombre: 'LA ARBOLEDA' },
  { codigo: 'BAR010', nombre: 'LA FARRUCA' },
  // Agregar más barrios según sea necesario desde la migración SQL original
]

// Datos de puestos de votación (extracto del SQL de migración)
const puestosVotacion = [
  { codigo: 'PUE001', nombre: 'I.E. TECNICO LA ENSEÑANZA', direccion: 'CRA 25 No 16-69' },
  { codigo: 'PUE002', nombre: 'I.E. INOBASOL - SEDE 2', direccion: 'CALLE 18 No. 19 - 76' },
  { codigo: 'PUE003', nombre: 'I.E. DOLORES MA.UCROS - SEDE 3', direccion: 'CRA 20 No 15 - 14' },
  { codigo: 'PUE004', nombre: 'I.E. INOBASOL', direccion: 'CL 15 No. 18-64' },
  { codigo: 'PUE005', nombre: 'I.E.DOLORES MARIA UCROS', direccion: 'CARRERA 21 No. 25 - 53' },
  // Agregar más puestos según sea necesario desde la migración SQL original
]

async function main() {
  console.log('Iniciando seed de datos...')

  // Seed barrios
  console.log('Creando barrios...')
  for (const barrio of barrios) {
    await prisma.barrio.upsert({
      where: { codigo: barrio.codigo },
      update: { nombre: barrio.nombre },
      create: barrio,
    })
  }
  console.log(`${barrios.length} barrios procesados`)

  // Seed puestos de votación
  console.log('Creando puestos de votación...')
  for (const puesto of puestosVotacion) {
    await prisma.puestoVotacion.upsert({
      where: { codigo: puesto.codigo },
      update: { nombre: puesto.nombre, direccion: puesto.direccion },
      create: puesto,
    })
  }
  console.log(`${puestosVotacion.length} puestos de votación procesados`)

  // Crear usuario admin inicial si no existe
  const adminEmail = 'admin@sistema.local'
  const adminPassword = await bcrypt.hash('admin123', 12)

  const existingAdmin = await prisma.profile.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    console.log('Creando usuario admin inicial...')
    await prisma.profile.create({
      data: {
        email: adminEmail,
        passwordHash: adminPassword,
        nombres: 'Administrador',
        apellidos: 'Sistema',
        tipoDocumento: 'CC',
        numeroDocumento: '0000000000',
        role: 'admin',
      },
    })
    console.log('Usuario admin creado: admin@sistema.local / admin123')
  } else {
    console.log('Usuario admin ya existe')
  }

  console.log('Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
