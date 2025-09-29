import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Modal, Alert } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/Common/SearchBar';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface Exercise {
  id: number;
  name: string;
  category: string;
  description?: string;
  isPublic: number;
  createdBy?: number;
  createdAt: string;
}

const ExercisesPage: React.FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Alla');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, selectedCategory]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/exercises?orderby=category,name');
      if (!response.ok) throw new Error('Kunde inte hämta övningar');
      
      const data = await response.json();
      setExercises(data);
      
      // Extrahera unika kategorier
      const uniqueCategories = Array.from(new Set(data.map((ex: Exercise) => ex.category))).sort();
      setCategories(['Alla', ...uniqueCategories] as string[]);
      
    } catch (err: any) {
      console.error('Error fetching exercises:', err);
      setError(err.message || 'Kunde inte hämta övningar');
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    if (selectedCategory === 'Alla') {
      setFilteredExercises(exercises);
    } else {
      setFilteredExercises(exercises.filter(ex => ex.category === selectedCategory));
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      filterExercises();
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = exercises.filter(ex => 
      ex.name.toLowerCase().includes(searchLower) ||
      ex.category.toLowerCase().includes(searchLower) ||
      (ex.description && ex.description.toLowerCase().includes(searchLower))
    );
    
    setFilteredExercises(filtered);
  };

  const handleShowModal = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name,
        category: exercise.category,
        description: exercise.description || ''
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: '',
        category: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExercise(null);
    setFormData({ name: '', category: '', description: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userId = (user as any)?.Id;
      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        isPublic: 0,
        createdBy: userId
      };

      if (editingExercise) {
        // Uppdatera befintlig övning
        const response = await fetch(`/api/exercises/${editingExercise.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Kunde inte uppdatera övning');
        
      } else {
        // Skapa ny övning
        const response = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Kunde inte skapa övning');
      }

      handleCloseModal();
      fetchExercises();
      
    } catch (err: any) {
      alert(err.message || 'Ett fel uppstod');
    }
  };

  const handleDelete = async (exerciseId: number) => {
    if (!confirm('Är du säker på att du vill ta bort denna övning?')) {
      return;
    }

    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Kunde inte ta bort övning');
      
      fetchExercises();
    } catch (err: any) {
      alert(err.message || 'Kunde inte ta bort övning');
    }
  };

  const isUserExercise = (exercise: Exercise) => {
    const userId = (user as any)?.Id;
    return exercise.createdBy === userId;
  };

  if (loading) {
    return <LoadingSpinner text="Laddar övningar..." />;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>Övningar</h1>
            <Button variant="primary" onClick={() => handleShowModal()}>
              Ny övning
            </Button>
          </div>
          <SearchBar onSearch={handleSearch} placeholder="Sök övningar..." />
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <div className="d-flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <p className="text-muted">
            Visar {filteredExercises.length} av {exercises.length} övningar
          </p>
        </Col>
      </Row>

      <Row>
        {filteredExercises.length === 0 ? (
          <Col>
            <Card className="text-center p-4">
              <Card.Body>
                <h5>Inga övningar funna</h5>
                <p className="text-muted mb-3">
                  {selectedCategory === 'Alla' 
                    ? 'Du har inga övningar ännu.'
                    : `Inga övningar i kategorin "${selectedCategory}".`
                  }
                </p>
                <Button variant="primary" onClick={() => handleShowModal()}>
                  Skapa din första övning
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filteredExercises.map((exercise) => (
            <Col key={exercise.id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="mb-0">{exercise.name}</h6>
                    {exercise.isPublic === 1 && (
                      <Badge bg="info" pill>Standard</Badge>
                    )}
                    {isUserExercise(exercise) && (
                      <Badge bg="success" pill>Min</Badge>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <Badge bg="secondary">{exercise.category}</Badge>
                  </div>
                  {exercise.description && (
                    <p className="mb-2 text-muted small">{exercise.description}</p>
                  )}
                  <small className="text-muted">
                    Skapad: {new Date(exercise.createdAt).toLocaleDateString('sv-SE')}
                  </small>
                </Card.Body>
                {isUserExercise(exercise) && (
                  <Card.Footer>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => handleShowModal(exercise)}
                      >
                        Redigera
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(exercise.id)}
                      >
                        Ta bort
                      </Button>
                    </div>
                  </Card.Footer>
                )}
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Modal för att skapa/redigera övning */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingExercise ? 'Redigera övning' : 'Skapa ny övning'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Namn</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="t.ex. Bänkpress, Squat..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Control
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="t.ex. Styrka, Kondition, Core..."
                required
                list="categories-list"
              />
              <datalist id="categories-list">
                {categories.filter(c => c !== 'Alla').map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Beskrivning (valfri)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Beskrivning av övningen..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Avbryt
            </Button>
            <Button variant="primary" type="submit">
              {editingExercise ? 'Uppdatera' : 'Skapa'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ExercisesPage;