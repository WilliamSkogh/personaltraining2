import React, { useState } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';

const ExportButton: React.FC = () => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(true);
      
      const response = await fetch(`/api/export/workouts/${format}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Kunde inte exportera data');
      }

      // Skapa blob från response
      const blob = await response.blob();
      
      // Skapa download-länk
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Hämta filnamn från Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `training-data-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Export error:', err);
      alert('Kunde inte exportera data. Försök igen.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dropdown>
      <Dropdown.Toggle 
        variant="outline-success" 
        id="export-dropdown"
        disabled={exporting}
      >
        {exporting ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Exporterar...
          </>
        ) : (
          '📊 Exportera data'
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={() => handleExport('json')}>
          Exportera som JSON
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleExport('csv')}>
          Exportera som CSV (Excel)
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ExportButton;