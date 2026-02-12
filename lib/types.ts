export type UserRole = 'owner' | 'staff' | 'admin'

export type Customer = {
  id: string
  name: string
  email?: string
  phone?: string
  city?: string
}
