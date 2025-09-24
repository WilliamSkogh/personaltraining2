import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const CreateWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
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

    try {
      // Here you would normally call your API
      console.log('Creating workout:', { ...formData, exercises });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate('/workouts');
    } catch (err) {
      setError('Kunde inte skapa träningspass');
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