import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, ProgressBar, Badge, InputGroup } from 'react-bootstrap';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface Goal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate?: string;
  isCompleted: number;
  createdAt: string;
}

interface GoalFormData {
  title: string;
  description: string;
  targetValue: string;
  currentValue: string;
  unit: string;
  targetDate: string;
}

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    targetValue: '',
    currentValue: '0',
    unit: 'kg',
    targetDate: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching goals...'); // DEBUG
      
      const response = await fetch('/api/goals', {
        credentials: 'include'
      });
      
      console.log('Fetch response status:', response.status); // DEBUG
      
      if (!response.ok) {
        throw new Error('Kunde inte hämta mål');
      }
      
      const data = await response.json();
      console.log('Fetched goals:', data); // DEBUG
      console.log('Number of goals:', data.length); // DEBUG
      
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err); // DEBUG
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        targetValue: parseFloat(formData.targetValue),
        currentValue: parseFloat(formData.currentValue),
        unit: formData.unit,
        targetDate: formData.targetDate || null,
        isCompleted: 0
      };

      console.log('Submitting goal:', payload); // DEBUG

      const url = editingGoal 
        ? `/api/goals/${editingGoal.id}`
        : '/api/goals';
      
      const method = editingGoal ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status); // DEBUG
      const result = await response.json();
      console.log('Response data:', result); // DEBUG

      if (!response.ok) {
        throw new Error(result.error || 'Kunde inte spara målet');
      }

      handleCloseModal();
      await fetchGoals();
      
      // Visa success-meddelande
      console.log('Goal saved successfully!');
    } catch (err) {
      console.error('Error saving goal:', err); // DEBUG
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    }
  };

  const handleOpenModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        description: goal.description || '',
        targetValue: goal.targetValue.toString(),
        currentValue: goal.currentValue.toString(),
        unit: goal.unit,
        targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : ''
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        targetValue: '',
        currentValue: '0',
        unit: 'kg',
        targetDate: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const updateProgress = async (goalId: number, newValue: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentValue: newValue })
      });

      if (!response.ok) {
        throw new Error('Kunde inte uppdatera progress');
      }

      await fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      console.error('Error updating progress:', err);
    }
  };

  const markAsCompleted = async (goalId: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/complete`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Kunde inte markera som uppnådd');
      }

      await fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      console.error('Error completing goal:', err);
    }
  };

  const deleteGoal = async (goalId: number) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta mål?')) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Kunde inte ta bort målet');
      }

      await fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      console.error('Error deleting goal:', err);
    }
  };

  const calculateProgress = (current: number, target: number): number => {
    if (target === 0) return 0;
    const progress = (current / target) * 100;
    return Math.min(progress, 100);
  };

  const getDaysRemaining = (targetDate?: string): number | null => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getProgressVariant = (progress: number): string => {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'info';
    if (progress >= 50) return 'primary';
    if (progress >= 25) return 'warning';
    return 'danger';
  };

  const activeGoals = goals.filter(g => g.isCompleted === 0);
  const completedGoals = goals.filter(g => g.isCompleted === 1);

  if (loading) {
    return <LoadingSpinner text="Laddar mål..." />;
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mina träningsmål</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Nytt mål
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistik */}
      {goals.length > 0 && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">{goals.length}</h3>
                <p className="mb-0">Totala mål</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success">{completedGoals.length}</h3>
                <p className="mb-0">Uppnådda</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning">{activeGoals.length}</h3>
                <p className="mb-0">Pågående</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info">
                  {completedGoals.length > 0 
                    ? Math.round((completedGoals.length / goals.length) * 100) 
                    : 0}%
                </h3>
                <p className="mb-0">Genomförande</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Aktiva mål */}
      {activeGoals.length > 0 && (
        <>
          <h3 className="mb-3">Pågående mål ({activeGoals.length})</h3>
          <Row className="mb-4">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal.currentValue, goal.targetValue);
              const daysRemaining = getDaysRemaining(goal.targetDate);
              const progressVariant = getProgressVariant(progress);

              return (
                <Col key={goal.id} md={6} lg={4} className="mb-4">
                  <Card className="h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">{goal.title}</h6>
                      {daysRemaining !== null && (
                        <Badge bg={daysRemaining < 0 ? 'danger' : daysRemaining < 7 ? 'warning' : 'secondary'}>
                          {daysRemaining < 0 
                            ? `${Math.abs(daysRemaining)} dagar försenad` 
                            : `${daysRemaining} dagar kvar`}
                        </Badge>
                      )}
                    </Card.Header>
                    <Card.Body>
                      {goal.description && (
                        <p className="text-muted small mb-3">{goal.description}</p>
                      )}
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Progress</small>
                          <small><strong>{goal.currentValue} / {goal.targetValue} {goal.unit}</strong></small>
                        </div>
                        <ProgressBar 
                          now={progress} 
                          variant={progressVariant}
                          label={`${Math.round(progress)}%`}
                        />
                      </div>

                      <InputGroup size="sm" className="mb-2">
                        <Form.Control
                          type="number"
                          placeholder="Ny progress"
                          step="0.5"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              const value = parseFloat(input.value);
                              if (!isNaN(value)) {
                                updateProgress(goal.id, value);
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            const value = parseFloat(input.value);
                            if (!isNaN(value)) {
                              updateProgress(goal.id, value);
                              input.value = '';
                            }
                          }}
                        >
                          Uppdatera
                        </Button>
                      </InputGroup>

                      {goal.targetDate && (
                        <small className="text-muted d-block mb-2">
                          <strong>Mål-datum:</strong> {new Date(goal.targetDate).toLocaleDateString('sv-SE')}
                        </small>
                      )}
                    </Card.Body>
                    <Card.Footer>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => handleOpenModal(goal)}
                        >
                          Redigera
                        </Button>
                        {progress >= 100 && (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => markAsCompleted(goal.id)}
                          >
                            ✓ Markera klar
                          </Button>
                        )}
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          Ta bort
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}

      {/* Uppnådda mål */}
      {completedGoals.length > 0 && (
        <>
          <h3 className="mb-3">Uppnådda mål ({completedGoals.length}) 🎉</h3>
          <Row>
            {completedGoals.map((goal) => (
              <Col key={goal.id} md={6} lg={4} className="mb-4">
                <Card className="h-100 border-success">
                  <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">✓ {goal.title}</h6>
                    <Badge bg="light" text="success">Klar!</Badge>
                  </Card.Header>
                  <Card.Body>
                    {goal.description && (
                      <p className="text-muted small mb-3">{goal.description}</p>
                    )}
                    
                    <div className="mb-2">
                      <ProgressBar now={100} variant="success" label="100%" />
                    </div>

                    <p className="mb-0">
                      <strong>{goal.currentValue} / {goal.targetValue} {goal.unit}</strong>
                    </p>
                  </Card.Body>
                  <Card.Footer>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Ta bort
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <Alert variant="info" className="text-center">
          <h5>Inga mål ännu!</h5>
          <p className="mb-3">Sätt ditt första träningsmål för att börja spåra din progress.</p>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            Skapa ditt första mål
          </Button>
        </Alert>
      )}

      {/* Modal för skapa/redigera mål */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingGoal ? 'Redigera mål' : 'Skapa nytt mål'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Måltitel</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="t.ex. Bänkpressa 100kg"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Beskrivning (valfritt)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Varför är detta mål viktigt för dig?"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Målvärde</Form.Label>
                  <Form.Control
                    type="number"
                    name="targetValue"
                    value={formData.targetValue}
                    onChange={handleFormChange}
                    placeholder="100"
                    step="0.5"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nuvarande värde</Form.Label>
                  <Form.Control
                    type="number"
                    name="currentValue"
                    value={formData.currentValue}
                    onChange={handleFormChange}
                    placeholder="85"
                    step="0.5"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Enhet</Form.Label>
                  <Form.Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                  >
                    <option value="kg">kg</option>
                    <option value="reps">repetitioner</option>
                    <option value="km">km</option>
                    <option value="min">minuter</option>
                    <option value="pass">träningspass</option>
                    <option value="dagar">dagar</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Måldatum (valfritt)</Form.Label>
                  <Form.Control
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Avbryt
            </Button>
            <Button variant="primary" type="submit">
              {editingGoal ? 'Uppdatera' : 'Skapa mål'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default GoalsPage;