import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import SearchBar from '../../components/Common/SearchBar';

interface Exercise {
  id: number;
  name: string;
  category: string;
}

const ExercisesPage: React.FC = () => {
  const [exercises] = useState<Exercise[]>([
    { id: 1, name: "Bänkpress", category: "Styrka" },
    { id: 2, name: "Squat", category: "Styrka" }
  ]);

  const handleSearch = (query: string) => {
    console.log('Söker övningar:', query);
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>Övningar</h1>
            <Button variant="primary">Ny övning</Button>
          </div>
          <SearchBar onSearch={handleSearch} placeholder="Sök övningar..." />
        </Col>
      </Row>
      <Row>
        {exercises.map((exercise) => (
          <Col key={exercise.id} md={4} className="mb-4">
            <Card>
              <Card.Header>
                <h6>{exercise.name}</h6>
              </Card.Header>
              <Card.Body>
                <p>Kategori: {exercise.category}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ExercisesPage;