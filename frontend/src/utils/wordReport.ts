/**
 * Generate Word (.docx) reports with a professional template
 * (title, section header, info fields, bordered table, total row)
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
} from 'docx'

const CURRENCY = '৳'

const borderOpt = { style: BorderStyle.SINGLE as const, size: 4, color: '000000' }
const tableBorder = {
  top: borderOpt,
  bottom: borderOpt,
  left: borderOpt,
  right: borderOpt,
  insideHorizontal: borderOpt,
  insideVertical: borderOpt,
}
const cellBorders = { top: borderOpt, bottom: borderOpt, left: borderOpt, right: borderOpt }

function cell(text: string, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 22 })],
      }),
    ],
    borders: cellBorders,
  })
}

function headerRow(labels: string[]) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l) => cell(l, true)),
  })
}

function dataRow(values: string[]) {
  return new TableRow({
    children: values.map((v) => cell(v)),
  })
}

export async function createSalesReportDocx(data: {
  ordersTotal: number
  ordersCount: number
  refundedOrdersTotal?: number
  refundedOrdersCount?: number
  salesPerDay?: Array<{ date: string; sales: number }>
  mostSoldProducts?: Array<{ productName: string; totalQuantity: number }>
  popularCustomers?: Array<{ name: string; email: string; orderCount: number; totalSpent: number }>
}): Promise<Blob> {
  const dateStr = new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: 'SALES LIST EXPENSE REPORT', bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '**** LIMITED SALE LIST ****', bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Report date: ', bold: true }),
        new TextRun({ text: dateStr }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Total Revenue (PAID): ', bold: true }),
        new TextRun({ text: `${CURRENCY}${(data.ordersTotal ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Total Orders: ', bold: true }),
        new TextRun({ text: String(data.ordersCount ?? 0) }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Refunded Amount: ', bold: true }),
        new TextRun({ text: `${CURRENCY}${(data.refundedOrdersTotal ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` }),
      ],
      spacing: { after: 200 },
    }),
  ]

  const salesPerDay = data.salesPerDay ?? []
  if (salesPerDay.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Sales per day', bold: true, size: 26 })],
        spacing: { before: 160, after: 120 },
      })
    )
    const totalSales = salesPerDay.reduce((s, r) => s + r.sales, 0)
    const rows = [
      headerRow(['Date', 'Sales (৳)', 'Amount']),
      ...salesPerDay.map((r) =>
        dataRow([
          r.date,
          r.sales.toLocaleString('en-BD', { minimumFractionDigits: 2 }),
          `${CURRENCY}${r.sales.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`,
        ])
      ),
      new TableRow({
        children: [
          cell('Total Amount', true),
          cell(totalSales.toLocaleString('en-BD', { minimumFractionDigits: 2 }), true),
          cell(`${CURRENCY}${totalSales.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, true),
        ],
        tableHeader: false,
      }),
    ]
    children.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorder,
      })
    )
  }

  const mostSold = data.mostSoldProducts ?? []
  if (mostSold.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Most sold products', bold: true, size: 26 })],
        spacing: { before: 240, after: 120 },
      })
    )
    const rows = [
      headerRow(['Product Specification', 'Quantity']),
      ...mostSold.map((r) => dataRow([r.productName, String(r.totalQuantity)])),
    ]
    children.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorder,
      })
    )
  }

  const popular = data.popularCustomers ?? []
  if (popular.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Popular customers', bold: true, size: 26 })],
        spacing: { before: 240, after: 120 },
      })
    )
    const rows = [
      headerRow(['Name', 'Email', 'Order Count', 'Total Spent (৳)']),
      ...popular.map((r) =>
        dataRow([
          r.name,
          r.email,
          String(r.orderCount),
          r.totalSpent.toLocaleString('en-BD', { minimumFractionDigits: 2 }),
        ])
      ),
    ]
    children.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorder,
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...children,
          new Paragraph({ text: '', spacing: { after: 200 } }),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}

export async function createProductsReportDocx(products: Array<{
  name: string
  slug: string
  category?: { name: string } | null
  status: string
  discountedPrice: number
  totalStock: number
  variantCount?: number
}>): Promise<Blob> {
  const dateStr = new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
  const rows = [
    headerRow(['Product Specification', 'Slug', 'Category', 'Quantity', 'Unit price', 'Amount', 'Remark']),
    ...products.map((p) =>
      dataRow([
        p.name,
        p.slug,
        p.category?.name ?? '—',
        String(p.totalStock),
        p.discountedPrice.toLocaleString('en-BD', { minimumFractionDigits: 2 }),
        `${CURRENCY}${(p.discountedPrice * p.totalStock).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`,
        p.status,
      ])
    ),
  ]
  const totalAmount = products.reduce((s, p) => s + p.discountedPrice * p.totalStock, 0)
  rows.push(
    new TableRow({
      children: [
        cell('Total Amount', true),
        cell('', false),
        cell('', false),
        cell('', false),
        cell('', false),
        cell(`${CURRENCY}${totalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, true),
        cell('', false),
      ],
    })
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'PRODUCTS REPORT', bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [new TextRun({ text: '**** PRODUCT LIST ****', bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Report date: ', bold: true }), new TextRun({ text: dateStr })],
            spacing: { after: 200 },
          }),
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
          }),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}

export async function createUsersReportDocx(users: Array<{
  name: string
  email: string
  role: string
  createdAt?: string
}>): Promise<Blob> {
  const dateStr = new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
  const rows = [
    headerRow(['Name', 'Email', 'Role', 'Valid until']),
    ...users.map((u) =>
      dataRow([
        u.name,
        u.email,
        u.role,
        u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-BD') : '—',
      ])
    ),
    new TableRow({
      children: [
        cell(`Total: ${users.length} users`, true),
        cell('', false),
        cell('', false),
        cell('', false),
      ],
    }),
  ]

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'USERS REPORT', bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [new TextRun({ text: '**** USER LIST ****', bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Report date: ', bold: true }), new TextRun({ text: dateStr })],
            spacing: { after: 200 },
          }),
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
          }),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
