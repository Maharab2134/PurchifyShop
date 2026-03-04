const CURRENCY_SYMBOL = '৳' // Bangladeshi Taka

const useFormatPrice = () => {
  const formatPrice = (amount: number) => {
    return `${CURRENCY_SYMBOL}${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return formatPrice
}

export default useFormatPrice
export { CURRENCY_SYMBOL }
