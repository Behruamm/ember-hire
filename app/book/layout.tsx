import EmberHeader from '@/components/layout/EmberHeader'
import BookingProgressLine from '@/components/booking/BookingProgressLine'
import BookingStepLabel from '@/components/booking/BookingStepLabel'
import { BookingProvider } from '@/context/BookingContext'

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookingProvider>
      <EmberHeader progressLine={<BookingProgressLine />} />
      <main className="flex-1 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <BookingStepLabel />
          {children}
        </div>
      </main>
    </BookingProvider>
  )
}
