function Sidebar() {
  return (
    <aside className="min-h-screen w-64 bg-gray-800 p-4 text-white">
      <nav>
        <ul className="space-y-4">
          <li>
            <a href="/dashboard" className="block p-2 hover:bg-gray-700">
              Dashboard
            </a>
          </li>
          <li>
            <a href="/employees" className="block p-2 hover:bg-gray-700">
              Employees
            </a>
          </li>
          <li>
            <a href="/settings" className="block p-2 hover:bg-gray-700">
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
