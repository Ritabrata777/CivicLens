import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'

const AdminPortalButton = () => {
  return (
    <div>
        <nav className="hidden md:flex justify-end gap-6">
            <Button size="sm" variant="ghost">
              <Link href="/admin">
              Admin Portal
              </Link>
            </Button>
          </nav>
    </div>
  )
}

export default AdminPortalButton