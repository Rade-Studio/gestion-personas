'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
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
          '!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2',
          '!w-[95vw] !max-w-6xl !h-auto !max-h-[90vh] !m-0 !rounded-2xl',
          '!p-0 !gap-0 !overflow-hidden !z-[100] !shadow-2xl',
          '!duration-0 data-[state=open]:!animate-none data-[state=closed]:!animate-none'
        )}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Representantes</DialogTitle>
        <motion.div
          key="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={shouldAnimate && open ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200
          }}
          className="relative w-full h-auto flex flex-col bg-background rounded-2xl overflow-hidden"
        >
          <div className="text-center py-6 px-8 flex-shrink-0 border-b">
            <h2 className="text-3xl md:text-4xl font-bold">Representantes</h2>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Conoce a nuestros representantes
            </p>
          </div>

          <div className={cn(
            'grid gap-4 md:gap-6 px-4 md:px-8 py-6',
            getGridCols(),
            'overflow-y-auto max-h-[calc(90vh-120px)]'
          )}>
            {representantes.map((representante) => (
              <div
                key={representante.id}
                className="group relative rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer bg-muted"
              >
                <div className="relative w-full flex items-center justify-center bg-muted overflow-hidden" style={{ minHeight: '400px', maxHeight: '600px' }}>
                  {representante.imagen_url ? (
                    <>
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={representante.imagen_url}
                          alt={representante.nombre_completo}
                          width={600}
                          height={800}
                          className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
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

          <motion.button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 rounded-full p-2 bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-accent hover:shadow-xl transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-foreground" />
          </motion.button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

