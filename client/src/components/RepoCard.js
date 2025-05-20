import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function RepoCard({ repo }) {
  const navigate = useNavigate();

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Card.Title>{repo.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{repo.full_name}</Card.Subtitle>
        <Card.Text>{repo.description || 'No description provided.'}</Card.Text>
        <Button
          variant="primary"
          onClick={() => navigate(`/repo/${repo.id}/issues`)}
          className="me-2"
        >
          View Issues
        </Button>
        <Button
          variant="success"
          onClick={() => navigate(`/repo/${repo.id}/pulls`)}
        >
          View Pulls
        </Button>
      </Card.Body>
    </Card>
  );
}

export default RepoCard;
