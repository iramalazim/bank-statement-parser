import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { statementsApi } from '@/api/statements';
import type { Transaction, TransactionSchema } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';

interface Props {
    statementId: number;
}

export default function TransactionTable({ statementId }: Props) {
    const [schema, setSchema] = useState<TransactionSchema | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState({ total_credit: '0', total_debit: '0', net: '0' });
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'credit' | 'debit' | 'all'>('all');

    useEffect(() => {
        loadSchema();
    }, [statementId]);

    const loadSchema = async () => {
        try {
            const schemaData = await statementsApi.getSchema(statementId);
            console.log('Schema:', schemaData.columns);
            setSchema(schemaData);
            loadTransactions();
        } catch (err) {
            console.error('Schema load error:', err);
        }
    };

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const response = await statementsApi.getTransactions(statementId, {
                page,
                limit: 50,
                type: typeFilter === 'all' ? undefined : typeFilter,
                search: search || undefined,
            });

            console.log('Transactions:', response.transactions.length);
            setTransactions(response.transactions);
            setTotalPages(response.pagination.pages);
            setSummary(response.summary);
        } catch (err) {
            console.error('Transactions load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadTransactions();
    };

    const formatCell = (value: any, type?: string, columnName?: string): React.ReactNode => {
        if (value === null || value === undefined || value === '') return '-';

        // Special handling for transaction type column
        if (columnName === 'transaction_type' || columnName === 'type') {
            const typeValue = String(value).toLowerCase();
            if (typeValue === 'credit') {
                return <Badge variant="success">Credit</Badge>;
            } else if (typeValue === 'debit') {
                return <Badge variant="destructive">Debit</Badge>;
            }
            return <Badge variant="secondary">{String(value)}</Badge>;
        }

        switch (type) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(value);
            case 'date':
                return value;
            default:
                return String(value);
        }
    };

    if (!schema) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    if (schema.columns.length === 0) {
        console.log('No schema columns found');
        return (
            <div className="mt-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500 py-8">
                            No transaction schema found. The statement may not have been processed correctly.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search transactions..."
                                className="flex-1"
                            />
                            <Select
                                value={typeFilter}
                                onValueChange={(value) => {
                                    setTypeFilter(value as any);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                    <SelectItem value="debit">Debit</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" variant="outline">
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-sm text-green-900">Total Credits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-700">
                            {formatCell(summary.total_credit, 'currency')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-sm text-red-900">Total Debits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-700">
                            {formatCell(summary.total_debit, 'currency')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="text-sm text-blue-900">Net</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-blue-700">
                            {formatCell(summary.net, 'currency')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Table */}
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {schema.columns.map((col) => {
                                        const isCurrency = schema.column_metadata[col]?.type === 'currency';
                                        return (
                                            <TableHead
                                                key={col}
                                                className={isCurrency ? 'text-right' : ''}
                                            >
                                                {schema.column_metadata[col]?.display_name || col}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={schema.columns.length} className="text-center py-8 text-gray-500">
                                            No transactions found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((txn) => (
                                        <TableRow key={txn.id}>
                                            {/* {JSON.stringify(txn)} */}
                                            {schema.columns.map((col) => {
                                                const isCurrency = schema.column_metadata[col]?.type === 'currency';
                                                return (
                                                    <TableCell
                                                        key={col}
                                                        className={isCurrency ? 'text-right' : ''}
                                                    >
                                                        {formatCell(
                                                            txn.data[col],
                                                            schema.column_metadata[col]?.type,
                                                            col
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (page > 1) setPage(p => p - 1);
                                            }}
                                            className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>

                                    <PaginationItem>
                                        <span className="text-sm text-gray-700 px-4">
                                            Page {page} of {totalPages}
                                        </span>
                                    </PaginationItem>

                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (page < totalPages) setPage(p => p + 1);
                                            }}
                                            className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
