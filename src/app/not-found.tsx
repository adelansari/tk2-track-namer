
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
      <Frown className="w-24 h-24 text-primary mb-6" />
      <h2 className="text-4xl font-bold mb-4">Oops! Page Not Found</h2>
      <p className="text-muted-foreground text-lg mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Button asChild size="lg">
        <Link href="/">Return to Homepage</Link>
      </Button>
    </div>
  )
}
