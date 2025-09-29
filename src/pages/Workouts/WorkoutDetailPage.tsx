import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface Exercise {
  id: number;
  name: string;
  category: string;
}

interface WorkoutExercise {
  id: number;
  workoutId: number;
  exerciseId: number;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  orderIndex: number;
  exercise?: Exercise;
}

interface Workout {
  id: number;
  name: string;
  date: string;
  duration?: number;
  notes?: string;
  userId: number;
  createdAt: string;
}

const WorkoutDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkoutDetails();
  }, [id]);

  const fetchWorkoutDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Hämta träningspass
      const workoutResponse = await fetch(`/api/workouts/${id}`);
      if (!workoutResponse.ok) {
        throw new Error('Kunde inte hämta träningspass');
      }
      const workoutData = await workoutResponse.json();
      setWorkout(workoutData);

      // Hämta övningar för detta träningspass
      const exercisesResponse = await fetch(`/api/workout_exercises?where=workoutId=${id}&orderby=orderIndex`);
      if (exercisesResponse.ok) {
        const exercisesData = await exercisesResponse.json();
        
        // Hämta detaljer för varje övning
        const exercisesWithDetails = await Promise.all(
          exercisesData.map(async (we: WorkoutExercise) => {
            try {
              const exerciseResponse = await fetch(`/api/exercises/${we.exerciseId}`);
              if (exerciseResponse.ok) {
                const exerciseData = await exerciseResponse.json();
                return { ...we, exercise: exerciseData };
              }
            } catch (err) {
              console.warn('Could not fetch exercise details:', err);
            }
            return we;
          })
        );
        
        setExercises(exercisesWithDetails);
      }
    } catch (err: any) {
      console.error('Error fetching workout details:', err);
      setError(err.message || 'Kunde inte hämta träningspass');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async () => {
    if (!confirm('Är du säker på att du vill ta bort detta träningspass?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        navigate('/workouts');
      } else {
        throw new Error('Kunde inte ta bort träningspass');
      }
    } catch (err: any) {
      alert(err.message || 'Kunde inte ta bort träningspass');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotalVolume = () => {
    return exercises.reduce((total, ex) => {
      const weight = ex.weight || 0;
      return total + (ex.sets * ex.reps * weight);
    }, 0);
  };

  if (loading) {
    return <LoadingSpinner text="Laddar träningspass..." />;
  }

  if (error || !workout) {
    return (
      <Container>
        <Alert variant="danger">
          {error || 'Träningspass hittades inte'}
          <div className="mt-3">
            <Link to="/workouts">
              <Button variant="outline-danger">Tillbaka till träningspass</Button>
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Link to="/workouts" className="text-decoration-none mb-2 d-inline-block">
                ← Tillbaka till träningspass
              </Link>
              <h1>{workout.name}</h1>
              <p className="text-muted mb-0">{formatDate(workout.date)}</p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary"
                onClick={() => navigate(`/workouts/${id}/edit`)}
              >
                Redigera
              </Button>
              <Button 
                variant="outline-danger"
                onClick={deleteWorkout}
              >
                Ta bort
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Träningsinformation</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Datum:</strong> {formatDate(workout.date)}
                  </p>
                  {workout.duration && (
                    <p className="mb-2">
                      <strong>Varaktighet:</strong> {workout.duration} minuter
                    </p>
                  )}
                  <p className="mb-2">
                    <strong>Antal övningar:</strong> {exercises.length}
                  </p>
                </Col>
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Total volym:</strong> {calculateTotalVolume().toLocaleString('sv-SE')} kg
                  </p>
                  <p className="mb-2">
                    <strong>Totala set:</strong> {exercises.reduce((sum, ex) => sum + ex.sets, 0)}
                  </p>
                  <p className="mb-2">
                    <strong>Skapad:</strong> {new Date(workout.createdAt).toLocaleDateString('sv-SE')}
                  </p>
                </Col>
              </Row>
              {workout.notes && (
                <div className="mt-3">
                  <strong>Anteckningar:</strong>
                  <p className="mb-0 mt-1">{workout.notes}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="mb-3">Snabbstatistik</h6>
              <div className="d-flex justify-content-between mb-2">
                <span>Genomsnittlig vikt:</span>
                <strong>
                  {exercises.length > 0 
                    ? (exercises.reduce((sum, ex) => sum + (ex.weight || 0), 0) / exercises.length).toFixed(1)
                    : 0
                  } kg
                </strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Totala reps:</span>
                <strong>{exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps), 0)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Sets per övning:</span>
                <strong>
                  {exercises.length > 0 
                    ? (exercises.reduce((sum, ex) => sum + ex.sets, 0) / exercises.length).toFixed(1)
                    : 0
                  }
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Övningar ({exercises.length})</h5>
            </Card.Header>
            <Card.Body>
              {exercises.length === 0 ? (
                <p className="text-muted text-center py-4">Inga övningar registrerade för detta träningspass</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Övning</th>
                      <th>Kategori</th>
                      <th className="text-center">Sets</th>
                      <th className="text-center">Reps</th>
                      <th className="text-center">Vikt</th>
                      <th className="text-center">Volym</th>
                      <th>Anteckningar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex, index) => (
                      <tr key={ex.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{ex.exercise?.name || 'Okänd övning'}</strong>
                        </td>
                        <td>
                          {ex.exercise?.category && (
                            <Badge bg="secondary">{ex.exercise.category}</Badge>
                          )}
                        </td>
                        <td className="text-center">{ex.sets}</td>
                        <td className="text-center">{ex.reps}</td>
                        <td className="text-center">
                          {ex.weight ? `${ex.weight} kg` : '-'}
                        </td>
                        <td className="text-center">
                          {ex.weight 
                            ? `${(ex.sets * ex.reps * ex.weight).toLocaleString('sv-SE')} kg`
                            : '-'
                          }
                        </td>
                        <td>
                          {ex.notes && (
                            <small className="text-muted">{ex.notes}</small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold">
                      <td colSpan={3}>Totalt</td>
                      <td className="text-center">{exercises.reduce((sum, ex) => sum + ex.sets, 0)}</td>
                      <td className="text-center">{exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps), 0)}</td>
                      <td colSpan={2} className="text-center">{calculateTotalVolume().toLocaleString('sv-SE')} kg</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WorkoutDetailPage;