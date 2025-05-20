import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Container, ListGroup, Button } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';



function IssueList() {
  const { id } = useParams();
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/repo/${id}/issues`, { withCredentials: true })
      .then(res => setIssues(res.data))
      .catch(err => console.error(err));
  }, [id]);

  return (
    <Container className="my-5 p-4 shadow rounded bg-white">
      <h3 className="mb-4 text-primary fw-bold border-bottom pb-2">
        <i className="bi bi-exclamation-circle me-2"></i>Open Issues
      </h3>
      <ListGroup>
        {issues
        .filter(issue => !issue.pull_request) // Filter out pull requests
        .map(issue => (
          <ListGroup.Item key={issue.id}>
            <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
              {issue.title}
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

export default IssueList;
