import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, Loader2, Clock, AlertCircle, Upload } from 'lucide-react';
import { statementsApi } from '@/api/statements';
import type { Statement } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

export default function Dashboard() {
  const [recentStatements, setRecentStatements] = useState<Statement[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const response = await statementsApi.list({ page: 1, limit: 5 });
      setRecentStatements(response.statements);

      const allResponse = await statementsApi.list({ page: 1, limit: 1000 });
      const statements = allResponse.statements;

      setStats({
        total: statements.length,
        pending: statements.filter((s: Statement) => s.status === 'pending').length,
        processing: statements.filter((s: Statement) => s.status === 'processing').length,
        completed: statements.filter((s: Statement) => s.status === 'completed').length,
        failed: statements.filter((s: Statement) => s.status === 'failed').length,
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, icon: any }> = {
      completed: { variant: 'success', icon: CheckCircle2 },
      processing: { variant: 'default', icon: Loader2 },
      failed: { variant: 'destructive', icon: AlertCircle },
      pending: { variant: 'warning', icon: Clock },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="capitalize">
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your bank statement processing
          </p>
        </div>
        <Link to="/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Statement
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Statements</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Processing</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Statements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Statements</CardTitle>
              <CardDescription>Your latest uploaded bank statements</CardDescription>
            </div>
            <Link to="/statements">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentStatements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No statements</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by uploading a bank statement.</p>
              <div className="mt-6">
                <Link to="/upload">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Statement
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentStatements.map((statement) => (
                <Link
                  key={statement.id}
                  to={`/statements/${statement.id}`}
                  className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {statement.filename}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {statement.bank_name || 'Unknown Bank'} •{' '}
                        {statement.account_number || 'No Account'} •{' '}
                        {statement.transaction_count} transactions
                      </p>
                    </div>
                    <div className="ml-4 flex items-center space-x-4">
                      {getStatusBadge(statement.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(statement.upload_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA Card */}
      <Card className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 border-none">
        <CardHeader>
          <CardTitle className="text-white">Get Started</CardTitle>
          <CardDescription className="text-blue-100">
            Upload your bank statement PDFs and let AI extract transaction data automatically.
            Supports multiple bank formats with flexible column detection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/upload">
            <Button variant="secondary">
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Statement
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
