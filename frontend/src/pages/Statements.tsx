import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, Trash2, Eye } from 'lucide-react';
import { statementsApi } from '@/api/statements';
import type { Statement } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';

export default function Statements() {
  const navigate = useNavigate();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadStatements();
  }, [page, statusFilter]);

  const loadStatements = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await statementsApi.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });

      setStatements(response.statements);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      setError('Failed to load statements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStatements();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this statement?')) return;

    try {
      await statementsApi.delete(id);
      loadStatements();
    } catch (err) {
      alert('Failed to delete statement');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'success',
      processing: 'default',
      failed: 'destructive',
      pending: 'warning',
    };
    return <Badge variant={variants[status] || 'secondary'} className="capitalize">{status}</Badge>;
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Statements</h1>
          <p className="mt-2 text-gray-600">
            View and manage all uploaded bank statements
          </p>
        </div>
        <Link to="/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload New
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename, bank, or account..."
              className="flex-1"
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No statements found
                    </TableCell>
                  </TableRow>
                ) : (
                  statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/statements/${statement.id}`}
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          {statement.filename}
                        </Link>
                      </TableCell>
                      <TableCell>{statement.bank_name || '-'}</TableCell>
                      <TableCell>{statement.account_number || '-'}</TableCell>
                      <TableCell>
                        {statement.period_start && statement.period_end
                          ? `${statement.period_start} to ${statement.period_end}`
                          : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(statement.status)}</TableCell>
                      <TableCell>{statement.transaction_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/statements/${statement.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(statement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
