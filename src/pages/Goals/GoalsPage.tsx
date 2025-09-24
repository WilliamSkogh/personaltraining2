import React, { useState } from 'react';
import { Container, Row, Col, Card, ProgressBar } from 'react-bootstrap';

interface Goal {
  id: number;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: string;
}

const GoalsPage: React.FC = () => {
  const [goals] = useState<Goal[]>([
    {
      id: 1,
      title: "Bänkpressa 100kg",
      targetValue: 100,
      currentValue: 85,
      unit: "kg",
      targetDate: "2024-06-01"
    }
  ]);

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Mina mål</h1>
        </Col>
      </Row>
      <Row>
        {goals.map((goal) => (
          <Col key={goal.id} md={4} className="mb-4">
            <Card>
              <Card.Header>
                <h6>{goal.title}</h6>
              </Card.Header>
              <Card.Body>
                <ProgressBar 
                  now={(goal.currentValue / goal.targetValue) * 100} 
                  label={`${goal.currentValue}/${goal.targetValue} ${goal.unit}`}
                />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default GoalsPage;