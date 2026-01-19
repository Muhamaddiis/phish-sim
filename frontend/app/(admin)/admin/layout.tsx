import { Sidebar } from '@/components/Sidebar'
import React from 'react'

const layout = ({children}: {children: React.ReactNode}) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-slate-50 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default layout