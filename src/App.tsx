import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="container mt-5">
      <div className="text-center">
        <h1 className="display-4 text-primary">Träningsdagbok</h1>
        <p className="lead">Din personliga träningsapp</p>
        
        <div className="row justify-content-center mt-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Utveckling pågår...</h5>
                <p className="card-text">
                  Jag har skapat:
                </p>
                <ul className="list-unstyled">
                  <li> TypeScript types</li>
                  <li> API services</li>
                  <li> Custom hooks</li>
                  <li> UI komponenter (nästa steg)</li>
                </ul>
                <p className="text-muted small mt-3">
                  Kör på port: {window.location.port || '5173'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;