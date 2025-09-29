import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface Workout {
  id: number;
  name: string;
  date: string;
  duration?: number;
  notes?: string;
  createdAt: string;
}

interface WorkoutExercise {
  id: number;
  workoutId: number;
  sets: number;
  reps: number;
  weight?: number;
}

interface Stats {
  totalWorkouts: number;
  totalDuration: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalWorkouts: 0,
    totalDuration: 0,
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
    totalSets: 0,
    totalReps: 0,
    totalVolume: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = (user as any)?.Id;

      // Hämta alla träningspass för användaren
      const workoutsResponse = await fetch(`/api/workouts?where=userId=${userId}&orderby=-date`);
      if (!workoutsResponse.ok) throw new Error('Kunde inte hämta träningspass');
      const workoutsData = await workoutsResponse.json();
      setWorkouts(workoutsData);

      // Hämta alla workout_exercises för statistik
      const allExercises: WorkoutExercise[] = [];
      for (const workout of workoutsData) {
        try {
          const exercisesResponse = await fetch(`/api/workout_exercises?where=workoutId=${workout.id}`);
          if (exercisesResponse.ok) {
            const exercisesData = await exercisesResponse.json();
            allExercises.push(...exercisesData);
          }
        } catch (err) {
          console.warn('Could not fetch exercises for workout:', workout.id);
        }
      }

      // Beräkna statistik
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

      const calculatedStats: Stats = {
        totalWorkouts: workoutsData.length,
        totalDuration: workoutsData.reduce((sum: number, w: Workout) => sum + (w.duration || 0), 0),
        workoutsThisWeek: workoutsData.filter((w: Workout) => new Date(w.date) >= weekAgo).length,
        workoutsThisMonth: workoutsData.filter((w: Workout) => new Date(w.date) >= monthAgo).length,
        totalSets: allExercises.reduce((sum, ex) => sum + ex.sets, 0),
        totalReps: allExercises.reduce((sum, ex) => sum + (ex.sets * ex.reps), 0),
        totalVolume: allExercises.reduce((sum, ex) => sum + (ex.sets * ex.reps * (ex.weight || 0)), 0)
      };

      setStats(calculatedStats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const recentWorkouts = workouts.slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  if (loading) {
    return <LoadingSpinner text="Laddar dashboard..." />;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Välkommen, {(user as any)?.Username}!</h1>
          <p className="text-muted">Här är en översikt av din träning</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-primary">{stats.totalWorkouts}</h3>
              <p className="mb-0">Totala träningspass</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-success">{Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m</h3>
              <p className="mb-0">Total träningstid</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-warning">{stats.workoutsThisWeek}</h3>
              <p className="mb-0">Pass denna vecka</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-info">{stats.workoutsThisMonth}</h3>
              <p className="mb-0">Pass denna månad</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-primary">{stats.totalSets}</h4>
              <p className="mb-0">Totala sets</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-success">{stats.totalReps.toLocaleString('sv-SE')}</h4>
              <p className="mb-0">Totala repetitioner</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h4 className="text-danger">{stats.totalVolume.toLocaleString('sv-SE')} kg</h4>
              <p className="mb-0">Total volym lyft</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Senaste träningspass</h5>
              <Link to="/workouts">
                <Button variant="outline-primary" size="sm">Se alla</Button>
              </Link>
            </Card.Header>
            <Card.Body>
              {recentWorkouts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">Inga träningspass än</p>
                  <Link to="/workouts/new">
                    <Button variant="primary">Skapa ditt första pass</Button>
                  </Link>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentWorkouts.map((workout) => (
                    <div key={workout.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{workout.name}</h6>
                        <small className="text-muted">
                          {formatDate(workout.date)}
                          {workout.duration && ` • ${workout.duration} min`}
                        </small>
                      </div>
                      <Link to={`/workouts/${workout.id}`}>
                        <Button variant="outline-primary" size="sm">Visa</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5>Snabbåtgärder</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/workouts/new">
                  <Button variant="primary" className="w-100">
                    Nytt träningspass
                  </Button>
                </Link>
                <Link to="/exercises">
                  <Button variant="outline-secondary" className="w-100">
                    Hantera övningar
                  </Button>
                </Link>
                <Link to="/goals">
                  <Button variant="outline-success" className="w-100">
                    Visa mål
                  </Button>
                </Link>
                <Link to="/workouts">
                  <Button variant="outline-info" className="w-100">
                    Alla träningspass
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>

          {stats.totalWorkouts > 0 && (
            <Card className="mt-3">
              <Card.Header>
                <h6>Genomsnitt per pass</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Varaktighet:</span>
                  <strong>{Math.round(stats.totalDuration / stats.totalWorkouts)} min</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Sets:</span>
                  <strong>{(stats.totalSets / stats.totalWorkouts).toFixed(1)}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Volym:</span>
                  <strong>{(stats.totalVolume / stats.totalWorkouts).toLocaleString('sv-SE', {maximumFractionDigits: 0})} kg</strong>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;