import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface User {
  Id: number;
  Email: string;
  Username: string;
  Role: string;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  description: string;
  isPublic: number;
  createdBy: number | null;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
    fetchExercises();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Kunde inte hämta användare');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Kunde inte hämta övningar');
      }

      const data = await response.json();
      setExercises(data);
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod vid hämtning av övningar');
    }
  };

  const toggleUserRole = async (userId: number, currentRole: string) => {
    try {
      setError('');
      setSuccessMessage('');

      const newRole = currentRole === 'admin' ? 'user' : 'admin';

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ Role: newRole })
      });

      if (!response.ok) {
        throw new Error('Kunde inte uppdatera användarroll');
      }

      setSuccessMessage(`Användarroll uppdaterad till ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod');
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Är du säker på att du vill ta bort användaren "${username}"? Detta går inte att ångra.`)) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Kunde inte ta bort användare');
      }

      setSuccessMessage(`Användare "${username}" har tagits bort`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod');
    }
  };

  const deleteExercise = async (exerciseId: number, exerciseName: string) => {
    if (!window.confirm(`Är du säker på att du vill ta bort övningen "${exerciseName}"? Detta går inte att ångra.`)) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        if (data.error && data.error.includes('FOREIGN KEY')) {
          throw new Error(`Övningen "${exerciseName}" används i träningspass och kan inte tas bort. Ta bort alla träningspass som använder övningen först.`);
        }
        throw new Error(data.error || 'Kunde inte ta bort övning');
      }

      setSuccessMessage(`Övning "${exerciseName}" har tagits bort`);
      fetchExercises();
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod');
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Laddar...</span>
        </Spinner>
      </Container>
    );
  }

  const userDefinedExercises = exercises.filter(ex => ex.createdBy !== null);
  const standardExercises = exercises.filter(ex => ex.createdBy === null);

  return (
    <Container>
      <Card>
        <Card.Header>
          <h2>Adminpanel</h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {successMessage && (
            <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'users')} className="mb-3">
            <Tab eventKey="users" title={`Användare (${users.length})`}>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Användarnamn</th>
                    <th>E-post</th>
                    <th>Roll</th>
                    <th>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.Id}>
                      <td>{user.Id}</td>
                      <td>{user.Username}</td>
                      <td>{user.Email}</td>
                      <td>
                        <Badge bg={user.Role === 'admin' ? 'danger' : 'secondary'}>
                          {user.Role === 'admin' ? 'Admin' : 'Användare'}
                        </Badge>
                      </td>
                      <td>
                        {currentUser?.Id !== user.Id ? (
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant={user.Role === 'admin' ? 'warning' : 'success'}
                              onClick={() => toggleUserRole(user.Id, user.Role)}
                            >
                              {user.Role === 'admin' ? 'Ta bort admin' : 'Gör till admin'}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteUser(user.Id, user.Username)}
                            >
                              Ta bort
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted">Det är du</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {users.length === 0 && (
                <div className="text-center text-muted mt-3">
                  Inga användare hittades
                </div>
              )}
            </Tab>

            <Tab eventKey="exercises" title={`Övningar (${userDefinedExercises.length} användardef.)`}>
              <h5 className="mb-3">Användardefinierade övningar ({userDefinedExercises.length})</h5>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Namn</th>
                    <th>Kategori</th>
                    <th>Skapad av (ID)</th>
                    <th>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {userDefinedExercises.map((exercise) => (
                    <tr key={exercise.id}>
                      <td>{exercise.id}</td>
                      <td>{exercise.name}</td>
                      <td>
                        <Badge bg="info">{exercise.category}</Badge>
                      </td>
                      <td>{exercise.createdBy}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteExercise(exercise.id, exercise.name)}
                        >
                          Ta bort
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {userDefinedExercises.length === 0 && (
                <div className="text-center text-muted mt-3 mb-4">
                  Inga användardefinierade övningar hittades
                </div>
              )}

              <hr />

              <h5 className="mb-3">Standardövningar ({standardExercises.length})</h5>
              <p className="text-muted">Dessa är systemövningar och kan inte tas bort.</p>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Namn</th>
                    <th>Kategori</th>
                    <th>Beskrivning</th>
                  </tr>
                </thead>
                <tbody>
                  {standardExercises.slice(0, 10).map((exercise) => (
                    <tr key={exercise.id}>
                      <td>{exercise.id}</td>
                      <td>{exercise.name}</td>
                      <td>
                        <Badge bg="success">{exercise.category}</Badge>
                      </td>
                      <td>{exercise.description}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {standardExercises.length > 10 && (
                <p className="text-muted text-center">
                  ... och {standardExercises.length - 10} till
                </p>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminPanel;