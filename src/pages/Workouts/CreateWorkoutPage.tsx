import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const CreateWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    notes: ''
  });
  const [exercises, setExercises] = useState([
    { name: '', sets: 1, reps: 1, weight: '' }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleExerciseChange = (index: number, field: string, value: string | number) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
  };

  const addExercise = () => {
    setExercises(prev => [...prev, { name: '', sets: 1, reps: 1, weight: '' }]);
  };

  const removeExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // FIX: Använd user.Id istället för user.id (PascalCase)
    const userId = (user as any)?.Id;
    console.log('User object:', user);
    console.log('User ID:', userId);
    
    const workoutPayload = {
      name: formData.name,
      date: formData.date,
      duration: formData.duration ? parseInt(formData.duration) : null,
      notes: formData.notes,
      userId: userId
    };
    
    console.log('Workout payload:', workoutPayload);

    try {
      // Skapa träningspass i backend
      const workoutResponse = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutPayload)
      });

      console.log('Response status:', workoutResponse.status);
      const responseText = await workoutResponse.text();
      console.log('Response text:', responseText);

      if (!workoutResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        throw new Error(errorData.error || 'Kunde inte skapa träningspass');
      }

      const workout = JSON.parse(responseText);
      console.log('Created workout:', workout);
      const workoutId = workout.insertId || workout.id;

      // Lägg till övningar till träningspasset
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        if (exercise.name.trim()) {
          // Först, skapa övningen om den inte finns
          let exerciseId = null;
          
          // Försök hitta befintlig övning
          try {
            const existingExercisesResponse = await fetch(`/api/exercises?where=name=${encodeURIComponent(exercise.name)}`);
            if (existingExercisesResponse.ok) {
              const existingExercises = await existingExercisesResponse.json();
              if (existingExercises.length > 0) {
                exerciseId = existingExercises[0].id || existingExercises[0].Id;
              }
            }
          } catch (err) {
            console.warn('Could not fetch existing exercises:', err);
          }

          // Om övningen inte finns, skapa den
          if (!exerciseId) {
            const exerciseResponse = await fetch('/api/exercises', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: exercise.name,
                category: 'Användardefinierad',
                isPublic: 0,
                createdBy: userId
              })
            });

            if (exerciseResponse.ok) {
              const newExercise = await exerciseResponse.json();
              exerciseId = newExercise.insertId || newExercise.id || newExercise.Id;
            }
          }

          // Lägg till övningen till träningspasset
          if (exerciseId) {
            await fetch('/api/workout_exercises', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                workoutId: workoutId,
                exerciseId: exerciseId,
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight ? parseFloat(exercise.weight) : null,
                orderIndex: i
              })
            });
          }
        }
      }
      
      navigate('/workouts');
    } catch (err: any) {
      console.error('Error creating workout:', err);
      setError(err.message || 'Kunde inte skapa träningspass');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header>
              <h2>Skapa nytt träningspass</h2>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Namn på träningspass</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="t.ex. Morgonträning, Benträning..."
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Datum</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Varaktighet (minuter)</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="45"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Anteckningar</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Hur kändes träningen? Något att komma ihåg till nästa gång?"
                  />
                </Form.Group>

                <h5 className="mb-3">Övningar</h5>
                {exercises.map((exercise, index) => (
                  <Card key={index} className="mb-3">
                    <Card.Body>
                      <Row className="align-items-end">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Övning</Form.Label>
                            <Form.Control
                              type="text"
                              value={exercise.name}
                              onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                              placeholder="t.ex. Bänkpress, Squat..."
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group>
                            <Form.Label>Set</Form.Label>
                            <Form.Control
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group>
                            <Form.Label>Reps</Form.Label>
                            <Form.Control
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={1}>
                          <Form.Group>
                            <Form.Label>Vikt</Form.Label>
                            <Form.Control
                              type="number"
                              value={exercise.weight}
                              onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                              placeholder="kg"
                              step="0.5"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={1}>
                          {exercises.length > 1 && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => removeExercise(index)}
                            >
                              ×
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}

                <Button variant="outline-secondary" onClick={addExercise} className="mb-3">
                  + Lägg till övning
                </Button>

                <div className="d-flex gap-2">
                  <Button variant="secondary" onClick={() => navigate('/workouts')}>
                    Avbryt
                  </Button>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Sparar...' : 'Spara träningspass'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateWorkoutPage;