import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WorkoutFrequency {
  period: string;
  period_start?: string;
  workouts: number;
  total_duration: number;
}

interface TopExercise {
  id: number;
  name: string;
  category: string;
  times_used: number;
  total_sets: number;
  total_reps: number;
  total_volume: number;
}

interface ExerciseProgression {
  date: string;
  workout_name: string;
  sets: number;
  reps: number;
  weight: number;
  volume: number;
}

interface VolumeProgression {
  date: string;
  name: string;
  total_volume: number;
  exercise_count: number;
}

interface Summary {
  totalWorkouts: number;
  totalDuration: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolume: number;
  favoriteExercise: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [workoutFrequency, setWorkoutFrequency] = useState<WorkoutFrequency[]>([]);
  const [topExercises, setTopExercises] = useState<TopExercise[]>([]);
  const [volumeProgression, setVolumeProgression] = useState<VolumeProgression[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [exerciseProgression, setExerciseProgression] = useState<ExerciseProgression[]>([]);
  const [frequencyPeriod, setFrequencyPeriod] = useState<'weeks' | 'months'>('weeks');

  useEffect(() => {
    if (user) {
      fetchAllStats();
    }
  }, [user, frequencyPeriod]);

  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseProgression(selectedExercise);
    }
  }, [selectedExercise]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      
      // Hämta all statistik parallellt
      const [summaryRes, frequencyRes, topExercisesRes, volumeRes] = await Promise.all([
        fetch('/api/stats/summary', { credentials: 'include' }),
        fetch(`/api/stats/workout-frequency?period=${frequencyPeriod}&limit=12`, { credentials: 'include' }),
        fetch('/api/stats/top-exercises?limit=10', { credentials: 'include' }),
        fetch('/api/stats/volume-progression?limit=20', { credentials: 'include' })
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      if (frequencyRes.ok) {
        const data = await frequencyRes.json();
        // Vänd på arrayen så äldsta visas först (vänster i grafen)
        setWorkoutFrequency(data.reverse());
      }

      if (topExercisesRes.ok) {
        const data = await topExercisesRes.json();
        setTopExercises(data);
        // Sätt första övningen som vald för progression
        if (data.length > 0 && !selectedExercise) {
          setSelectedExercise(data[0].id);
        }
      }

      if (volumeRes.ok) {
        const data = await volumeRes.json();
        setVolumeProgression(data.reverse());
      }

    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseProgression = async (exerciseId: number) => {
    try {
      const response = await fetch(`/api/stats/exercise-progression/${exerciseId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setExerciseProgression(data.reverse());
      }
    } catch (err) {
      console.error('Error fetching exercise progression:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  const formatPeriod = (period: string, periodStart?: string) => {
    if (frequencyPeriod === 'weeks') {
      return periodStart ? formatDate(periodStart) : period;
    }
    // Format months as "Jan 2025"
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short' });
  };

  if (loading) {
    return <LoadingSpinner text="Laddar dashboard..." />;
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
          <p className="text-muted">Välkommen tillbaka, {(user as any)?.Username}!</p>
        </Col>
      </Row>

      {/* Snabbstatistik */}
      {summary && (
        <Row className="mb-4">
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-primary">{summary.totalWorkouts || 0}</h3>
                <small className="text-muted">Totala pass</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-success">{Math.round((summary.totalDuration || 0) / 60)}h</h3>
                <small className="text-muted">Tränat totalt</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-warning">{summary.workoutsThisWeek || 0}</h3>
                <small className="text-muted">Denna vecka</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-info">{summary.workoutsThisMonth || 0}</h3>
                <small className="text-muted">Denna månad</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-danger">{((summary.totalVolume || 0) / 1000).toFixed(1)}t</h3>
                <small className="text-muted">Total volym</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h5 className="text-primary mb-0">💪</h5>
                <small className="text-muted">{summary.favoriteExercise || 'Ingen än'}</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Träningsfrekvens */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Träningsfrekvens</h5>
              <Form.Select 
                size="sm" 
                style={{ width: 'auto' }}
                value={frequencyPeriod}
                onChange={(e) => setFrequencyPeriod(e.target.value as 'weeks' | 'months')}
              >
                <option value="weeks">Per vecka</option>
                <option value="months">Per månad</option>
              </Form.Select>
            </Card.Header>
            <Card.Body>
              {workoutFrequency.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workoutFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={(value, index) => {
                        const item = workoutFrequency[index];
                        return formatPeriod(value, item?.period_start);
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0]) {
                          const item = payload[0].payload;
                          return formatPeriod(value as string, item.period_start);
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="workouts" fill="#0d6efd" name="Antal pass" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center py-5">Ingen data att visa ännu</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        {/* Mest använda övningar */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Top 10 Övningar</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {topExercises.length > 0 ? (
                <div className="list-group list-group-flush">
                  {topExercises.map((exercise, index) => (
                    <div 
                      key={`${exercise.id}-${exercise.name}-${index}`}
                      className="list-group-item d-flex justify-content-between align-items-start"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedExercise(exercise.id)}
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary rounded-pill">{index + 1}</span>
                          <strong>{exercise.name}</strong>
                        </div>
                        <small className="text-muted d-block mt-1">
                          {exercise.times_used || 0} pass • {exercise.total_sets || 0} sets • {(exercise.total_volume || 0).toLocaleString()} kg volym
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-5">Inga övningar ännu</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Volymprogression över tid */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Volymprogression (senaste 20 passen)</h5>
            </Card.Header>
            <Card.Body>
              {volumeProgression.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={volumeProgression}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value: string) => formatDate(value)}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value: string) => new Date(value).toLocaleDateString('sv-SE')}
                      formatter={(value: number) => [`${(value || 0).toLocaleString()} kg`, 'Volym']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total_volume" 
                      stroke="#198754" 
                      strokeWidth={2}
                      name="Total volym (kg)"
                      dot={{ fill: '#198754', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center py-5">Ingen data att visa ännu</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Övningsprogression */}
      {selectedExercise && topExercises.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Viktprogression</h5>
                <Form.Select 
                  size="sm" 
                  style={{ width: 'auto' }}
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(parseInt(e.target.value))}
                >
                  {topExercises.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </Form.Select>
              </Card.Header>
              <Card.Body>
                {exerciseProgression.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={exerciseProgression}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value: string) => formatDate(value)}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value: string) => new Date(value).toLocaleDateString('sv-SE')}
                        formatter={(value: number, name: string) => {
                          if (name === 'weight') return [`${value} kg`, 'Vikt'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#dc3545" 
                        strokeWidth={2}
                        name="Vikt (kg)"
                        dot={{ fill: '#dc3545', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted text-center py-5">Ingen viktdata för denna övning</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Snabbåtgärder */}
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Senaste aktivitet</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-4">
                <p className="text-muted mb-3">Börja träna för att se din aktivitet här!</p>
                <Link to="/workouts">
                  <Button variant="outline-primary">Se alla träningspass</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Snabbåtgärder</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/workouts/new">
                  <Button variant="primary" className="w-100">
                    🏋️ Nytt pass
                  </Button>
                </Link>
                <Link to="/exercises">
                  <Button variant="outline-secondary" className="w-100">
                    📝 Övningar
                  </Button>
                </Link>
                <Link to="/goals">
                  <Button variant="outline-success" className="w-100">
                    🎯 Mål
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