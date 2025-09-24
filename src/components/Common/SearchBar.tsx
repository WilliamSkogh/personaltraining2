// src/components/Common/SearchBar.tsx
import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Sök...", className = "" }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <Form onSubmit={handleSubmit} className={className}>
      <InputGroup>
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="outline-secondary" type="submit">
          Sök
        </Button>
      </InputGroup>
    </Form>
  );
};

export default SearchBar;