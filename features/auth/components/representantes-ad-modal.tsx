'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface RepresentantePublic {
  id: string
  nombre_completo: string
  numero_tarjeton: string
  imagen_url?: string
  partido_grupo?: string
}

interface RepresentantesAdModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  representantes: RepresentantePublic[]
}

export function RepresentantesAdModal({ open, onOpenChange, representantes }: RepresentantesAdModalProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (open) {
      setShouldAnimate(true)
    }
  }, [open])

  const handleClose = () => {
    setShouldAnimate(false)
    setTimeout(() => {
      onOpenChange(false)
    }, 300)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      handleClose()
    } else if (newOpen) {
      onOpenChange(newOpen)
    }
  }

  const getGridCols = () => {
    if (representantes.length === 1) return 'grid-cols-1'
    if (representantes.length === 2) return 'grid-cols-1 md:grid-cols-2'
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  if (representantes.length === 0) return null

  return (
    <Dialog open={open && representantes.length > 0} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          '!fixed !left-1/2 !top-[25vh] !-translate-x-1/2',
          '!w-[95vw] !max-w-7xl !h-[75vh] !max-h-[75vh] !m-0 !rounded-2xl',
          '!p-0 !gap-0 !overflow-visible !z-[100] !shadow-2xl',
          '!duration-0 data-[state=open]:!animate-none data-[state=closed]:!animate-none'
        )}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Representantes</DialogTitle>
        <motion.div
          key="modal-content"
          initial={{ y: '-100vh', opacity: 0 }}
          animate={shouldAnimate && open ? { y: 0, opacity: 1 } : { y: '-100vh', opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200
          }}
          className="relative w-full h-full flex flex-col bg-background rounded-2xl overflow-hidden"
        >
          <div className="text-center py-6 px-8 flex-shrink-0 border-b">
                <h2 className="text-3xl md:text-4xl font-bold">Representantes</h2>
                <p className="text-muted-foreground text-sm md:text-base mt-1">
                  Conoce a nuestros representantes
                </p>
              </div>

              <div className={cn(
                'grid flex-1 gap-4 md:gap-6 px-4 md:px-8 py-6',
                getGridCols(),
                'overflow-y-auto'
              )}>
                {representantes.map((representante) => (
                  <div
                    key={representante.id}
                    className="group relative rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer"
                  >
                    <div className="relative flex-1 min-h-0 bg-muted overflow-hidden">
                      {representante.imagen_url ? (
                        <>
                          <Image
                            src={representante.imagen_url}
                            alt={representante.nombre_completo}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                          <div className="text-5xl md:text-6xl font-bold text-primary/60">
                            {representante.nombre_completo.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                        <div className="space-y-2">
                          <h3 className="font-bold text-white text-lg md:text-xl leading-tight drop-shadow-lg">
                            {representante.nombre_completo}
                          </h3>
                          
                          {representante.partido_grupo && (
                            <p className="text-white/80 text-xs md:text-sm drop-shadow-md">
                              {representante.partido_grupo}
                            </p>
                          )}
                          
                          <div className="pt-3 border-t border-white/20">
                            <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                              <span className="text-xs font-medium text-muted-foreground">Tarjetón</span>
                              <span className="font-black text-2xl md:text-3xl text-primary">
                                {representante.numero_tarjeton}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                <div className="w-20 h-8 bg-background rounded-t-full"></div>
                <motion.button
                  onClick={handleClose}
                  className="relative -mt-4 outline-none focus:outline-none focus-visible:outline-none"
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  aria-label="Cerrar"
                >
                  <div className="flex flex-col items-center gap-1 group">
                    <div className="bg-background backdrop-blur-md border-2 border-border rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-accent outline-none focus:outline-none">
                      <ChevronUp className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      Cerrar
                    </span>
                  </div>
                </motion.button>
              </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

