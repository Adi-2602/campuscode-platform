import { useEffect, useRef, useState, useCallback } from 'react';
import studentService from '../services/studentService';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';

/**
 * Custom hook for auto-saving code drafts
 * @param {string} examId - ID of the current exam
 * @param {string} questionId - ID of the current question
 * @param {string} code - Current code content
 * @param {number} languageId - ID of the programming language
 * @param {number} intervalMs - Auto-save interval in milliseconds (default: 30000 = 30s)
 */
const useAutoSave = (examId, questionId, code, languageId, intervalMs = Number(import.meta.env.VITE_AUTOSAVE_INTERVAL_MS) || 30000) => {
    const [lastSaved, setLastSaved] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Ref to store latest values without triggering re-renders in effects
    const latestData = useRef({ code, languageId });

    useEffect(() => {
        latestData.current = { code, languageId };
    }, [code, languageId]);

    const saveDraft = useCallback(async () => {
        if (!examId || !questionId) return;

        // Don't save if code is empty
        if (!latestData.current.code) return;

        setIsSaving(true);
        try {
            await studentService.autoSaveDraft(
                examId,
                questionId,
                latestData.current.code,
                latestData.current.languageId
            );
            setLastSaved(new Date());
            setError(null);
            // Optional: Toast can be annoying if shown every 30s, maybe show only on error or subtle indicator
            // toast.success('Draft auto-saved'); 
        } catch (err) {
            console.error('Auto-save failed:', err);
            setError(err);
            toast.error('Failed to auto-save draft');
        } finally {
            setIsSaving(false);
        }
    }, [examId, questionId]);

    // Periodic Auto-save
    useEffect(() => {
        const timer = setInterval(() => {
            saveDraft();
        }, intervalMs);

        return () => clearInterval(timer);
    }, [saveDraft, intervalMs]);

    // Debounced Save for manual triggers (e.g., Ctrl+S or user pause)
    const debouncedSave = useCallback(
        debounce(() => {
            saveDraft();
        }, 2000),
        [saveDraft]
    );

    return { lastSaved, isSaving, error, triggerSave: saveDraft, debouncedSave };
};

export default useAutoSave;
