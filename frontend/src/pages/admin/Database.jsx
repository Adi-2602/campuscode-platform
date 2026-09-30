import { useState, useEffect } from 'react';
import { FiDatabase, FiSearch, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';

const AdminDatabase = () => {
    const [view, setView] = useState('list'); // 'list', 'documents', 'detail'
    const [stats, setStats] = useState(null);
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [loading, setLoading] = useState(false);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalDocs, setTotalDocs] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedCollection && view === 'documents') {
            fetchDocuments();
        }
    }, [page, selectedCollection, view]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, colsRes] = await Promise.all([
                adminService.getDbStats().catch(() => ({ data: null })),
                adminService.getCollections().catch(() => ({ data: [] }))
            ]);

            // Hande Stats
            if (statsRes.data) {
                setStats(statsRes.data);
            } else {
                // Fallback mock stats if API fails
                setStats({ db: 'exam_system', collections: 0, objects: 0, dataSize: 0 });
            }

            // Handle Collections
            let colsData = [];
            if (Array.isArray(colsRes.data)) {
                colsData = colsRes.data;
            } else if (colsRes.data?.collections) {
                colsData = colsRes.data.collections;
            }

            // Attempt to fetch details if missing - DISABLE detailed stats fetching to prevent 500 flood
            // Just normalize the data structure
            const normalizedCols = colsData.map(col => {
                const name = col.name || col;
                return typeof col === 'string' ? { name: col } : col;
            });

            setCollections(normalizedCols);

        } catch (error) {
            console.error('Failed to fetch DB data', error);
            toast.error("Failed to load database stats");
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        if (!selectedCollection) return;
        setLoading(true);
        try {
            let res;
            if (searchQuery) {
                res = await adminService.searchDocuments(selectedCollection, { query: searchQuery, page, limit });
            } else {
                res = await adminService.getDocuments(selectedCollection, { page, limit });
            }

            // Handle different response structures
            const docs = res.data?.documents || res.data?.data || [];
            const total = res.data?.total || res.data?.pagination?.total || 0;

            setDocuments(docs);
            setTotalDocs(total);
        } catch (error) {
            console.error("Failed to fetch documents", error);
            toast.error("Failed to fetch documents");
        } finally {
            setLoading(false);
        }
    };

    const handleCollectionClick = (colName) => {
        setSelectedCollection(colName);
        setPage(1);
        setSearchQuery('');
        setView('documents');
    };

    const handleDocumentClick = (doc) => {
        setSelectedDocument(doc);
        setView('detail');
    };

    const handleBack = () => {
        if (view === 'detail') {
            setView('documents');
            setSelectedDocument(null);
        } else {
            setView('list');
            setSelectedCollection(null);
            setDocuments([]);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchDocuments();
    };

    const renderJson = (data) => {
        return (
            <pre className="bg-slate-950 text-slate-300 p-4 rounded-lg overflow-x-auto text-sm font-mono custom-scrollbar">
                {JSON.stringify(data, null, 2)}
            </pre>
        );
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {view !== 'list' && (
                        <Button variant="ghost" onClick={handleBack}>
                            &larr; Back
                        </Button>
                    )}
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <FiDatabase className="text-neon-green" />
                        {view === 'list' && 'Database Explorer'}
                        {view === 'documents' && `Collection: ${selectedCollection}`}
                        {view === 'detail' && 'Document Details'}
                    </h1>
                </div>
                {view === 'list' && (
                    <Button variant="outline" size="sm" onClick={fetchData} isLoading={loading}>
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
                    </Button>
                )}
                {view === 'documents' && (
                    <Button variant="outline" size="sm" onClick={fetchDocuments} isLoading={loading}>
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
                    </Button>
                )}
            </div>

            {/* List View: Stats & Grid */}
            {view === 'list' && (
                <div className="space-y-6 overflow-y-auto pr-2 pb-4">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-slate-900 border-slate-800">
                            <span className="text-slate-500 text-xs uppercase font-bold">Database Name</span>
                            <p className="text-xl font-mono text-white">{stats?.db || 'N/A'}</p>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <span className="text-slate-500 text-xs uppercase font-bold">Total Collections</span>
                            <p className="text-xl font-mono text-neon-green">{stats?.collections || collections.length || 0}</p>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <span className="text-slate-500 text-xs uppercase font-bold">Total Documents</span>
                            <p className="text-xl font-mono text-neon-blue">{stats?.objects || 0}</p>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <span className="text-slate-500 text-xs uppercase font-bold">Data Size</span>
                            <p className="text-xl font-mono text-neon-purple">
                                {stats?.dataSize ? (Number(stats.dataSize) / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'}
                            </p>
                        </Card>
                    </div>

                    {/* Collections Grid */}
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Collections</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {collections.map((col, idx) => (
                            <Card
                                key={idx}
                                onClick={() => handleCollectionClick(col.name)}
                                className="hover:border-neon-green/50 transition-colors group cursor-pointer border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-neon-green transition-colors">{col.name}</h3>
                                    <FiGrid className="text-slate-400 group-hover:text-neon-green" />
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Documents</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-mono">
                                            {(col.count !== undefined || col.documents !== undefined)
                                                ? (col.count || col.documents)
                                                : <span className="text-slate-400 italic">N/A</span>}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Size</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-mono">
                                            {(col.size !== undefined || col.storageSize !== undefined)
                                                ? ((col.size || col.storageSize) / 1024).toFixed(2) + ' KB'
                                                : <span className="text-slate-400 italic">N/A</span>}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Documents View */}
            {view === 'documents' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="mb-4 flex gap-2">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documents..."
                                className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-neon-blue outline-none"
                            />
                            <Button type="submit" variant="primary">
                                <FiSearch /> Search
                            </Button>
                        </form>
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto flex-1 custom-scrollbar p-4">
                            {loading && documents.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">Loading documents...</div>
                            ) : documents.length > 0 ? (
                                <table className="w-full text-left text-sm">
                                    <thead className="text-slate-500 dark:text-slate-400 font-bold border-b border-gray-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-3 w-24">ID</th>
                                            {/* Try to dynamically generate headers based on first document keys (limit to 4) */}
                                            {Object.keys(documents[0] || {}).filter(k => k !== '_id' && k !== 'password' && k !== '__v').slice(0, 4).map(key => (
                                                <th key={key} className="p-3 capitalize">{key}</th>
                                            ))}
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {documents.map((doc, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                <td className="p-3 font-mono text-xs text-slate-500 truncate max-w-[100px]" title={doc._id}>
                                                    {String(doc._id).substring(0, 8)}...
                                                </td>
                                                {Object.keys(documents[0] || {}).filter(k => k !== '_id' && k !== 'password' && k !== '__v').slice(0, 4).map(key => (
                                                    <td key={key} className="p-3 text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                                        {typeof doc[key] === 'object' ? '[Object]' : String(doc[key])}
                                                    </td>
                                                ))}
                                                <td className="p-3 text-right">
                                                    <Button size="sm" variant="ghost" onClick={() => handleDocumentClick(doc)}>
                                                        <FiList className="mr-1" /> View JSON
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-10 text-slate-500">No documents found.</div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="border-t border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between bg-gray-50 dark:bg-slate-800/30 shrink-0">
                            <span className="text-sm text-slate-500">
                                Showing {documents.length} of {totalDocs}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Previous
                                </Button>
                                <span className="flex items-center px-4 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded border border-gray-300 dark:border-slate-700">
                                    Page {page}
                                </span>
                                <Button
                                    size="sm"
                                    disabled={documents.length < limit}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Detail View */}
            {view === 'detail' && selectedDocument && (
                <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        Document <span className="font-mono text-neon-blue text-base bg-neon-blue/10 px-2 py-1 rounded">{selectedDocument._id}</span>
                    </h2>
                    {renderJson(selectedDocument)}
                </div>
            )}
        </div>
    );
};

export default AdminDatabase;
