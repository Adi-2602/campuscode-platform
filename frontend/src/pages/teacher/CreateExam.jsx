import { useState, useEffect } from 'react';
import { FiCheck, FiChevronRight, FiChevronLeft, FiPlus, FiTrash2, FiCalendar, FiClock } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TimePicker from '../../components/ui/TimePicker';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import teacherService from '../../services/teacherService';
import studentService from '../../services/studentService';

const CreateExam = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClassId = searchParams.get('classId');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [examData, setExamData] = useState({
        title: '',
        description: '',
        classId: '',
        durationMinutes: 60,
        startTime: '',
        endTime: '',
        totalMarks: 0,
        passingMarks: 0,
        allowedLanguages: [], // Array of language IDs
        isRandomized: true,
        maxSubmissions: 3
    });

    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');

    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [classes, setClasses] = useState([]);
    const [langSearch, setLangSearch] = useState('');

    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [langRes, classesRes] = await Promise.all([
                    studentService.getLanguages(),
                    teacherService.getClasses()
                ]);
                setAvailableLanguages(langRes.data || []);
                const classList = classesRes.data?.classes || classesRes.data || [];
                setClasses(classList);

                // Auto-select class if classId is in URL
                if (queryClassId) {
                    setExamData(prev => ({ ...prev, classId: queryClassId }));
                }
            } catch (err) {
                console.error('Failed to load initial data', err);
                toast.error('Failed to load classes or languages');
            }
        };
        fetchData();
    }, []);

    // Fetch questions when class changes
    useEffect(() => {
        const fetchClassQuestions = async () => {
            if (!examData.classId) {
                setAvailableQuestions([]);
                setSelectedQuestions([]);
                return;
            }
            try {
                const res = await teacherService.getClassQuestions(examData.classId);
                const questions = res.data.questions.map(q => ({
                    _id: q.question._id,
                    title: q.question.title,
                    difficulty: q.question.difficulty,
                    points: q.testCases.reduce((sum, tc) => sum + (tc.weight || 0), 0)
                }));
                setAvailableQuestions(questions);
                // Reset selected questions when class changes
                setSelectedQuestions([]);
            } catch (err) {
                console.error('Failed to fetch class questions', err);
                toast.error('Failed to load questions for this class');
            }
        };
        fetchClassQuestions();
    }, [examData.classId]);

    // Auto-calculate total marks
    useEffect(() => {
        const total = selectedQuestions.reduce((sum, q) => sum + q.points, 0);
        setExamData(prev => ({ ...prev, totalMarks: total }));
    }, [selectedQuestions]);

    const handleNext = () => {
        if (step === 1) {
            if (!examData.title || !examData.classId || !examData.durationMinutes || !startDate || !startTime || !endDate || !endTime) {
                toast.error('Please fill all required fields including class, date, and time');
                return;
            }
            const start = new Date(`${startDate}T${startTime}:00`);
            const end = new Date(`${endDate}T${endTime}:00`);
            if (end <= start) {
                toast.error('End time must be after start time');
                return;
            }
        }
        if (step === 2 && selectedQuestions.length === 0) {
            toast.error('Please select at least one question');
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const toggleQuestion = (question) => {
        if (selectedQuestions.find(q => q._id === question._id)) {
            setSelectedQuestions(prev => prev.filter(q => q._id !== question._id));
        } else {
            setSelectedQuestions(prev => [...prev, question]);
        }
    };

    const handleCreate = async () => {
        if (selectedQuestions.length === 0) {
            toast.error('Please select at least one question');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...examData,
                durationMinutes: Number(examData.durationMinutes),
                totalMarks: Number(examData.totalMarks),
                passingMarks: Number(examData.passingMarks),
                startTime: `${startDate}T${startTime}:00Z`,
                endTime: `${endDate}T${endTime}:00Z`,
                questions: selectedQuestions.map(q => q._id),
                status: 'draft',
                state: 'draft'
            };
            console.log('Final Exam Payload:', payload);
            await teacherService.createExam(payload);
            toast.success('Exam Created Successfully!');
            navigate('/teacher/exams');
        } catch (error) {
            console.error('Create Exam Error:', error);
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to create exam');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, title: 'Exam Details' },
        { num: 2, title: 'Select Questions' },
        { num: 3, title: 'Review & Publish' }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Create New Exam</h1>

            {/* Stepper */}
            <div className="flex items-center justify-between relative mb-12">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10"></div>
                {steps.map((s) => (
                    <div key={s.num} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-900 px-2 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s.num ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}>
                            {step > s.num ? <FiCheck /> : s.num}
                        </div>
                        <span className={`text-sm font-medium ${step >= s.num ? 'text-neon-purple' : 'text-slate-500 dark:text-slate-500'}`}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Step 1: Details */}
                {step === 1 && (
                    <Card className="animate-fade-in space-y-4 bg-white dark:bg-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Exam Title"
                                placeholder="e.g. Mid-Term Data Structures"
                                value={examData.title}
                                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                className="bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Class</label>
                                <select
                                    className={`w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none transition-all ${queryClassId ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    value={examData.classId}
                                    onChange={(e) => setExamData({ ...examData, classId: e.target.value })}
                                    disabled={!!queryClassId}
                                >
                                    <option value="">Select a Class</option>
                                    {classes.map(cls => (
                                        <option key={cls._id} value={cls._id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <textarea
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none placeholder-slate-400"
                                rows="3"
                                placeholder="Instructions for students..."
                                value={examData.description}
                                onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-neon-blue flex items-center gap-2">
                                    <FiCalendar /> Start Schedule
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-white dark:bg-slate-800 text-xs"
                                    />
                                    <TimePicker
                                        label="Time (Clock)"
                                        value={startTime}
                                        onChange={setStartTime}
                                        className="bg-white dark:bg-slate-800 text-xs"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 italic">Open the clock to select hours & minutes</p>
                            </div>

                            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-neon-purple flex items-center gap-2">
                                    <FiClock /> End Schedule
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-white dark:bg-slate-800 text-xs"
                                    />
                                    <TimePicker
                                        label="Time (Clock)"
                                        value={endTime}
                                        onChange={setEndTime}
                                        className="bg-white dark:bg-slate-800 text-xs"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 italic">Open the clock to select hours & minutes</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Duration (minutes)"
                                type="number"
                                value={examData.durationMinutes}
                                onChange={(e) => setExamData({ ...examData, durationMinutes: e.target.value })}
                                className="bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                            />
                            <Input
                                label="Passing Marks"
                                type="number"
                                value={examData.passingMarks}
                                onChange={(e) => setExamData({ ...examData, passingMarks: e.target.value })}
                                className="bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Advanced Settings</h3>
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Randomize Questions</p>
                                    <p className="text-xs text-slate-500">Shuffle questions for each student</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setExamData({ ...examData, isRandomized: !examData.isRandomized })}
                                    className={`w-11 h-6 rounded-full transition-colors relative ${examData.isRandomized ? 'bg-neon-purple' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${examData.isRandomized ? 'translate-x-5' : ''}`}></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Max Submissions</p>
                                    <p className="text-xs text-slate-500">Attempts allowed per student</p>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={examData.maxSubmissions}
                                    onChange={(e) => setExamData({ ...examData, maxSubmissions: parseInt(e.target.value) || 1 })}
                                    className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-center focus:border-neon-purple outline-none"
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Step 2: Select Questions */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Questions</h2>
                            <span className="text-neon-purple font-mono">
                                Selected: {selectedQuestions.length} | Total Points: {examData.totalMarks}
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {availableQuestions.length > 0 ? availableQuestions.map(q => {
                                const isSelected = selectedQuestions.find(sq => sq._id === q._id);
                                return (
                                    <div
                                        key={q._id}
                                        onClick={() => toggleQuestion(q)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${isSelected
                                            ? 'bg-neon-purple/10 border-neon-purple'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-neon-purple border-neon-purple' : 'border-slate-400 dark:border-slate-500'
                                                }`}>
                                                {isSelected && <FiCheck className="text-white text-xs" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">{q.title}</h4>
                                                <span className={`text-xs px-2 py-0.5 rounded border ${q.difficulty === 'Easy' ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30' :
                                                    q.difficulty === 'Medium' ? 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30' : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
                                                    }`}>
                                                    {q.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="font-mono text-slate-600 dark:text-slate-300">{q.points} pts</span>
                                    </div>
                                );
                            }) : (
                                <Card className="p-8 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                                    <p className="text-slate-500">No questions found for this class.</p>
                                    <p className="text-xs text-slate-400 mt-1">Please add questions to this class first.</p>
                                </Card>
                            )}
                        </div>

                        {/* Language Selection in Step 2 */}
                        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Allowed Languages</h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const common = availableLanguages.filter(l =>
                                                ['python', 'java', 'javascript', 'c++ (gcc 9'].some(name => l.name.toLowerCase().includes(name))
                                            ).map(l => l.id);
                                            setExamData({ ...examData, allowedLanguages: [...new Set([...examData.allowedLanguages, ...common])] });
                                        }}
                                        className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-neon-purple hover:text-white transition-colors"
                                    >
                                        + Common
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExamData({ ...examData, allowedLanguages: [] })}
                                        className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder="Search languages..."
                                value={langSearch}
                                onChange={(e) => setLangSearch(e.target.value)}
                                className="w-full mb-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-xs focus:border-neon-purple outline-none"
                            />

                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {availableLanguages
                                    .filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase()))
                                    .map((lang) => {
                                        const isSelected = examData.allowedLanguages.includes(lang.id);
                                        return (
                                            <button
                                                key={lang.id}
                                                type="button"
                                                onClick={() => {
                                                    const newLangs = isSelected
                                                        ? examData.allowedLanguages.filter(id => id !== lang.id)
                                                        : [...examData.allowedLanguages, lang.id];
                                                    setExamData({ ...examData, allowedLanguages: newLangs });
                                                }}
                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${isSelected
                                                    ? 'bg-neon-blue text-white border-neon-blue shadow-[0_0_10px_rgba(0,183,255,0.3)]'
                                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-neon-blue/50'
                                                    }`}
                                            >
                                                {lang.name}
                                            </button>
                                        );
                                    })}
                            </div>
                        </Card>
                    </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                    <Card className="animate-fade-in space-y-6 bg-white dark:bg-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Review Exam Details</h2>

                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Title</p>
                                <p className="text-slate-900 dark:text-white font-bold text-lg">{examData.title}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Duration</p>
                                <p className="text-slate-900 dark:text-white font-bold">{examData.durationMinutes} mins</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Start Time</p>
                                <p className="text-slate-900 dark:text-white font-bold text-xs">{startDate} {startTime}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">End Time</p>
                                <p className="text-slate-900 dark:text-white font-bold text-xs">{endDate} {endTime}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Total Questions</p>
                                <p className="text-slate-900 dark:text-white font-bold">{selectedQuestions.length}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Randomized</p>
                                <p className="text-slate-900 dark:text-white font-bold">{examData.isRandomized ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Max Submissions</p>
                                <p className="text-slate-900 dark:text-white font-bold">{examData.maxSubmissions}</p>
                            </div>
                            <div className="col-span-2 space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-slate-500 dark:text-slate-400">Allowed Languages</p>
                                    <span className="text-[10px] text-neon-blue">{examData.allowedLanguages.length} Selected</span>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Add/Search more languages..."
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-1 text-xs focus:border-neon-blue outline-none"
                                    onChange={(e) => setLangSearch(e.target.value)}
                                />

                                <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto pr-1">
                                    {availableLanguages
                                        .filter(l => examData.allowedLanguages.includes(l.id) || (langSearch && l.name.toLowerCase().includes(langSearch.toLowerCase())))
                                        .map(lang => {
                                            const isSelected = examData.allowedLanguages.includes(lang.id);
                                            return (
                                                <button
                                                    key={lang.id}
                                                    onClick={() => {
                                                        const newLangs = isSelected
                                                            ? examData.allowedLanguages.filter(id => id !== lang.id)
                                                            : [...examData.allowedLanguages, lang.id];
                                                        setExamData({ ...examData, allowedLanguages: newLangs });
                                                    }}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${isSelected
                                                        ? 'bg-neon-blue/10 text-neon-blue border-neon-blue'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-transparent hover:border-neon-blue'
                                                        }`}
                                                >
                                                    {lang.name} {isSelected ? '×' : '+'}
                                                </button>
                                            );
                                        })}
                                    {examData.allowedLanguages.length === 0 && !langSearch && (
                                        <span className="text-red-500 text-xs italic">No languages selected! Students won't be able to run code.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-3">Questions Included:</h3>
                            <ul className="space-y-2">
                                {selectedQuestions.map((q, i) => (
                                    <li key={q._id} className="flex justify-between text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span>{i + 1}. {q.title}</span>
                                        <span>{q.points} pts</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                    <Button
                        variant="secondary"
                        onClick={handleBack}
                        disabled={step === 1}
                        className="w-32 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        <FiChevronLeft className="mr-2" /> Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            className="w-32 bg-neon-purple border-none hover:bg-purple-600"
                        >
                            Next <FiChevronRight className="ml-2" />
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            isLoading={loading}
                            className="bg-green-500 hover:bg-green-600 border-none w-40"
                        >
                            <FiCheck className="mr-2" /> Create Exam
                        </Button>
                    )}
                </div>
            </div>
        </div >
    );
};

export default CreateExam;
