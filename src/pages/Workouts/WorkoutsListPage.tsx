import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SearchBar from '../../components/Common/SearchBar';

interface Workout {
  id: number;
  name: string;
  date: string;
  duration?: number;
}

const WorkoutsListPage: React.FC = () => {
  const [workouts] = useState<Workout[]>([
    {
      id: 1,
      name: "Morgonträning",
      date: "2024-01-15",
      duration: 45
    }
  ]);

  const handleSearch = (query: string) => {
    console.log('Söker:', query);
  };

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
          <SearchBar onSearch={handleSearch} placeholder="Sök träningspass..." />
        </Col>
      </Row>
      <Row>
        {workouts.map((workout) => (
          <Col key={workout.id} md={4} className="mb-4">
            <Card>
              <Card.Header>
                <h6>{workout.name}</h6>
              </Card.Header>
              <Card.Body>
                <p>Datum: {workout.date}</p>
                <p>Varaktighet: {workout.duration} min</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default WorkoutsListPage;