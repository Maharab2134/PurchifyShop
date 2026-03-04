export default function getStatusStep(status: string): number {
  switch (status) {
    case 'DELIVERED':
      return 4
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return 3
    case 'PROCESSING':
    case 'PAID':
      return 2
    case 'PENDING':
    default:
      return 1
  }
}
