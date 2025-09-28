import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/Common/SearchBar';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface Workout {
  id: number;
  name: string;
  date: string;
  duration?: number;
  notes?: string;
  userId: number;
  createdAt: string;
}

const WorkoutsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Hämta alla träningspass för inloggad användare
      const userId = (user as any)?.Id;
      const response = await fetch(`/api/workouts?where=userId=${userId}&orderby=-date`);
      
      if (!response.ok) {
        throw new Error('Kunde inte hämta träningspass');
      }
      
      const data = await response.json();
      console.log('Fetched workouts:', data);
      setWorkouts(data);
    } catch (err: any) {
      console.error('Error fetching workouts:', err);
      setError(err.message || 'Kunde inte hämta träningspass');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Om ingen sökning, hämta alla träningspass igen
      fetchWorkouts();
      return;
    }

    try {
      setLoading(true);
      const userId = (user as any)?.Id;
      const response = await fetch(`/api/workouts?where=userId=${userId}_AND_name_LIKE_${encodeURIComponent('%' + query + '%')}&orderby=-date`);
      
      if (response.ok) {
        const data = await response.json();
        setWorkouts(data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (workoutId: number) => {
    if (!confirm('Är du säker på att du vill ta bort detta träningspass?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Ta bort från listan lokalt
        setWorkouts(prev => prev.filter(w => w.id !== workoutId));
      } else {
        throw new Error('Kunde inte ta bort träningspass');
      }
    } catch (err: any) {
      alert(err.message || 'Kunde inte ta bort träningspass');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  if (loading) {
    return <LoadingSpinner text="Laddar träningspass..." />;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>Mina träningspass</h1>
            <Link to="/workouts/new">
              <Button variant="primary">Nytt pass</Button>
            </Link>
          </div>
          <SearchBar 
            onSearch={handleSearch} 
            placeholder="Sök träningspass..." 
          />
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="ms-2"
            onClick={fetchWorkouts}
          >
            Försök igen
          </Button>
        </Alert>
      )}

      <Row>
        {workouts.length === 0 ? (
          <Col>
            <Card className="text-center p-4">
              <Card.Body>
                <h5>Inga träningspass funna</h5>
                <p className="text-muted mb-3">
                  {searchQuery 
                    ? `Inga träningspass matchade "${searchQuery}"`
                    : 'Du har inte skapat några träningspass än.'
                  }
                </p>
                {!searchQuery && (
                  <Link to="/workouts/new">
                    <Button variant="primary">Skapa ditt första träningspass</Button>
                  </Link>
                )}
                {searchQuery && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setSearchQuery('');
                      fetchWorkouts();
                    }}
                  >
                    Visa alla träningspass
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        ) : (
          workouts.map((workout) => (
            <Col key={workout.id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{workout.name}</h6>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => deleteWorkout(workout.id)}
                    title="Ta bort träningspass"
                  >
                    ×
                  </Button>
                </Card.Header>
                <Card.Body>
                  <p className="mb-2">
                    <strong>Datum:</strong> {formatDate(workout.date)}
                  </p>
                  {workout.duration && (
                    <p className="mb-2">
                      <strong>Varaktighet:</strong> {workout.duration} min
                    </p>
                  )}
                  {workout.notes && (
                    <p className="mb-2">
                      <strong>Anteckningar:</strong> {workout.notes}
                    </p>
                  )}
                  <small className="text-muted">
                    Skapad: {formatDate(workout.createdAt)}
                  </small>
                </Card.Body>
                <Card.Footer>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate(`/workouts/${workout.id}`)}
                    >
                      Visa detaljer
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => navigate(`/workouts/${workout.id}/edit`)}
                    >
                      Redigera
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default WorkoutsListPage;