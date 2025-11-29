import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileText, Upload as UploadIcon, LayoutDashboard } from 'lucide-react';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import Statements from '@/pages/Statements';
import StatementDetail from '@/pages/StatementDetail';
import { cn } from '@/lib/utils';

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center px-2 text-gray-900 font-semibold text-lg">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Bank Statement Parser
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive('/')
                    ? "border-blue-600 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link
                to="/upload"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive('/upload')
                    ? "border-blue-600 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload
              </Link>
              <Link
                to="/statements"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive('/statements')
                    ? "border-blue-600 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                <FileText className="h-4 w-4 mr-2" />
                Statements
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/statements" element={<Statements />} />
            <Route path="/statements/:id" element={<StatementDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
