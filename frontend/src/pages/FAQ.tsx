import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ArrowLeft, ChevronDown } from 'lucide-react'
import MainLayout from '@/components/templates/MainLayout'
import { pagesApi } from '@/api/pages'

type FAQItem = { question: string; answer: string }

export default function FAQ() {
  const [title, setTitle] = useState<string>('FAQ')
  const [description, setDescription] = useState<string | null>(null)
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    pagesApi
      .getBySlug('faq')
      .then((res) => {
        const page = res.data.data?.page
        if (!page) {
          setItems([])
          return
        }
        setTitle(page.title || 'FAQ')
        setDescription(page.description || null)
        if (page.content?.trim()) {
          try {
            const parsed = JSON.parse(page.content) as FAQItem[]
            const list = Array.isArray(parsed)
              ? parsed.filter((x) => x && (x.question?.trim() || x.answer?.trim()))
              : []
            setItems(list)
            setOpenIndex(list.length > 0 ? 0 : null)
          } catch {
            setItems([])
          }
        } else {
          setItems([])
        }
      })
      .catch(() => {
        setError('FAQ not available')
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/80 to-gray-50 dark:from-gray-900 dark:to-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>

          {loading && (
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-48" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-md" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <HelpCircle className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={56} />
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">FAQ not available</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Create a page with slug <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">faq</code> in Admin → Pages to show FAQ here.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                <ArrowLeft size={18} />
                Go to Home
              </Link>
            </div>
          )}

          {!loading && !error && (
            <>
              <header className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mb-6">
                  <HelpCircle size={32} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {title.replace(/<[^>]*>/g, '').trim() || 'FAQ'}
                </h1>
                {description && (
                  <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-lg">
                    {description.replace(/<[^>]*>/g, '').trim()}
                  </p>
                )}
              </header>

              {items.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">No questions added yet. Add FAQ items in Admin → Pages (FAQ page).</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const isOpen = openIndex === index
                    const hasAnswer = !!item.answer?.trim()
                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenIndex(isOpen ? null : index)}
                          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset rounded-xl"
                        >
                          <span className="font-semibold text-gray-900 dark:text-gray-100 pr-2">
                            {item.question?.trim() || 'Question'}
                          </span>
                          <span
                            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-transform duration-200 ${
                              isOpen ? 'bg-indigo-100 dark:bg-indigo-900/40 rotate-180' : 'bg-gray-100 dark:bg-gray-700'
                            }`}
                          >
                            <ChevronDown size={20} />
                          </span>
                        </button>
                        {hasAnswer && (
                          <div
                            className={`grid transition-all duration-200 ease-out ${
                              isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="px-5 pb-5 pt-0">
                                <div className="pl-0 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {item.answer.trim()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
