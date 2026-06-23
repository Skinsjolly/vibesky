import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
}

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const px = sizes[size]
  const seed = alt.replace(/\s+/g, '').toLowerCase()
  const fallback = src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden bg-sky-surface border border-sky-border flex-shrink-0',
        className
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src={fallback}
        alt={alt}
        width={px}
        height={px}
        className="w-full h-full object-cover"
        unoptimized
      />
    </div>
  )
}
