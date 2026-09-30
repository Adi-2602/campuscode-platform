import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { toast } from 'react-hot-toast';
import { FiPlay, FiSave, FiUploadCloud, FiClock, FiMaximize, FiMinimize, FiChevronLeft, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import useAutoSave from '../../hooks/useAutoSave';
import studentService from '../../services/studentService';
import { motion, AnimatePresence } from 'framer-motion';

const ExamInterface = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [code, setCode] = useState('// Write your code here...');
    const [language, setLanguage] = useState(71); // Python
    const [languages, setLanguages] = useState([]);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds

    // Fetch Questions
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await studentService.getExamQuestions(examId);
                // Assuming API returns { questions: [...] } or just [...]
                setQuestions(res.data?.questions || res.data || []);
            } catch (error) {
                console.error('Failed to load questions', error);
                toast.error('Failed to load exam questions');
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [examId]);

    // Fetch Languages
    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const res = await studentService.getLanguages();
                setLanguages(res.data || []);
                // Set default language if available
                if (res.data && res.data.length > 0) {
                    // Try to find Python or just take first
                    const python = res.data.find(l => l.name.toLowerCase().includes('python'));
                    if (python) setLanguage(python.id);
                    else setLanguage(res.data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch languages', error);
            }
        };
        fetchLanguages();
    }, []);

    const currentQuestion = questions[currentQIndex];

    // Autosave Hook
    const { lastSaved, isSaving, triggerSave } = useAutoSave(
        examId,
        currentQuestion?._id,
        code,
        language
    );

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRunCode = async () => {
        if (!currentQuestion) return;
        setIsRunning(true);
        setOutput('Submitting...');

        try {
            // 1. Submit code and get token
            const submissionRes = await studentService.runCode(language, code, currentQuestion.examples[0]?.input || '');
            const token = submissionRes.data.token;

            if (!token) {
                throw new Error('No token received from compiler');
            }

            setOutput('Processing...');

            // 2. Poll for results
            let attempts = 0;
            const maxAttempts = 20;
            const pollInterval = setInterval(async () => {
                try {
                    attempts++;
                    const statusRes = await studentService.getSubmissionResult(token);

                    if (statusRes.data.status !== "Processing") {
                        clearInterval(pollInterval);
                        setIsRunning(false);

                        const result = statusRes.data;
                        if (result.stdout) setOutput(result.stdout);
                        else if (result.stderr) setOutput(result.stderr);
                        else if (result.compile_output) setOutput(result.compile_output);
                        else setOutput(`Status: ${result.status}`);
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        setIsRunning(false);
                        setOutput("Execution timed out. Please try again.");
                    }
                } catch (error) {
                    clearInterval(pollInterval);
                    setIsRunning(false);
                    setOutput("Error fetching execution status");
                }
            }, 2000);

        } catch (error) {
            setOutput(error.response?.data?.message || error.message || 'Error executing code');
            setIsRunning(false);
        }
    };

    const handleSubmitExam = async () => {
        try {
            await studentService.submitExam(examId);
            toast.success('Exam Submitted Successfully!');
            navigate('/student/dashboard');
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit exam');
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-neon-blue">
            Loading Exam Environment...
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-300 overflow-hidden">
            {/* Header */}
            <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-4">
                    <h2 className="text-white font-bold text-lg">Exam: DSA Final</h2>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
                        {currentQIndex + 1} / {questions.length} Questions
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-neon-cyan'}`}>
                        <FiClock />
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSubmitExam}
                            className="bg-green-600/20 text-green-400 border-green-600/50 hover:bg-green-600/30"
                        >
                            <FiUploadCloud className="mr-2" /> Submit Exam
                        </Button>
                        <button onClick={toggleFullscreen} className="p-2 hover:text-white transition-colors">
                            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content - Split Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Question Panel (Left) */}
                <div className="w-1/3 min-w-[350px] bg-slate-900 border-r border-slate-800 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        <motion.div
                            key={currentQuestion._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">{currentQuestion.title}</h3>
                            <p className="text-slate-400 leading-relaxed mb-6">{currentQuestion.description}</p>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-200">Examples:</h4>
                                {currentQuestion.examples.map((ex, i) => (
                                    <div key={i} className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-slate-500">Input:</span>
                                            <span className="text-neon-blue">{ex.input}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500">Output:</span>
                                            <span className="text-neon-green">{ex.output}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6">
                                <h4 className="font-semibold text-slate-200 mb-2">Constraints:</h4>
                                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                                    {currentQuestion.constraints.map((c, i) => (
                                        <li key={i}>{c}</li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    </div>

                    {/* Question Navigation */}
                    <div className="h-14 border-t border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
                        <Button
                            variant="ghost"
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex(prev => prev - 1)}
                        >
                            <FiChevronLeft className="mr-1" /> Prev
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={currentQIndex === questions.length - 1}
                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                        >
                            Next <FiChevronRight className="ml-1" />
                        </Button>
                    </div>
                </div>

                {/* Editor Panel (Right) */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                    {/* Toolbar */}
                    <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-[#333]">
                        <div className="flex gap-2">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(Number(e.target.value))}
                                className="bg-[#3c3c3c] text-white text-xs rounded border-none px-2 py-1 focus:ring-1 focus:ring-neon-blue"
                            >
                                {languages.length > 0 ? (
                                    languages.map(lang => (
                                        <option key={lang.id} value={lang.id}>
                                            {lang.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value={71}>Python (3.8.1)</option>
                                )}
                            </select>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            {isSaving && <span className="flex items-center text-neon-yellow"><FiUploadCloud className="mr-1 animate-bounce" /> Saving...</span>}
                            {!isSaving && lastSaved && <span className="flex items-center text-slate-500"><FiCheckCircle className="mr-1" /> Saved</span>}
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={language === 71 ? 'python' : language === 63 ? 'javascript' : 'cpp'}
                            value={code}
                            onChange={(value) => setCode(value)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: 'Fira Code',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    {/* Resize Handle (Horizontal) - Placeholder */}
                    <div className="h-1 bg-slate-700 cursor-row-resize hover:bg-neon-blue transition-colors"></div>

                    {/* Custom Console / Output */}
                    <div className="h-48 bg-[#1e1e1e] border-t border-[#333] flex flex-col">
                        <div className="h-8 bg-[#252526] px-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Console</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={triggerSave}
                                    className="h-6 text-xs px-2 bg-slate-700 hover:bg-slate-600 border-none"
                                >
                                    <FiSave className="mr-1" /> Save
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleRunCode}
                                    isLoading={isRunning}
                                    className="h-6 text-xs px-2 bg-neon-blue hover:bg-blue-600 border-none text-white"
                                >
                                    <FiPlay className="mr-1" /> Run Code
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap text-slate-300">
                            {output || <span className="text-slate-600 italic">Run execution to see output...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamInterface;
