import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div>
      <header>
        <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <div className="container-fluid px-3">
            <NavLink 
              to="/" 
              className="navbar-brand text-dark text-decoration-none fw-bold"
            >
              Dashboard
            </NavLink>
            
            <div className="navbar-nav">
              <NavLink 
                to="/workouts" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'text-primary fw-bold' : 'text-dark'}`
                }
              >
                Workouts
              </NavLink>
            </div>

            <div className="ms-auto">
              <NavLink 
                to="/login" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'text-primary fw-bold' : 'text-dark'}`
                }
              >
                Login
              </NavLink>
            </div>
          </div>
        </nav>
      </header>
      
      <main className="container-fluid px-3 py-4">
        <Outlet />
      </main>
    </div>
  );
}