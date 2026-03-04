export type HeadingStructure = {
  h1: string
  h2: string
  h3: string
}

export function buildProductHeadings(productName: string, categoryName?: string): HeadingStructure {
  const name = productName.trim() || 'Product'
  const category = categoryName?.trim()
  return {
    h1: name,
    h2: `Key features of ${name}`,
    h3: category ? `Why buy ${name} in ${category} online` : `Why buy ${name} online in Bangladesh`,
  }
}

export function buildCategoryHeadings(categoryName?: string, subcategoryName?: string): HeadingStructure {
  const category = categoryName?.trim()
  const subcategory = subcategoryName?.trim()
  if (subcategory) {
    return {
      h1: `Shop ${subcategory} in Bangladesh`,
      h2: category ? `Popular picks in ${category}` : `Popular ${subcategory} products`,
      h3: `Best ${subcategory} prices with fast delivery`,
    }
  }
  if (category) {
    return {
      h1: `Shop ${category} in Bangladesh`,
      h2: `Popular ${category} products`,
      h3: `Best ${category} prices with fast delivery`,
    }
  }
  return {
    h1: 'Shop Products in Bangladesh',
    h2: 'Popular products across all categories',
    h3: 'Fast delivery and secure checkout',
  }
}

export function buildProductImageAlt(args: {
  productName: string
  categoryName?: string
  index?: number
  context?: 'main' | 'thumbnail' | 'card'
}): string {
  const name = args.productName.trim() || 'Product'
  const category = args.categoryName?.trim()
  const index = typeof args.index === 'number' ? args.index + 1 : undefined
  const context = args.context ? `${args.context} image` : 'image'
  const suffix = index ? ` ${index}` : ''
  const categoryText = category ? ` in ${category}` : ''
  return `${name}${categoryText} ${context}${suffix}`.trim()
}

export function buildCategoryImageAlt(categoryName: string): string {
  const name = categoryName.trim() || 'Category'
  return `${name} category image`
}
