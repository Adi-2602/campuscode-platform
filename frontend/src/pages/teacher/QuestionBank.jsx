import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiCode, FiX, FiCheck } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import teacherService from '../../services/teacherService';
import { toast } from 'react-hot-toast';

const QuestionBank = () => {
    const [questions, setQuestions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const initialFormState = {
        title: '',
        description: '',
        difficulty: 'easy',
        classId: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        testCases: [{ input: '', expectedOutput: '', isPublic: true, weight: 1 }]
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [questionsRes, classesRes] = await Promise.all([
                teacherService.getQuestions(),
                teacherService.getClasses() // Needed for creating questions
            ]);

            const rawQuestions = questionsRes.data?.questions || questionsRes.data || [];
            const flattened = rawQuestions.map(q => ({
                ...(q.question || q),
                testCases: q.testCases || (q.question ? [] : q.testCases || [])
            }));

            setQuestions(flattened);
            setClasses(classesRes.data?.classes || classesRes.data || []);

            // Set default class if available and creating new
            if (classesRes.data?.classes?.length > 0) {
                setFormData(prev => ({ ...prev, classId: classesRes.data.classes[0]._id }));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load question bank");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (question = null) => {
        if (question) {
            setEditingId(question._id);
            setFormData({
                title: question.title,
                description: question.description,
                difficulty: question.difficulty,
                classId: typeof question.classId === 'object' ? question.classId._id : question.classId || (classes.length > 0 ? classes[0]._id : ''),
                inputFormat: question.inputFormat || '',
                outputFormat: question.outputFormat || '',
                constraints: question.constraints || '',
                testCases: question.testCases && question.testCases.length > 0
                    ? question.testCases.map(tc => ({ ...tc, id: tc.id || Math.random() })) // Add temp ID for UI key
                    : [{ id: Date.now(), input: '', expectedOutput: '', isPublic: true, weight: 1 }]
            });
        } else {
            setEditingId(null);
            setFormData({
                ...initialFormState,
                classId: classes.length > 0 ? classes[0]._id : '',
                testCases: [{ id: Date.now(), input: '', expectedOutput: '', isPublic: true, weight: 1 }]
            });
        }
        setIsModalOpen(true);
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...formData.testCases];
        newTestCases[index][field] = value;
        setFormData({ ...formData, testCases: newTestCases });
    };

    const addTestCase = () => {
        setFormData({
            ...formData,
            testCases: [...formData.testCases, { id: Date.now(), input: '', expectedOutput: '', isPublic: false, weight: 1 }]
        });
    };

    const removeTestCase = (index) => {
        if (formData.testCases.length === 1) return;
        const newTestCases = formData.testCases.filter((_, i) => i !== index);
        setFormData({ ...formData, testCases: newTestCases });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.classId) {
            toast.error("Please fill in all required fields (Title, Description, Class)");
            return;
        }

        try {
            setSubmitting(true);
            if (editingId) {
                await teacherService.updateQuestion(editingId, formData);
                toast.success("Question updated successfully");
            } else {
                await teacherService.createQuestion(formData);
                toast.success("Question created successfully");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to save question");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the question permanently.")) return;
        try {
            await teacherService.deleteQuestion(id);
            toast.success("Question deleted");
            setQuestions(questions.filter(q => q._id !== id));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete question");
        }
    };

    const filteredQuestions = questions.filter(q =>
        q._id &&
        ((q.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (q.difficulty?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Question Bank</h1>
                    <p className="text-slate-600 dark:text-slate-400">Manage coding problems and test cases.</p>
                </div>
                <Button
                    variant="primary"
                    className="bg-neon-purple hover:bg-purple-600 border-none"
                    onClick={() => handleOpenModal()}
                >
                    <FiPlus className="mr-2" /> Add Question
                </Button>
            </div>

            <Card className="p-4 flex gap-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search questions by title or difficulty..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-neon-purple"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple"></div>
                </div>
            ) : filteredQuestions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredQuestions.map((q) => (
                        <Card key={q._id} className="hover:border-neon-purple transition-all group bg-white dark:bg-slate-800/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-neon-purple">
                                        <FiCode />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-neon-purple transition-colors">{q.title}</h3>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${q.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30' :
                                                q.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30' :
                                                    'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                            {/* Show class name if possible, or just ID/Code? Usually bank is per class but visible here. */}
                                            {/* <span>{q.classId}</span> */}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400" onClick={() => handleOpenModal(q)}>
                                        <FiEdit2 />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDelete(q._id)}>
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">No questions found. Create one to get started!</p>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Question" : "Add New Question"}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Question Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Reverse Linked List"
                            required
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Class</label>
                            <select
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-neon-purple"
                                value={formData.classId}
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                required
                            >
                                <option value="" disabled>Select a class</option>
                                {classes.map(cls => (
                                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Difficulty</label>
                            <select
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-neon-purple"
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description (Markdown)</label>
                        <textarea
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white h-32 focus:outline-none focus:border-neon-purple font-mono text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Problem description..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Input Format</label>
                            <textarea
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white h-20 focus:outline-none focus:border-neon-purple text-xs"
                                value={formData.inputFormat}
                                onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                                placeholder="e.g. First line contains N"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Output Format</label>
                            <textarea
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white h-20 focus:outline-none focus:border-neon-purple text-xs"
                                value={formData.outputFormat}
                                onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                                placeholder="e.g. Print result"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Constraints</label>
                            <textarea
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white h-20 focus:outline-none focus:border-neon-purple text-xs"
                                value={formData.constraints}
                                onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                                placeholder="e.g. 1 <= N <= 100"
                            />
                        </div>
                    </div>

                    {/* Test Cases */}
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">Test Cases</h3>
                            <Button type="button" size="sm" variant="outline" onClick={addTestCase}>
                                <FiPlus className="mr-1" /> Add Case
                            </Button>
                        </div>

                        {formData.testCases.map((tc, index) => (
                            <div key={tc.id || index} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 relative">
                                <button
                                    type="button"
                                    onClick={() => removeTestCase(index)}
                                    className="absolute top-2 right-2 text-slate-500 hover:text-red-500"
                                >
                                    <FiX />
                                </button>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400">Input</label>
                                        <textarea
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono text-slate-900 dark:text-white"
                                            value={tc.input}
                                            onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                            rows={2}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400">Expected Output</label>
                                        <textarea
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono text-slate-900 dark:text-white"
                                            value={tc.expectedOutput}
                                            onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                                            rows={2}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={tc.isPublic}
                                            onChange={(e) => handleTestCaseChange(index, 'isPublic', e.target.checked)}
                                            className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-neon-purple focus:ring-neon-purple"
                                        />
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Sample Case (Visible to student)</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1 bg-neon-purple border-none hover:bg-purple-600"
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : (editingId ? 'Update Question' : 'Create Question')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default QuestionBank;
