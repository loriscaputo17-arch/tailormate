import PublicNavbar from '@/components/layout/Header'
import PublicFooter from '@/components/layout/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="">{children}</main>
     
    </>
  )
}