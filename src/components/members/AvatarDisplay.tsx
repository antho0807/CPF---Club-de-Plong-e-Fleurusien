interface Props {
  avatarUrl?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  sm:  'w-8  h-8  text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-16 h-16 text-xl',
  xl:  'w-24 h-24 text-3xl',
}

export function AvatarDisplay({ avatarUrl, name, size = 'md', className = '' }: Props) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const sizeClass = SIZES[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-[#0077b6] text-white flex items-center justify-center font-bold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  )
}
