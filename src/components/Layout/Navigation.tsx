import React, { useState } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Navigera ändå eftersom vi rensade lokal state
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Visa inte navbar på login/register sidor
  if (!isAuthenticated || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard">
          Träningsdagbok
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/workouts">
              Träningspass
            </Nav.Link>
            <Nav.Link as={Link} to="/exercises">
              Övningar
            </Nav.Link>
            <Nav.Link as={Link} to="/goals">
              Mål
            </Nav.Link>
          </Nav>
          
          <Nav>
            <NavDropdown title={`Hej, ${(user as any)?.Username}`} id="user-dropdown">
              <NavDropdown.Item as={Link} to="/profile">
                Min profil
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/settings">
                Inställningar
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as="button" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Loggar ut...' : 'Logga ut'}
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;