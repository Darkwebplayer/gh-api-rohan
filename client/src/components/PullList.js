import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Container, ListGroup, Button } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

function PullList() {
  const { id } = useParams();
  const [pulls, setPulls] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/repo/${id}/pull`, { withCredentials: true })
      .then(res => setPulls(res.data))
      .catch(err => console.error(err));
  }, [id]);

  return (
    <Container className="my-5 p-4 shadow rounded bg-white">
    <h3 className="mb-4 text-primary fw-bold border-bottom pb-2">
      <i className="bi bi-git pull-request me-2"></i>Open Pull Requests
    </h3>
      <ListGroup>
        {pulls.map(pr => (
          <ListGroup.Item key={pr.id}>
            <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
              {pr.title}
            </a>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <div className="mt-4 text-end">
        <Button variant="outline-primary" size="md" as={Link} to="/dashboard">
          <i className="bi bi-arrow-left-circle me-2"></i>
          Back to Dashboard
        </Button>
      </div>
    </Container>
  );
}

export default PullList;
