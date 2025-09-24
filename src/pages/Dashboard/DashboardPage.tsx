import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useStats } from '../../hooks/useStats';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const { stats, loading: statsLoading } = useStats();

  const recentWorkouts = workouts.slice(0, 3);

  if (workoutsLoading || statsLoading) {
    return <LoadingSpinner text="Laddar dashboard..." />;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Välkommen, {user?.username}!</h1>
          <p className="text-muted">Här är en översikt av din träning</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-primary">{stats?.totalWorkouts || 0}</h3>
              <p>Totala träningspass</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-success">{Math.round((stats?.totalDuration || 0) / 60)}h</h3>
              <p>Total träningstid</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-warning">
                {stats?.weeklyProgress?.[0]?.workouts || 0}
              </h3>
              <p>Pass denna vecka</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-info">💪</h3>
              <p>Favorit: {stats?.favoriteExercise || 'Ingen än'}</p>
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
                          {new Date(workout.date).toLocaleDateString('sv-SE')} • 
                          {workout.exercises?.length || 0} övningar
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
                    🏋️ Nytt träningspass
                  </Button>
                </Link>
                <Link to="/exercises">
                  <Button variant="outline-secondary" className="w-100">
                    📝 Hantera övningar
                  </Button>
                </Link>
                <Link to="/goals">
                  <Button variant="outline-success" className="w-100">
                    🎯 Visa mål
                  </Button>
                </Link>
                <Link to="/stats">
                  <Button variant="outline-info" className="w-100">
                    📊 Statistik
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;