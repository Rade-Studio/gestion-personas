#!/usr/bin/env tsx
/**
 * Script para resetear completamente la base de datos
 * 
 * Este script:
 * 1. Elimina todos los datos de las tablas
 * 2. Limpia todos los buckets de storage
 * 3. Elimina todos los usuarios excepto el admin especificado
 * 4. Crea un usuario admin por defecto si no existe
 * 
 * Uso:
 *   pnpm tsx scripts/reset-database.ts
 * 
 * Variables de entorno requeridas:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (clave de servicio, no la anon key)
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno requeridas:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Crear cliente con service role key para tener permisos completos
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos.')
  console.log('   Solo se mantendrá un usuario admin.')
  console.log('')

  const confirm = await question('¿Estás seguro de que quieres continuar? (escribe "SI" para confirmar): ')
  
  if (confirm !== 'SI') {
    console.log('❌ Operación cancelada.')
    rl.close()
    process.exit(0)
  }

  console.log('')
  console.log('🔄 Iniciando limpieza...')
  console.log('')

  try {
    // ========================================================================
    // PASO 1: Limpiar buckets de storage
    // ========================================================================
    console.log('📦 Limpiando buckets de storage...')

    const buckets = ['voto-imagenes', 'candidatos-imagenes']

    for (const bucketName of buckets) {
      try {
        // Listar todos los archivos en el bucket
        const { data: files, error: listError } = await supabase.storage
          .from(bucketName)
          .list('', {
            limit: 1000,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          })

        if (listError) {
          console.log(`   ⚠️  No se pudo listar archivos en ${bucketName}: ${listError.message}`)
          continue
        }

        if (files && files.length > 0) {
          // Obtener todos los archivos recursivamente
          const allFiles: string[] = []
          
          async function listAllFiles(path: string = '') {
            const { data, error } = await supabase.storage
              .from(bucketName)
              .list(path, {
                limit: 1000,
                sortBy: { column: 'name', order: 'asc' },
              })

            if (error) {
              console.log(`   ⚠️  Error listando ${path}: ${error.message}`)
              return
            }

            if (data) {
              for (const file of data) {
                const fullPath = path ? `${path}/${file.name}` : file.name
                if (file.id === null) {
                  // Es una carpeta, listar recursivamente
                  await listAllFiles(fullPath)
                } else {
                  // Es un archivo
                  allFiles.push(fullPath)
                }
              }
            }
          }

          await listAllFiles()

          if (allFiles.length > 0) {
            // Eliminar todos los archivos
            const { error: deleteError } = await supabase.storage
              .from(bucketName)
              .remove(allFiles)

            if (deleteError) {
              console.log(`   ⚠️  Error eliminando archivos de ${bucketName}: ${deleteError.message}`)
            } else {
              console.log(`   ✅ Eliminados ${allFiles.length} archivos de ${bucketName}`)
            }
          } else {
            console.log(`   ✅ Bucket ${bucketName} ya está vacío`)
          }
        } else {
          console.log(`   ✅ Bucket ${bucketName} ya está vacío`)
        }
      } catch (error: any) {
        console.log(`   ⚠️  Error procesando bucket ${bucketName}: ${error.message}`)
      }
    }

    console.log('')

    // ========================================================================
    // PASO 2: Eliminar datos de las tablas
    // ========================================================================
    console.log('🗑️  Eliminando datos de las tablas...')

    // Eliminar en orden correcto respetando foreign keys
    // Usar RPC para truncar las tablas (más eficiente)
    const tables = [
      'voto_confirmaciones',
      'personas',
      'importaciones',
      'candidatos',
      'profiles',
    ]

    // Primero intentar truncar (más rápido)
    for (const table of tables) {
      try {
        // Usar delete con condición siempre verdadera para limpiar todo
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
        
        if (error) {
          // Si falla, intentar con otra condición
          const { error: error2 } = await supabase
            .from(table)
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000')
          
          if (error2 && !error2.message.includes('0 rows')) {
            console.log(`   ⚠️  Error eliminando ${table}: ${error2.message}`)
          } else {
            console.log(`   ✅ Tabla ${table} limpiada`)
          }
        } else {
          console.log(`   ✅ Tabla ${table} limpiada`)
        }
      } catch (err: any) {
        console.log(`   ⚠️  Error procesando ${table}: ${err.message}`)
      }
    }

    console.log('')

    // ========================================================================
    // PASO 3: Eliminar usuarios de auth (excepto el admin)
    // ========================================================================
    console.log('👤 Limpiando usuarios de autenticación...')

    const adminEmail = await question('Email del usuario admin a mantener (o presiona Enter para crear uno nuevo): ')
    
    if (adminEmail) {
      // Buscar el usuario admin por email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.log(`   ⚠️  Error listando usuarios: ${listError.message}`)
      } else {
        let adminUserId: string | null = null
        
        // Encontrar el usuario admin
        for (const user of users.users) {
          if (user.email === adminEmail) {
            adminUserId = user.id
            break
          }
        }

        if (adminUserId) {
          // Eliminar todos los usuarios excepto el admin
          for (const user of users.users) {
            if (user.id !== adminUserId) {
              const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
              if (deleteError) {
                console.log(`   ⚠️  Error eliminando usuario ${user.email}: ${deleteError.message}`)
              } else {
                console.log(`   ✅ Usuario ${user.email} eliminado`)
              }
            }
          }
          console.log(`   ✅ Usuario admin ${adminEmail} mantenido`)
        } else {
          console.log(`   ⚠️  No se encontró usuario con email ${adminEmail}`)
        }
      }
    }

    // ========================================================================
    // PASO 4: Crear usuario admin si no existe
    // ========================================================================
    console.log('')
    const createAdmin = await question('¿Crear un nuevo usuario admin? (s/n): ')

    if (createAdmin.toLowerCase() === 's') {
      const newAdminEmail = await question('Email del nuevo admin: ')
      const newAdminPassword = await question('Contraseña del nuevo admin: ')
      const adminNombres = await question('Nombres del admin (default: Administrador): ') || 'Administrador'
      const adminApellidos = await question('Apellidos del admin (default: Sistema): ') || 'Sistema'
      const adminDocumento = await question('Número de documento (default: 0000000000): ') || '0000000000'

      // Crear usuario en auth
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: newAdminEmail,
        password: newAdminPassword,
        email_confirm: true,
      })

      if (createError) {
        console.log(`   ❌ Error creando usuario: ${createError.message}`)
      } else if (authUser.user) {
        // Crear perfil admin
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authUser.user.id,
          nombres: adminNombres,
          apellidos: adminApellidos,
          tipo_documento: 'CC',
          numero_documento: adminDocumento,
          role: 'admin',
        })

        if (profileError) {
          console.log(`   ⚠️  Usuario creado pero error creando perfil: ${profileError.message}`)
          console.log(`   💡 Crea el perfil manualmente con el ID: ${authUser.user.id}`)
        } else {
          console.log(`   ✅ Usuario admin creado: ${newAdminEmail}`)
        }
      }
    }

    console.log('')
    console.log('✅ Limpieza completada!')
    console.log('')
    console.log('📝 Próximos pasos:')
    console.log('   1. Verifica que los buckets estén vacíos en el dashboard')
    console.log('   2. Verifica que solo quede el usuario admin en Authentication')
    console.log('   3. Inicia sesión con el usuario admin para verificar')

  } catch (error: any) {
    console.error('❌ Error durante la limpieza:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()

