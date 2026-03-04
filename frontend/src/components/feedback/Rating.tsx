interface RatingProps {
  rating: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export default function Rating({ rating, size = 'md' }: RatingProps) {
  const sizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-sm',
    md: 'text-[21px]',
    lg: 'text-2xl',
  }
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`${sizeClasses[size]} ${
            index < rating ? 'text-amber-400 dark:text-amber-400' : 'text-gray-300 dark:text-gray-600'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  )
}
