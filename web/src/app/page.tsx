import { ModeToggle } from "@/components/mode-toggle";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-dashboard-gray dark:bg-[#121212]">
      {/* BEGIN: LeftSidebar */}
      <aside className="nav-rail bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-6 gap-8 fixed h-full z-10 transition-colors">
        {/* Logo */}
        <div className="w-10 h-10 flex items-center justify-center orange-accent-bg rounded-xl text-white">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
        </div>

        {/* Mode Toggle Container */}
        <div className="flex flex-col gap-4 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-full transition-colors">
           <ModeToggle />
        </div>

        {/* Nav Icons */}
        <nav className="flex flex-col gap-6 mt-4">
          <button className="p-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
        </nav>
      </aside>

      <main className="flex-1 ml-20 p-8">
        {/* BEGIN: TopHeader */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="orange-accent-text font-bold text-xl">Apotek POS</span>
          </div>

          <nav className="bg-gray-100 dark:bg-gray-900 p-1 rounded-full flex gap-1 transition-colors border border-transparent dark:border-gray-800">
            <button className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-medium transition-colors">Overview</button>
            <button className="px-6 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 text-sm font-medium transition-colors">Activity</button>
            <button className="px-6 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 text-sm font-medium transition-colors">Manage</button>
          </nav>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
              <button className="p-2 text-gray-500 relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 border-2 border-white dark:border-[#121212] rounded-full"></span>
              </button>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-[#1e1e1e] p-1 pr-4 rounded-full border border-gray-100 dark:border-gray-800 card-shadow transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <div className="text-xs">
                <div className="font-bold text-gray-900 dark:text-gray-100">Admin Apoteker</div>
                <div className="text-gray-400 dark:text-gray-500">admin@apotek.com</div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </div>
          </div>
        </header>

        {/* BEGIN: Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Good morning, Admin</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Stay on top of your pharmacy inventory, monitor sales, and track status.</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Total Balance Card */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl card-shadow border border-transparent dark:border-gray-800 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Total Pendapatan</p>
                  <h2 className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">Rp 12.500.000</h2>
                  <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" fillRule="evenodd"></path></svg>
                    5% <span className="text-gray-400">than last month</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-[10px] font-bold text-gray-700 dark:text-gray-300">
                  IDR
                </div>
              </div>
              
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Outlets <span className="text-gray-400 font-normal">| Total 3</span></h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900">
                    <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1">
                      Pusat
                    </div>
                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">Rp 8.5M</div>
                    <div className="text-[9px] text-green-500 font-bold mt-1">Active</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1">
                      Cabang 1
                    </div>
                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">Rp 4.0M</div>
                    <div className="text-[9px] text-green-500 font-bold mt-1">Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="orange-accent-bg p-6 rounded-3xl text-white">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-medium opacity-80">Total Penjualan</span>
                  </div>
                  <div className="text-3xl font-bold">145 Tx</div>
                </div>
                
                <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 card-shadow transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs text-gray-500 font-medium">Pembelian</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">Rp 4.2M</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl card-shadow border border-transparent dark:border-gray-800 transition-colors">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Chart Dummy</h3>
                <div className="mt-6 flex flex-col gap-2 h-20">
                  <div className="flex-1 flex items-end gap-2 px-1">
                    <div className="flex-1 flex flex-col justify-end gap-1"><div className="bar-loss w-full h-8 rounded-sm"></div><div className="bar-profit w-full h-12 rounded-sm"></div></div>
                    <div className="flex-1 flex flex-col justify-end gap-1"><div className="bar-loss w-full h-14 rounded-sm"></div><div className="bar-profit w-full h-10 rounded-sm"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}