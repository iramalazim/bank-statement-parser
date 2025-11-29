import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    Code,
    FileText,
    TrendingUp,
    Zap,
    Edit,
    Save,
    X
} from 'lucide-react';
import { statementsApi } from '@/api/statements';

interface MetadataViewerProps {
    statementId: number;
}

interface MetadataResponse {
    statement_id: number;
    raw_extraction_data: any[];
    token_usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    confidence_scores: {
        average: {
            overall: number;
            customer_details: number;
            bank_details: number;
            transactions: number;
        };
        by_page: any[];
        min_overall: number;
        max_overall: number;
    };
    processing_logs: any[];
    validation_errors: any;
    transaction_schema: {
        columns: string[];
        column_metadata: Record<string, {
            type: string;
            display_name: string;
        }>;
        detected_bank_format: string | null;
    } | null;
    processing_times: {
        started_at: string | null;
        completed_at: string | null;
        duration_seconds: number | null;
    };
    page_count: number;
    status: string;
    error_message: string | null;
}

export default function MetadataViewer({ statementId }: MetadataViewerProps) {
    const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMetadata, setEditedMetadata] = useState<Record<string, { type: string; display_name: string }>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadMetadata();
    }, [statementId]);

    const loadMetadata = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await statementsApi.getMetadata(statementId);
            setMetadata(data);
        } catch (err: any) {
            setError('Failed to load metadata');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (score: number): string => {
        if (score >= 0.9) return 'text-green-600';
        if (score >= 0.75) return 'text-yellow-600';
        return 'text-red-600';
    };

    const formatDuration = (seconds: number | null): string => {
        if (!seconds) return 'N/A';
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    const handleEditClick = () => {
        if (metadata?.transaction_schema?.column_metadata) {
            setEditedMetadata({ ...metadata.transaction_schema.column_metadata });
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedMetadata({});
    };

    const handleSaveChanges = async () => {
        if (!metadata?.transaction_schema) return;

        setSaving(true);
        try {
            await statementsApi.updateSchema(statementId, editedMetadata);

            // Reload metadata to get the updated schema
            await loadMetadata();

            setIsEditing(false);
            setEditedMetadata({});
        } catch (err: any) {
            console.error('Failed to update schema:', err);
            setError('Failed to update column types');
        } finally {
            setSaving(false);
        }
    };

    const handleTypeChange = (column: string, newType: string) => {
        setEditedMetadata(prev => ({
            ...prev,
            [column]: {
                ...prev[column],
                type: newType
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !metadata) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error || 'Failed to load metadata'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Token Usage */}
                {metadata.token_usage && metadata.token_usage.total_tokens > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
                                <Zap className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metadata.token_usage.total_tokens.toLocaleString()}</div>
                            <div className="mt-2 space-y-1 text-xs text-gray-600">
                                <div>Prompt: {metadata.token_usage.prompt_tokens.toLocaleString()}</div>
                                <div>Completion: {metadata.token_usage.completion_tokens.toLocaleString()}</div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Confidence Score */}
                {metadata.confidence_scores?.average && (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Math.round(metadata.confidence_scores.average.overall * 100)}%
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                                Range: {Math.round(metadata.confidence_scores.min_overall * 100)}% - {Math.round(metadata.confidence_scores.max_overall * 100)}%
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Processing Time */}
                {metadata.processing_times.duration_seconds && (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
                                <Clock className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDuration(metadata.processing_times.duration_seconds)}</div>
                            <div className="mt-2 text-xs text-gray-600">
                                {metadata.page_count} page{metadata.page_count !== 1 ? 's' : ''}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            <Activity className="h-4 w-4 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {metadata.status === 'completed' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className="text-lg font-semibold capitalize">{metadata.status}</span>
                        </div>
                        {metadata.error_message && (
                            <div className="mt-2 text-xs text-red-600">{metadata.error_message}</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Confidence Scores Breakdown */}
            {metadata.confidence_scores?.average && (
                <Card>
                    <CardHeader>
                        <CardTitle>Confidence Scores Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Overall</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`text-2xl font-bold ${getConfidenceColor(metadata.confidence_scores.average.overall)}`}>
                                        {Math.round(metadata.confidence_scores.average.overall * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Customer Details</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`text-2xl font-bold ${getConfidenceColor(metadata.confidence_scores.average.customer_details)}`}>
                                        {Math.round(metadata.confidence_scores.average.customer_details * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Bank Details</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`text-2xl font-bold ${getConfidenceColor(metadata.confidence_scores.average.bank_details)}`}>
                                        {Math.round(metadata.confidence_scores.average.bank_details * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Transactions</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`text-2xl font-bold ${getConfidenceColor(metadata.confidence_scores.average.transactions)}`}>
                                        {Math.round(metadata.confidence_scores.average.transactions * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Processing Logs */}
            {metadata.processing_logs && metadata.processing_logs.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <CardTitle>Processing Logs</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {metadata.processing_logs.map((log, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md text-sm">
                                    <div className="shrink-0">
                                        {log.status === 'success' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        ) : log.status === 'error' ? (
                                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                        ) : (
                                            <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                                {log.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                {log.page && ` - Page ${log.page}`}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {log.tokens_used && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                Tokens: {log.tokens_used} | Validated: {log.validated ? 'Yes' : 'No'}
                                            </div>
                                        )}
                                        {log.error && (
                                            <div className="text-xs text-red-600 mt-1">{log.error}</div>
                                        )}
                                        {log.validation_errors && (
                                            <div className="text-xs text-orange-600 mt-1">Validation issues detected</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Transaction Schema */}
            {metadata.transaction_schema && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <CardTitle>Transaction Schema</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Detected Bank Format */}
                            {metadata.transaction_schema.detected_bank_format && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500">Detected Bank Format:</span>
                                    <Badge variant="outline">{metadata.transaction_schema.detected_bank_format}</Badge>
                                </div>
                            )}

                            {/* Column List */}
                            <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    Columns ({metadata.transaction_schema.columns.length}):
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {metadata.transaction_schema.columns.map((column, index) => (
                                        <Badge key={index} variant="secondary" className="font-mono text-xs">
                                            {column}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Column Metadata Table */}
                            {Object.keys(metadata.transaction_schema.column_metadata).length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-medium text-gray-700">Column Metadata:</div>
                                        {!isEditing ? (
                                            <Button
                                                onClick={handleEditClick}
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Edit Types
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={handleSaveChanges}
                                                    variant="default"
                                                    size="sm"
                                                    disabled={saving}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {saving ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                                <Button
                                                    onClick={handleCancelEdit}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={saving}
                                                    className="flex items-center gap-2"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {Object.entries(isEditing ? editedMetadata : metadata.transaction_schema.column_metadata).map(([column, meta]) => (
                                                    <tr key={column}>
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-900">{column}</td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {isEditing ? (
                                                                <select
                                                                    value={meta.type}
                                                                    onChange={(e) => handleTypeChange(column, e.target.value)}
                                                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                >
                                                                    <option value="text">text</option>
                                                                    <option value="currency">currency</option>
                                                                    <option value="date">date</option>
                                                                    <option value="number">number</option>
                                                                </select>
                                                            ) : (
                                                                <Badge
                                                                    variant={
                                                                        meta.type === 'currency' ? 'success' :
                                                                            meta.type === 'date' ? 'default' :
                                                                                'secondary'
                                                                    }
                                                                >
                                                                    {meta.type}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{meta.display_name}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Raw Schema JSON */}
                            <details className="mt-4">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                                    View Raw Schema JSON
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-50 p-4 rounded border overflow-auto max-h-64">
                                    {JSON.stringify(metadata.transaction_schema, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Validation Errors */}
            {metadata.validation_errors && Object.keys(metadata.validation_errors).length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                            <CardTitle className="text-orange-900">Validation Errors</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-64">
                            {JSON.stringify(metadata.validation_errors, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {/* Raw Extraction Data */}
            {metadata.raw_extraction_data && metadata.raw_extraction_data.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Code className="h-5 w-5" />
                            <CardTitle>Raw Extraction Data</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-gray-50 p-4 rounded border overflow-auto max-h-96">
                            {JSON.stringify(metadata.raw_extraction_data, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
