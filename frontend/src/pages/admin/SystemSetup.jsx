import { useState, useEffect } from 'react';
import { FiPlus, FiCalendar, FiClock, FiTrash2, FiCheckCircle, FiUpload, FiList, FiAlertCircle, FiArrowRight, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input'; // Assuming Input component exists
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
    { order: 1, time: '08:00 - 08:50' },
    { order: 2, time: '08:50 - 09:40' },
    { order: 3, time: '09:45 - 10:35' },
    { order: 4, time: '10:40 - 11:30' },
    { order: 5, time: '11:35 - 12:25' },
    { order: 6, time: '12:30 - 13:20' }, // 24h fix
    { order: 7, time: '13:25 - 14:15' }, // 24h fix
    { order: 8, time: '14:20 - 15:10' }, // 24h fix
    { order: 9, time: '15:10 - 16:00' }, // 24h fix
    { order: 10, time: '16:00 - 16:50' }, // 24h fix
    { order: 11, time: '16:50 - 17:30' }, // 24h fix
    { order: 12, time: '17:30 - 18:10' }  // 24h fix
];

const AdminSystemSetup = () => {
    const [activeTab, setActiveTab] = useState('semesters');
    const [loading, setLoading] = useState(false);

    // Semesters State
    const [semesters, setSemesters] = useState([]);
    const [semesterStats, setSemesterStats] = useState(null);
    const [newSemester, setNewSemester] = useState({ name: '', academicYear: '', startDate: '', endDate: '' });
    const [editingSemester, setEditingSemester] = useState(null);

    // Slots State
    const [slots, setSlots] = useState([]);

    // Templates State
    const [templates, setTemplates] = useState([]);
    const [newTemplate, setNewTemplate] = useState({
        semesterId: '',
        batch: '1',
        section: '',
        group: '1',
        courseCode: '',
        courseName: '',
        venue: '',
        labSlots: [] // Array of slot IDs
    });

    // Slot Timetable State
    const [slotTimetable, setSlotTimetable] = useState([]);
    const [timetableStats, setTimetableStats] = useState(null);
    const [editingSlotMapping, setEditingSlotMapping] = useState(null);
    const [newSlotMapping, setNewSlotMapping] = useState({
        slotCode: '',
        batch: 1,
        day: 'Monday',
        dayNumber: 1,
        hourOrder: 1,
        startTime: '',
        endTime: '',
        semesterId: ''
    });

    const [selectedBatch, setSelectedBatch] = useState(1);
    const [selectedSemesterTimetable, setSelectedSemesterTimetable] = useState('');

    const handleAddInGrid = (day, hour) => {
        setEditingSlotMapping(null);
        setNewSlotMapping({
            ...newSlotMapping,
            day,
            hourOrder: hour,
            batch: selectedBatch,
            dayNumber: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(day) + 1,
            startTime: TIME_SLOTS.find(ts => ts.order === hour)?.time.split(' - ')[0] || '',
            endTime: TIME_SLOTS.find(ts => ts.order === hour)?.time.split(' - ')[1] || ''
        });
        // Scroll to form or show a highlight
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [showOnlyActive, setShowOnlyActive] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab, selectedSemesterTimetable]);

    // Re-fetch slots when template semester changes
    useEffect(() => {
        if (activeTab === 'templates' && newTemplate.semesterId) {
            const fetchSlotsForTemplate = async () => {
                const res = await adminService.getAllSlotTimetables({ semesterId: newTemplate.semesterId });
                setSlots(res.data?.slots || res.data || []);
            };
            fetchSlotsForTemplate();
        }
    }, [activeTab, newTemplate.semesterId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'semesters') {
                const [res, statsRes] = await Promise.all([
                    adminService.getAllSemesters(),
                    adminService.getSemesterStats()
                ]);
                const data = Array.isArray(res.data) ? res.data : (res.data?.semesters || []);
                setSemesters(data);
                setSemesterStats(statsRes.data?.stats || statsRes.data);
            } else if (activeTab === 'slots') {
                const res = await adminService.getLabSlots();
                const data = res.data?.labSlots || (Array.isArray(res.data) ? res.data : []);
                setSlots(data);
            } else if (activeTab === 'templates') {
                const [tempsRes, semsRes] = await Promise.all([
                    adminService.getAllClassScheduleTemplates(),
                    adminService.getAllSemesters()
                ]);
                setTemplates(tempsRes.data?.templates || tempsRes.data || []);
                const semsData = Array.isArray(semsRes.data) ? semsRes.data : (semsRes.data?.semesters || []);
                setSemesters(semsData);

                // Default to first active semester or any semester
                const defaultSemId = semsData.find(s => s.isActive)?._id || semsData[0]?._id;
                if (!newTemplate.semesterId && defaultSemId) {
                    setNewTemplate(prev => ({ ...prev, semesterId: defaultSemId }));
                }

                const targetSemId = newTemplate.semesterId || defaultSemId;
                if (targetSemId) {
                    const slotsRes = await adminService.getAllSlotTimetables({ semesterId: targetSemId });
                    setSlots(slotsRes.data?.slots || slotsRes.data || []);
                }
            } else if (activeTab === 'slot-timetable') {
                // Fetch semesters first to ensure we have context
                const semsRes = await adminService.getAllSemesters();
                const semsData = Array.isArray(semsRes.data) ? semsRes.data : (semsRes.data?.semesters || []);
                setSemesters(semsData);

                let currentSemId = selectedSemesterTimetable;

                // Handle initial auto-selection
                if (!currentSemId && semsData.length > 0) {
                    const activeSem = semsData.find(s => s.isActive);
                    currentSemId = activeSem?._id || semsData[0]._id;
                    setSelectedSemesterTimetable(currentSemId);
                    // Don't wait for state update to trigger another effect, just use the local ID
                }

                if (currentSemId) {
                    const [res, statsRes] = await Promise.all([
                        adminService.getAllSlotTimetables({ semesterId: currentSemId }),
                        adminService.getSlotTimetableStats({ semesterId: currentSemId })
                    ]);
                    setSlotTimetable(res.data?.slots || res.data || []);
                    setTimetableStats(statsRes.data?.stats || statsRes.data);
                }
            }
        } catch (error) {
            console.error(error);
            // toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSemester = async (e) => {
        e.preventDefault();
        try {
            if (editingSemester) {
                await adminService.updateSemester(editingSemester._id, newSemester);
                toast.success('Semester Updated');
                setEditingSemester(null);
            } else {
                await adminService.createSemester(newSemester);
                toast.success('Semester Created');
            }
            fetchData();
            setNewSemester({ name: '', academicYear: '', startDate: '', endDate: '' });
        } catch (error) {
            toast.error(editingSemester ? 'Failed to update semester' : 'Failed to create semester');
        }
    };

    const handleEditSemester = (semester) => {
        setEditingSemester(semester);
        setNewSemester({
            name: semester.name,
            academicYear: semester.academicYear,
            startDate: semester.startDate ? semester.startDate.split('T')[0] : '',
            endDate: semester.endDate ? semester.endDate.split('T')[0] : ''
        });
    };

    const cancelEdit = () => {
        setEditingSemester(null);
        setNewSemester({ name: '', academicYear: '', startDate: '', endDate: '' });
    };

    const handleActivateSemester = async (id) => {
        try {
            await adminService.activateSemester(id);
            toast.success('Semester Activated');
            fetchData();
        } catch (error) {
            toast.error('Failed to activate semester');
        }
    };

    const handleDeleteSemester = async (id) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await adminService.deleteSemester(id);
            toast.success('Semester Deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete semester');
        }
    };

    const handleCreateSlotMapping = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newSlotMapping, semesterId: selectedSemesterTimetable };
            if (editingSlotMapping) {
                await adminService.updateSlotTimetable(editingSlotMapping._id, payload);
                toast.success('Slot Mapping Updated');
                setEditingSlotMapping(null);
            } else {
                await adminService.createSlotTimetable(payload);
                toast.success('Slot Mapping Created');
            }
            fetchData();
            setNewSlotMapping({
                slotCode: '',
                batch: 1,
                day: 'Monday',
                dayNumber: 1,
                hourOrder: 1,
                startTime: '',
                endTime: '',
                semesterId: selectedSemesterTimetable
            });
        } catch (error) {
            console.error("Slot Mapping Error:", error.response?.data || error.message);
            const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to process mapping';
            toast.error(msg);
        }
    };

    const handleEditSlotMapping = (slot) => {
        setEditingSlotMapping(slot);
        setNewSlotMapping({
            slotCode: slot.slotCode,
            batch: slot.batch,
            day: slot.day,
            dayNumber: slot.dayNumber,
            hourOrder: slot.hourOrder,
            startTime: slot.startTime,
            endTime: slot.endTime,
            semesterId: slot.semesterId || selectedSemesterTimetable
        });
    };

    const cancelEditSlot = () => {
        setEditingSlotMapping(null);
        setNewSlotMapping({
            slotCode: '',
            batch: 1,
            day: 'Monday',
            dayNumber: 1,
            hourOrder: 1,
            startTime: '',
            endTime: '',
            semesterId: selectedSemesterTimetable
        });
    };

    const handleDeleteSlotMapping = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await adminService.deleteSlotTimetable(id);
            toast.success('Slot Mapping Deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete slot mapping');
        }
    };

    const handleExportTimetable = async () => {
        try {
            const res = await adminService.exportSlotTimetable({
                semesterId: selectedSemesterTimetable,
                batch: selectedBatch
            });
            // Create a blob and download
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timetable_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Timetable Exported');
        } catch (error) {
            toast.error('Failed to export timetable');
        }
    };

    const handleBulkImportTimetable = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                // Expected format: { slots: [...] } or just [...]
                const slotsData = Array.isArray(json) ? json : (json.slots || []);

                await adminService.bulkCreateSlotTimetable({
                    semesterId: selectedSemesterTimetable,
                    slots: slotsData,
                    clearExisting: true
                });
                toast.success('Timetable Imported & Overwritten');
                fetchData();
            } catch (error) {
                console.error(error);
                toast.error('Invalid JSON or Import Failed');
            }
        };
        reader.readAsText(file);
    };

    // Lab Slots Handlers
    const [newSlot, setNewSlot] = useState({ slotCode: '', day: 'Monday', startTime: '', endTime: '', batch: '1', hourOrder: '1' });

    const handleCreateLabSlot = async (e) => {
        e.preventDefault();
        try {
            await adminService.createLabSlot(newSlot);
            toast.success('Lab Slot Created');
            fetchData();
            setNewSlot({ slotCode: '', day: 'Monday', startTime: '', endTime: '', batch: '1', hourOrder: '1' });
        } catch (error) {
            toast.error('Failed to create lab slot');
        }
    };

    const handleDeleteLabSlot = async (id) => {
        if (!window.confirm("Delete this slot?")) return;
        try {
            await adminService.deleteLabSlot(id);
            toast.success('Slot Deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete slot');
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        try {
            await adminService.createClassScheduleTemplate(newTemplate);
            toast.success('Template Created');
            fetchData();
            // Reset form but keep some defaults like semester
            setNewTemplate({ ...newTemplate, section: '', courseCode: '', courseName: '', venue: '', labSlots: [] });
        } catch (error) {
            toast.error('Failed to create template');
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm("Delete this template?")) return;
        try {
            await adminService.deleteClassScheduleTemplate(id);
            toast.success('Template Deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const handleBulkImportTemplates = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                // Check if it's array or wrapped in data property
                const data = Array.isArray(json) ? json : (json.data || json.templates || []);

                if (!newTemplate.semesterId) {
                    toast.error("Please select a semester first");
                    return;
                }

                const res = await adminService.bulkImportClassSchedules({
                    semesterId: newTemplate.semesterId,
                    data
                });

                if (res.data.errors && res.data.errors.length > 0) {
                    console.warn("Import Errors:", res.data.errors);
                    toast(t => (
                        <div className="text-xs">
                            <b>Partially Successful</b>
                            <br />Success: {res.data.success}
                            <br />Failed: {res.data.failed}
                            <br /><br />Check console for details.
                        </div>
                    ), { duration: 5000, icon: '⚠️' });
                } else {
                    toast.success(`Imported ${res.data.success} templates`);
                }

                fetchData();
            } catch (error) {
                console.error(error);
                toast.error('Import Failed: ' + (error.response?.data?.error || error.message));
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-6">Schedule Time Setup</h1>

            <div className="flex border-b border-slate-700 mb-6">
                <button
                    onClick={() => setActiveTab('semesters')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'semesters' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Semesters
                </button>
                <button
                    onClick={() => setActiveTab('slots')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'slots' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Lab Slots
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'templates' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Schedule Templates
                </button>
                <button
                    onClick={() => setActiveTab('slot-timetable')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'slot-timetable' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Slot Timetable
                </button>
            </div>

            {
                activeTab === 'semesters' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Semesters Content (Same as before) */}
                        {/* ... (This part was matched by previous Replace, so I should be careful not to overwrite if I can avoid re-specifying everything. But I need to return the whole render function or at least the part I'm replacing) */}
                        {/* Actually, I am replacing from "return (" down to "export default". I'll just re-paste the semesters/slots parts concisely or ensure I don't break them.) */}
                        {/* Better strategy: Only replace the Templates tab content if possible? No, the handlers need to be inside the component body, and the UI is in the return. */}
                        {/* I will assume the previous content is there and just replace the Templates part? No, I need to add handlers too. */}
                        {/* I will use the previous ReplaceFileContent strategy but targeting the bottom of the file where handlers and return are. */}

                        {semesterStats && (
                            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Card className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-sm">Total Semesters</p>
                                        <h3 className="text-2xl font-bold text-white">{semesterStats.total || 0}</h3>
                                    </div>
                                    <FiCalendar className="text-neon-cyan text-2xl" />
                                </Card>
                                <Card
                                    onClick={() => setShowOnlyActive(!showOnlyActive)}
                                    className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${showOnlyActive ? 'ring-2 ring-neon-green bg-neon-green/10 border-neon-green' : 'hover:border-neon-green/50'}`}
                                >
                                    <div>
                                        <p className="text-slate-400 text-sm">Active Semesters</p>
                                        <h3 className="text-xl font-bold text-white">
                                            {semesterStats.activeCount || 0} {semesterStats.activeCount === 1 ? 'Active' : 'Active'}
                                        </h3>
                                        {showOnlyActive && <p className="text-[10px] text-neon-green font-bold animate-pulse">FILTERED</p>}
                                    </div>
                                    <FiCheckCircle className={`${showOnlyActive ? 'text-neon-green' : 'text-slate-500'} text-2xl transition-colors`} />
                                </Card>
                                <Card className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-sm">Academic Years</p>
                                        <h3 className="text-2xl font-bold text-white">{semesterStats.academicYears?.length || 0}</h3>
                                    </div>
                                    <FiClock className="text-purple-400 text-2xl" />
                                </Card>
                            </div>
                        )}

                        <Card className="lg:col-span-1 h-fit">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FiPlus className="text-neon-cyan" /> {editingSemester ? 'Edit Semester' : 'New Semester'}
                            </h3>
                            <form onSubmit={handleCreateSemester} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Semester Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Semester IV"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newSemester.name}
                                        onChange={(e) => setNewSemester({ ...newSemester, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Academic Year</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2024-25"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newSemester.academicYear}
                                        onChange={(e) => setNewSemester({ ...newSemester, academicYear: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSemester.startDate}
                                            onChange={(e) => setNewSemester({ ...newSemester, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSemester.endDate}
                                            onChange={(e) => setNewSemester({ ...newSemester, endDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" variant="primary" className="flex-1 bg-neon-cyan hover:bg-cyan-600 border-none text-black font-bold">
                                        {editingSemester ? 'Update' : 'Create'}
                                    </Button>
                                    {editingSemester && (
                                        <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>

                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <h3 className="text-lg font-bold text-white">
                                    {showOnlyActive ? 'Active Semesters' : 'All Semesters'}
                                </h3>
                                {showOnlyActive && (
                                    <button
                                        onClick={() => setShowOnlyActive(false)}
                                        className="text-xs text-neon-cyan hover:underline"
                                    >
                                        Show All
                                    </button>
                                )}
                            </div>
                            {semesters
                                .filter(sem => !showOnlyActive || sem.isActive)
                                .map((sem) => (
                                    <Card
                                        key={sem._id}
                                        className={`flex items-center justify-between p-4 transition-all cursor-pointer hover:border-neon-cyan/50 active:scale-[0.98] ${sem.isActive ? 'border-neon-green/50 bg-neon-green/5 ring-1 ring-neon-green/20' : 'border-slate-800'}`}
                                        onClick={() => {
                                            setSelectedSemesterTimetable(sem._id);
                                            setActiveTab('slot-timetable');
                                        }}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors">
                                                    {sem.name}
                                                </h4>
                                                {sem.isActive ? (
                                                    <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded-full font-black tracking-tighter uppercase shadow-[0_0_15px_rgba(34,197,94,0.6)]">Active</span>
                                                ) : (
                                                    <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-700 font-bold tracking-wider uppercase">Inactive</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <FiCalendar className="text-neon-cyan" />
                                                    <span>{sem.academicYear}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <span>{sem.startDate ? format(new Date(sem.startDate), 'MMM dd, yyyy') : 'No Date'}</span>
                                                    <FiArrowRight className="text-[10px]" />
                                                    <span>{sem.endDate ? format(new Date(sem.endDate), 'MMM dd, yyyy') : 'No Date'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 border-slate-700 hover:border-neon-cyan hover:text-neon-cyan"
                                                onClick={() => {
                                                    setSelectedSemesterTimetable(sem._id);
                                                    setActiveTab('slot-timetable');
                                                }}
                                            >
                                                <FiEye />
                                            </Button>
                                            {!sem.isActive && (
                                                <Button size="sm" variant="outline" className="text-neon-green border-neon-green/30 hover:bg-neon-green/10" onClick={() => handleActivateSemester(sem._id)}>
                                                    Activate
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" onClick={() => handleEditSemester(sem)}>
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
                                                onClick={() => handleDeleteSemester(sem._id)}
                                            >
                                                <FiTrash2 />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            {semesters.length === 0 && <p className="text-slate-500 text-center py-10">No semesters found.</p>}
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'slots' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Create Lab Slot Form */}
                        <Card className="lg:col-span-1 h-fit">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FiPlus className="text-neon-cyan" /> New Lab Slot
                            </h3>
                            <form onSubmit={handleCreateLabSlot} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Slot Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. P1"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newSlot.slotCode}
                                        onChange={(e) => setNewSlot({ ...newSlot, slotCode: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Day</label>
                                        <select
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlot.day}
                                            onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Batch</label>
                                        <select
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlot.batch}
                                            onChange={(e) => setNewSlot({ ...newSlot, batch: e.target.value })}
                                        >
                                            <option value="1">Batch 1</option>
                                            <option value="2">Batch 2</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlot.startTime}
                                            onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlot.endTime}
                                            onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Hour Order</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newSlot.hourOrder}
                                        onChange={(e) => setNewSlot({ ...newSlot, hourOrder: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="primary" className="w-full bg-neon-cyan hover:bg-cyan-600 border-none text-black font-bold">
                                    Create Slot
                                </Button>
                            </form>
                        </Card>

                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex justify-end mb-4">
                                <Button className="bg-slate-800 hover:bg-slate-700">
                                    <FiUpload className="mr-2" /> Bulk Import Slots (CSV)
                                </Button>
                            </div>
                            <Card className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                            <th className="p-4">Code</th>
                                            <th className="p-4">Day</th>
                                            <th className="p-4">Time</th>
                                            <th className="p-4">Batch</th>
                                            <th className="p-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {slots.length > 0 ? slots.map(slot => (
                                            <tr key={slot._id} className="hover:bg-slate-800/30">
                                                <td className="p-4 font-mono text-neon-cyan">{slot.slotCode}</td>
                                                <td className="p-4">{slot.day}</td>
                                                <td className="p-4">{slot.startTime} - {slot.endTime}</td>
                                                <td className="p-4">Batch {slot.batch}</td>
                                                <td className="p-4">
                                                    <button
                                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                                        onClick={() => handleDeleteLabSlot(slot._id)}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-slate-500">
                                                    No slots configured. Check Section 4.2 of API Docs.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'templates' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Create Template Form */}
                        <Card className="lg:col-span-1 h-fit">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FiPlus className="text-neon-cyan" /> New Template
                                </h3>
                                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded flex items-center gap-1 text-neon-cyan transition-colors border border-slate-700 hover:border-neon-cyan/50">
                                    <FiUpload /> Import JSON
                                    <input type="file" accept=".json" className="hidden" onChange={handleBulkImportTemplates} />
                                </label>
                            </div>
                            <form onSubmit={handleCreateTemplate} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Semester</label>
                                    <select
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newTemplate.semesterId}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, semesterId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Semester</option>
                                        {semesters.map(sem => (
                                            <option key={sem._id} value={sem._id}>{sem.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Batch</label>
                                        <select
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newTemplate.batch}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, batch: e.target.value })}
                                        >
                                            <option value="1">Batch 1</option>
                                            <option value="2">Batch 2</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Group</label>
                                        <select
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newTemplate.group}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, group: e.target.value })}
                                        >
                                            <option value="1">Group 1</option>
                                            <option value="2">Group 2</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Section</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. A1"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newTemplate.section}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, section: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Course</label>
                                    <input
                                        type="text"
                                        placeholder="Code (e.g. 21CSC204J)"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan mb-2"
                                        value={newTemplate.courseCode}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, courseCode: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Name (e.g. Algorithms)"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newTemplate.courseName}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, courseName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2 flex justify-between items-center">
                                        <span>Lab Slots (Click to Select)</span>
                                        {newTemplate.labSlots?.length > 0 && (
                                            <span className="text-neon-cyan text-[10px] font-bold uppercase tracking-wider bg-neon-cyan/10 px-2 py-0.5 rounded">
                                                {newTemplate.labSlots.length} Selected
                                            </span>
                                        )}
                                    </label>
                                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg min-h-[120px] max-h-[300px] overflow-y-auto space-y-4 shadow-inner">
                                        {slots && slots.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {slots.filter(s => s.batch == newTemplate.batch).map(slot => {
                                                    const isSelected = newTemplate.labSlots.includes(slot._id);
                                                    return (
                                                        <button
                                                            key={slot._id}
                                                            type="button"
                                                            onClick={() => {
                                                                const currentSlots = [...newTemplate.labSlots];
                                                                const index = currentSlots.indexOf(slot._id);
                                                                if (index > -1) {
                                                                    currentSlots.splice(index, 1);
                                                                } else {
                                                                    currentSlots.push(slot._id);
                                                                }
                                                                setNewTemplate({ ...newTemplate, labSlots: currentSlots });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-300 flex items-center gap-2
                                                            ${isSelected
                                                                    ? 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(57,255,20,0.2)] scale-105'
                                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                                                }`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-neon-green animate-pulse' : 'bg-slate-600'}`}></span>
                                                            {slot.slotCode}
                                                            <span className="opacity-50 text-[10px]">({slot.startTime})</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <FiAlertCircle className="text-slate-600 text-2xl mb-2" />
                                                <p className="text-sm text-slate-500 max-w-[200px]">No timetable slots found for this semester/batch</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Venue</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TP008"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newTemplate.venue}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, venue: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" variant="primary" className="w-full bg-neon-cyan hover:bg-cyan-600 border-none text-black font-bold">
                                    Create Template
                                </Button>
                            </form>
                        </Card>

                        <div className="lg:col-span-2 space-y-4">
                            <Card className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                            <th className="p-4">Sem/Sec</th>
                                            <th className="p-4">Course</th>
                                            <th className="p-4">Applies To</th>
                                            <th className="p-4">Slots</th>
                                            <th className="p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {templates.length > 0 ? templates.map(t => (
                                            <tr key={t._id} className="hover:bg-slate-800/30">
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{t.section}</div>
                                                    <div className="text-xs text-slate-500">Sem: {t.semester?.name || 'N/A'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-neon-cyan">{t.courseCode}</div>
                                                    <div className="text-xs">{t.courseName}</div>
                                                </td>
                                                <td className="p-4 text-sm">
                                                    Batch {t.batch} / Grp {t.group}
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-slate-700 px-2 py-1 rounded text-xs">
                                                        {t.labSlots?.length} Slots
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                                        onClick={() => handleDeleteTemplate(t._id)}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-slate-500">
                                                    No templates found. Create one to get started.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    </div>
                )
            }
            {
                activeTab === 'slot-timetable' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-1 h-fit">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FiPlus className="text-neon-cyan" /> {editingSlotMapping ? 'Edit Mapping' : 'New Slot Mapping'}
                            </h3>
                            <form onSubmit={handleCreateSlotMapping} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Target Semester</label>
                                    <select
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={selectedSemesterTimetable}
                                        onChange={(e) => setSelectedSemesterTimetable(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Semester</option>
                                        {semesters.map(sem => (
                                            <option key={sem._id} value={sem._id}>{sem.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Slot Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. P1, P47"
                                        className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                        value={newSlotMapping.slotCode}
                                        onChange={(e) => setNewSlotMapping({ ...newSlotMapping, slotCode: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Batch</label>
                                        <select
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlotMapping.batch}
                                            onChange={(e) => setNewSlotMapping({ ...newSlotMapping, batch: parseInt(e.target.value) })}
                                        >
                                            <option value="1">Batch 1</option>
                                            <option value="2">Batch 2</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Hour Order</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlotMapping.hourOrder}
                                            onChange={(e) => setNewSlotMapping({ ...newSlotMapping, hourOrder: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Day</label>
                                        <select
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlotMapping.day}
                                            onChange={(e) => setNewSlotMapping({ ...newSlotMapping, day: e.target.value, dayNumber: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(e.target.value) + 1 })}
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Day Number</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlotMapping.dayNumber}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlotMapping.startTime}
                                            onChange={(e) => setNewSlotMapping({ ...newSlotMapping, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-800 border-none rounded p-2 text-white focus:ring-1 focus:ring-neon-cyan"
                                            value={newSlotMapping.endTime}
                                            onChange={(e) => setNewSlotMapping({ ...newSlotMapping, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" variant="primary" className="flex-1 bg-neon-cyan hover:bg-cyan-600 border-none text-black font-bold">
                                        {editingSlotMapping ? 'Update' : 'Add Mapping'}
                                    </Button>
                                    {editingSlotMapping && (
                                        <Button type="button" variant="outline" onClick={cancelEditSlot} className="flex-1">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
                                    {[1, 2].map(b => (
                                        <button
                                            key={b}
                                            onClick={() => setSelectedBatch(b)}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${selectedBatch === b ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(6,255,255,0.3)]' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Batch {b}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer">
                                        <input type="file" accept=".json" className="hidden" onChange={handleBulkImportTimetable} />
                                        <div className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white flex items-center gap-2 transition-colors">
                                            <FiUpload /> Import JSON
                                        </div>
                                    </label>
                                    <Button variant="outline" size="sm" className="text-red-400 border-red-500/30" onClick={() => { if (window.confirm('Delete ALL mappings?')) adminService.deleteAllSlotTimetables().then(() => { toast.success('All cleared'); fetchData(); }) }}>
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            </div>

                            <Card className="p-0 overflow-hidden border-slate-700">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-slate-800">
                                        <thead>
                                            <tr className="bg-slate-900">
                                                <th className="p-3 border border-slate-800 text-slate-500 text-xs uppercase text-left w-24">Day / Slot</th>
                                                {TIME_SLOTS.map(slot => {
                                                    const isSpecial = slot.order === 11 || slot.order === 12;
                                                    return (
                                                        <th key={slot.order} className={`p-3 border border-slate-800 min-w-[100px] ${isSpecial ? 'bg-blue-600' : ''}`}>
                                                            <div className={`${isSpecial ? 'text-white' : 'text-neon-cyan'} text-sm`}>{slot.order}</div>
                                                            <div className={`text-[10px] ${isSpecial ? 'text-blue-100' : 'text-slate-500'} font-normal`}>{slot.time}</div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {DAYS.map(day => (
                                                <tr key={day} className="hover:bg-slate-800/20">
                                                    <td className="p-3 border border-slate-800 bg-slate-900/50 font-bold text-slate-300 text-sm">{day}</td>
                                                    {TIME_SLOTS.map(slot => {
                                                        const cellData = slotTimetable.find(s =>
                                                            s.day?.toString().trim().toLowerCase() === day.trim().toLowerCase() &&
                                                            Number(s.hourOrder) === Number(slot.order) &&
                                                            Number(s.batch) === Number(selectedBatch)
                                                        );
                                                        const isPractical = cellData?.slotCode?.startsWith('P') || cellData?.slotCode?.startsWith('L');
                                                        const isSpecial = slot.order === 11 || slot.order === 12;

                                                        return (
                                                            <td
                                                                key={slot.order}
                                                                className={`p-3 border border-slate-800 text-center transition-colors cursor-pointer group relative min-h-[60px] ${isSpecial ? 'bg-blue-600 hover:bg-blue-700' : (cellData ? (isPractical ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'bg-blue-500/10 hover:bg-blue-500/20') : 'hover:bg-slate-800/40')}`}
                                                                onClick={() => cellData ? handleEditSlotMapping(cellData) : handleAddInGrid(day, slot.order)}
                                                            >
                                                                {cellData ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={`font-bold text-lg ${isSpecial ? 'text-white' : (isPractical ? 'text-emerald-400' : 'text-blue-400')}`}>
                                                                            {cellData.slotCode}
                                                                        </span>
                                                                        <button
                                                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 p-1 hover:bg-red-500/20 rounded"
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteSlotMapping(cellData._id); }}
                                                                        >
                                                                            <FiTrash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-700 text-xs opacity-0 hover:opacity-100">+</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            <div className="flex gap-4 items-center justify-center p-4 bg-slate-800/20 rounded-lg border border-slate-700 text-sm italic text-slate-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500/30 rounded"></div> Theory Slots
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-emerald-500/30 rounded"></div> Practical Slots (P/L)
                                </div>
                            </div>

                            {/* Unmapped Slots Section */}
                            {slotTimetable.filter(s =>
                                !DAYS.some(d => d.trim().toLowerCase() === s.day?.toString().trim().toLowerCase()) ||
                                !TIME_SLOTS.some(ts => Number(ts.order) === Number(s.hourOrder)) ||
                                Number(s.batch) !== Number(selectedBatch)
                            ).length > 0 && (
                                    <Card className="border-red-500/30 bg-red-500/5 mt-4">
                                        <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                            <FiAlertCircle /> Hidden Slots (Data Mismatch)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {slotTimetable.filter(s =>
                                                !DAYS.some(d => d.trim().toLowerCase() === s.day?.toString().trim().toLowerCase()) ||
                                                !TIME_SLOTS.some(ts => Number(ts.order) === Number(s.hourOrder)) ||
                                                Number(s.batch) !== Number(selectedBatch)
                                            ).map((s, i) => (
                                                <div key={i} className="text-[10px] bg-slate-900/50 p-2 rounded flex justify-between items-center border border-slate-800">
                                                    <span>
                                                        <b className="text-neon-cyan">{s.slotCode}</b>: {s.day || 'No-Day'} / H{s.hourOrder || '?'} / B{s.batch || '?'}
                                                    </span>
                                                    <button onClick={() => handleDeleteSlotMapping(s._id)} className="text-red-500 hover:text-red-400 ml-2">
                                                        <FiTrash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 italic">* Slots appear here if their Day/Hour/Batch doesn't match the current Grid view (e.g. they are in the other Batch or have a typo in Day).</p>
                                    </Card>
                                )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminSystemSetup;
