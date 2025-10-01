// pages/learn/edit-learning_material/[id].js
import Head from 'next/head';
import MainSidebar from '../../../../components/Sidebars/MainSidebar';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
    FaArrowLeft,
    FaSave,
    FaTrash,
    FaBook,
    FaPlus,
    FaTimes,
    FaCheck,
    FaChevronDown,
    FaChevronUp,
    FaGripVertical,
    FaPencilAlt,
    FaUniversity,
    FaCalendarAlt,
    FaClipboardList,
    FaLightbulb,
    FaEdit,
    FaInfoCircle
} from 'react-icons/fa';

export default function EditLearning_materialPage() {
    const router = useRouter();
    const { id } = router.query;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'content'

    // Learning_material info state
    const [learning_materialInfo, setLearning_materialInfo] = useState({
        title: '',
        //learning_materials: '',  // <- REMOVE THIS LINE
        institution: '',
        description: '',
        study_goal: '',
        start_date: '',
        end_date: '',
    });

    // Sections state
    const [sections, setSections] = useState([]);
    const [currentSection, setCurrentSection] = useState({
        title: '',
        description: '',
        grammar: [],
        vocabulary: [],
        isExpanded: true
    });

    const [editingSectionId, setEditingSectionId] = useState(null);
    const [showGrammarForm, setShowGrammarForm] = useState(false);
    const [showVocabForm, setShowVocabForm] = useState(false);

    // Grammar/Vocab forms
    const [currentGrammar, setCurrentGrammar] = useState({
        point: '',
        explanation: '',
        examples: ['']
    });

    const [currentVocab, setCurrentVocab] = useState({
        word: '',
        reading: '',
        meaning: '',
        examples: [''],
        tags: []
    });

    // Load learning_material data
    useEffect(() => {
        if (!router.isReady) return;
        loadLearning_material();
    }, [router.isReady, id]);

    const loadLearning_material = async () => {
        try {
            setLoading(true);
            const resp = await fetch(`/api/database/v1/learning_materials/${id}`);
            if (!resp.ok) throw new Error('Failed to load learning_material');

            const { learning_material, sections: loadedSections } = await resp.json();

            // Set learning_material info
            setLearning_materialInfo({
                title: learning_material.title || '',
                //learning_materials: learning_material.learning_materials || '',
                institution: learning_material.institution || '',
                description: learning_material.description || '',
                study_goal: learning_material.study_goal || '',
                start_date: learning_material.start_date || '',
                end_date: learning_material.end_date || '',
            });

            // Load sections with full content
            if (loadedSections && loadedSections.length > 0) {
                // Fetch detailed section content
                const sectionsWithContent = await Promise.all(
                    loadedSections.map(async (section) => {
                        const contentResp = await fetch(`/api/database/v1/sections/${section.id}`);
                        if (contentResp.ok) {
                            const { section: fullSection } = await contentResp.json();
                            return {
                                ...fullSection,
                                isExpanded: false
                            };
                        }
                        return { ...section, grammar: [], vocabulary: [], isExpanded: false };
                    })
                );
                setSections(sectionsWithContent);
            }
        } catch (e) {
            console.error(e);
            setError('Could not load learning_material.');
        } finally {
            setLoading(false);
        }
    };

    const deleteGrammarPoint = async (sectionId, grammarId) => {
        try {
            // Remove from local state
            setSections(prev => prev.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        grammar: section.grammar.filter(g => g.id !== grammarId)
                    };
                }
                return section;
            }));

            // If we're editing this section, also update current section
            if (editingSectionId === sectionId) {
                setCurrentSection(prev => ({
                    ...prev,
                    grammar: prev.grammar.filter(g => g.id !== grammarId)
                }));
            }
        } catch (e) {
            console.error('Error deleting grammar:', e);
            setError('Failed to delete grammar point');
        }
    };

    const deleteVocabulary = async (sectionId, vocabId) => {
        try {
            // Remove from local state
            setSections(prev => prev.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        vocabulary: section.vocabulary.filter(v => v.id !== vocabId)
                    };
                }
                return section;
            }));

            // If we're editing this section, also update current section
            if (editingSectionId === sectionId) {
                setCurrentSection(prev => ({
                    ...prev,
                    vocabulary: prev.vocabulary.filter(v => v.id !== vocabId)
                }));
            }
        } catch (e) {
            console.error('Error deleting vocabulary:', e);
            setError('Failed to delete vocabulary item');
        }
    };

    // Handle learning_material info changes
    const handleLearning_materialInfoChange = (field, value) => {
        setLearning_materialInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Section management functions
    const startEditingSection = (section) => {
        setCurrentSection({
            title: section.title || '',
            description: section.description || '',
            grammar: section.grammar || [],
            vocabulary: section.vocabulary || [],
            isExpanded: true
        });
        setEditingSectionId(section.id);
        setShowGrammarForm(false);
        setShowVocabForm(false);
        setActiveTab('content');
    };

    const cancelEditing = () => {
        setCurrentSection({
            title: '',
            description: '',
            grammar: [],
            vocabulary: [],
            isExpanded: true
        });
        setEditingSectionId(null);
        setShowGrammarForm(false);
        setShowVocabForm(false);
    };

    const addGrammarPoint = () => {
        if (currentGrammar.point && currentGrammar.explanation) {
            setCurrentSection(prev => ({
                ...prev,
                grammar: [...prev.grammar, { ...currentGrammar, id: Date.now() }]
            }));
            setCurrentGrammar({ point: '', explanation: '', examples: [''] });
            setShowGrammarForm(false);
        }
    };

    const addVocabulary = () => {
        if (currentVocab.word && currentVocab.meaning) {
            setCurrentSection(prev => ({
                ...prev,
                vocabulary: [...prev.vocabulary, { ...currentVocab, id: Date.now() }]
            }));
            setCurrentVocab({ word: '', reading: '', meaning: '', examples: [''], tags: [] });
            setShowVocabForm(false);
        }
    };

    const addExample = (type) => {
        if (type === 'grammar') {
            setCurrentGrammar(prev => ({
                ...prev,
                examples: [...prev.examples, '']
            }));
        } else {
            setCurrentVocab(prev => ({
                ...prev,
                examples: [...prev.examples, '']
            }));
        }
    };

    const updateExample = (type, index, value) => {
        if (type === 'grammar') {
            setCurrentGrammar(prev => ({
                ...prev,
                examples: prev.examples.map((ex, i) => i === index ? value : ex)
            }));
        } else {
            setCurrentVocab(prev => ({
                ...prev,
                examples: prev.examples.map((ex, i) => i === index ? value : ex)
            }));
        }
    };

    const removeExample = (type, index) => {
        if (type === 'grammar') {
            setCurrentGrammar(prev => ({
                ...prev,
                examples: prev.examples.filter((_, i) => i !== index)
            }));
        } else {
            setCurrentVocab(prev => ({
                ...prev,
                examples: prev.examples.filter((_, i) => i !== index)
            }));
        }
    };

    const saveSection = () => {
        if (!currentSection.title) return;

        if (editingSectionId) {
            setSections(prev =>
                prev.map(s =>
                    s.id === editingSectionId ? { ...currentSection, id: editingSectionId } : s
                )
            );
            setEditingSectionId(null);
        } else {
            setSections(prev => [...prev, { ...currentSection, id: Date.now() }]);
        }

        setCurrentSection({
            title: '',
            description: '',
            grammar: [],
            vocabulary: [],
            isExpanded: true
        });
        setShowGrammarForm(false);
        setShowVocabForm(false);
    };

    const removeSection = (sectionId) => {
        setSections(prev => prev.filter(section => section.id !== sectionId));
    };

    const removeGrammarFromSection = (grammarId) => {
        setCurrentSection(prev => ({
            ...prev,
            grammar: prev.grammar.filter(g => g.id !== grammarId)
        }));
    };

    const removeVocabFromSection = (vocabId) => {
        setCurrentSection(prev => ({
            ...prev,
            vocabulary: prev.vocabulary.filter(v => v.id !== vocabId)
        }));
    };

    const toggleSectionExpansion = (sectionId) => {
        setSections(prev => prev.map(section =>
            section.id === sectionId ? { ...section, isExpanded: !section.isExpanded } : section
        ));
    };

    // Save all changes
    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccessMessage('');

            // Save learning_material info first
            const infoResp = await fetch(`/api/database/v1/learning_materials/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: learning_materialInfo.title,
                    //learning_materials: learning_materialInfo.learning_materials,
                    institution: learning_materialInfo.institution,
                    description: learning_materialInfo.description,
                    study_goal: learning_materialInfo.study_goal,
                    start_date: learning_materialInfo.start_date,
                    end_date: learning_materialInfo.end_date,
                }),
            });

            if (!infoResp.ok) {
                const data = await infoResp.json().catch(() => ({}));
                throw new Error(data.error || 'Save failed');
            }

            // Include the current editing section in the sections array if it exists
            let allSections = [...sections];
            if (editingSectionId && currentSection.title) {
                // Update the section being edited
                allSections = allSections.map(s =>
                    s.id === editingSectionId ? { ...currentSection, id: editingSectionId } : s
                );
            } else if (!editingSectionId && currentSection.title) {
                // Add new section if it's not empty
                allSections.push({ ...currentSection, id: `temp_${Date.now()}` });
            }

            // Save sections
            const sectionsPayload = {
                sections: allSections.map((s, index) => ({
                    id: s.id?.toString().startsWith('temp_') ? null : s.id, // Remove temp IDs
                    title: s.title,
                    description: s.description,
                    order: index,
                    grammar: (s.grammar || []).map(g => ({
                        point: g.point,
                        explanation: g.explanation,
                        examples: (g.examples || []).filter(ex => ex.trim())
                    })),
                    vocabulary: (s.vocabulary || []).map(v => ({
                        word: v.word,
                        reading: v.reading,
                        meaning: v.meaning,
                        examples: (v.examples || []).filter(ex => ex.trim()),
                        tags: v.tags || []
                    }))
                }))
            };

            const sectionsResp = await fetch(`/api/database/v1/learning_materials/${id}/sections`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sectionsPayload),
            });

            if (!sectionsResp.ok) {
                const data = await sectionsResp.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to save sections');
            }

            // Clear editing state and reload
            setCurrentSection({
                title: '',
                description: '',
                grammar: [],
                vocabulary: [],
                isExpanded: true
            });
            setEditingSectionId(null);
            setShowGrammarForm(false);
            setShowVocabForm(false);

            // Reload the learning_material to get updated data
            await loadLearning_material();

            setSuccessMessage('Learning_material updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (e) {
            console.error(e);
            setError(e.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLearning_material = async () => {
        if (!confirm('Delete this learning material and all its content? This cannot be undone.')) return;
        try {
            setDeleting(true);
            setError(null);
            const resp = await fetch(`/api/database/v1/learning_materials/${id}`, { method: 'DELETE' });
            if (!resp.ok && resp.status !== 204) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(data.error || 'Delete failed');
            }
            router.push('/learn/home');
        } catch (e) {
            console.error(e);
            setError(e.message || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
                <MainSidebar />
                <main className="ml-auto flex-1 px-8 py-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#e30a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading learning material...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
            <MainSidebar />

            <main className="ml-auto max-h-screen overflow-scroll flex-1 px-8 py-6">
                <Head>
                    <title>Edit Learning_material • ReBabel</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 transition-colors"
                    >
                        <FaArrowLeft />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700/50">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Edit Learning Material
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Update learning material information and manage sections
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white font-medium disabled:opacity-60 hover:shadow-lg transition-all"
                                >
                                    <FaSave />
                                    {saving ? 'Saving...' : 'Save All Changes'}
                                </button>
                                <button
                                    onClick={handleDeleteLearning_material}
                                    disabled={deleting}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium disabled:opacity-60 hover:bg-red-200 dark:hover:bg-red-900/30 transition-all"
                                >
                                    <FaTrash />
                                    {deleting ? 'Deleting...' : 'Delete Learning Material'}
                                </button>
                            </div>
                        </div>

                        {/* Success/Error Messages */}
                        {successMessage && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2 border border-green-200 dark:border-green-800/50">
                                <FaCheck />
                                {successMessage}
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2 border border-red-200 dark:border-red-800/50">
                                <FaTimes />
                                {error}
                            </div>
                        )}

                        {/* Tab Navigation */}
                        <div className="flex gap-1 mt-6 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`flex-1 px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'info'
                                    ? 'bg-white dark:bg-[#243642] text-[#e30a5f] shadow-sm border border-gray-200 dark:border-gray-600/50'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <FaInfoCircle />
                                Learning Material Information
                            </button>
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`flex-1 px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'content'
                                    ? 'bg-white dark:bg-[#243642] text-[#e30a5f] shadow-sm border border-gray-200 dark:border-gray-600/50'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <FaClipboardList />
                                Sections & Content ({sections.length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'info' ? (
                    <Learning_materialInfoTab
                        learning_materialInfo={learning_materialInfo}
                        onChange={handleLearning_materialInfoChange}
                        sections={sections}
                    />
                ) : (
                    <SectionsTab
                        sections={sections}
                        currentSection={currentSection}
                        setCurrentSection={setCurrentSection}
                        editingSectionId={editingSectionId}
                        showGrammarForm={showGrammarForm}
                        setShowGrammarForm={setShowGrammarForm}
                        showVocabForm={showVocabForm}
                        setShowVocabForm={setShowVocabForm}
                        currentGrammar={currentGrammar}
                        setCurrentGrammar={setCurrentGrammar}
                        currentVocab={currentVocab}
                        setCurrentVocab={setCurrentVocab}
                        actions={{
                            startEditingSection,
                            cancelEditing,
                            addGrammarPoint,
                            addVocabulary,
                            addExample,
                            updateExample,
                            removeExample,
                            saveSection,
                            removeSection,
                            removeGrammarFromSection,
                            removeVocabFromSection,
                            toggleSectionExpansion,
                            deleteGrammarPoint,
                            deleteVocabulary,
                        }}
                    />
                )}
            </main>
        </div>
    );
}

// Learning_material Info Tab Component
function Learning_materialInfoTab({ learning_materialInfo, onChange, sections }) {
    return (
        <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <FaBook className="text-[#e30a5f]" />
                Learning Material Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Learning Material Title *
                    </label>
                    <input
                        type="text"
                        value={learning_materialInfo.title}
                        onChange={(e) => onChange('title', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#243642] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>

                {/*<div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Learning Materials *
                    </label>
                    <input
                        type="text"
                        value={learning_materialInfo.learning_materials}
                        onChange={(e) => onChange('learning_materials', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#243642] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>*/}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Institution
                    </label>
                    <select
                        value={learning_materialInfo.institution}
                        onChange={(e) => onChange('institution', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#243642] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
                    >
                        <option value="Self-Study">Self-Study</option>
                        <option value="University">University</option>
                        <option value="Language School">Language School</option>
                        <option value="Online Learning_material">Online Learning_material</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Study Goal
                    </label>
                    <input
                        type="text"
                        value={learning_materialInfo.study_goal}
                        onChange={(e) => onChange('study_goal', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#243642] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={learning_materialInfo.start_date}
                        onChange={(e) => onChange('start_date', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#243642] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target End Date
                    </label>
                    <input
                        type="date"
                        value={learning_materialInfo.end_date}
                        onChange={(e) => onChange('end_date', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#243642] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                    </label>
                    <textarea
                        value={learning_materialInfo.description}
                        onChange={(e) => onChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#243642] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent resize-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Learning_material Stats */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-[#243642] rounded-lg border border-gray-200 dark:border-gray-600/50">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Learning Material Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-[#e30a5f]">
                            {sections.length}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Sections</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {sections.reduce((acc, s) => acc + (s.grammar?.length || 0), 0)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Grammar Points</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {sections.reduce((acc, s) => acc + (s.vocabulary?.length || 0), 0)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Vocabulary Items</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sections Tab Component
function SectionsTab({
    sections,
    currentSection,
    setCurrentSection,
    editingSectionId,
    showGrammarForm,
    setShowGrammarForm,
    showVocabForm,
    setShowVocabForm,
    currentGrammar,
    setCurrentGrammar,
    currentVocab,
    setCurrentVocab,
    actions,
}) {
    const isEditing = Boolean(editingSectionId);

    return (
        <div className="space-y-6">
            {/* Existing Sections */}
            {sections.length > 0 && (
                <div className="bg-white dark:bg-[#1a2732] rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Learning Material Sections
                    </h3>
                    <div className="space-y-3">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                className="border border-gray-200 dark:border-gray-600/50 rounded-lg overflow-hidden"
                            >
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#243642] transition-colors"
                                    onClick={() => actions.toggleSectionExpansion(section.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <FaGripVertical className="text-gray-400 dark:text-gray-500" />
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                Section {index + 1}: {section.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {section.grammar?.length || 0} grammar • {section.vocabulary?.length || 0} vocabulary
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                actions.startEditingSection(section);
                                            }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                actions.removeSection(section.id);
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <FaTrash />
                                        </button>
                                        <span className="text-gray-400 dark:text-gray-500">
                                            {section.isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                        </span>
                                    </div>
                                </div>

                                {section.isExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600/50 bg-gray-50 dark:bg-[#0f1419]/30">
                                        {section.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 mb-4">
                                                {section.description}
                                            </p>
                                        )}

                                        {section.grammar?.length > 0 && (
                                            <div className="mb-4">
                                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Grammar Points
                                                </h5>
                                                <div className="space-y-2">
                                                    {section.grammar.map((g) => (
                                                        <div key={g.id} className="bg-white dark:bg-[#243642] p-3 rounded-lg border border-gray-200 dark:border-gray-600/50 flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                                    {g.point}
                                                                </p>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                    {g.explanation}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => actions.deleteGrammarPoint(section.id, g.id)}
                                                                className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs"
                                                                title="Delete grammar point"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {section.vocabulary?.length > 0 && (
                                            <div>
                                                <h5 className="text-sm pt-2 font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Vocabulary
                                                </h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {section.vocabulary.map((v) => (
                                                        <span
                                                            key={v.id}
                                                            className="relative group px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                                                        >
                                                            <span>{v.word} - {v.meaning}</span>
                                                            <button
                                                                onClick={() => actions.deleteVocabulary(section.id, v.id)}
                                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all text-xs"
                                                                title="Delete vocabulary"
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section Editor */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isEditing ? `Edit Section: ${currentSection.title}` : 'Add New Section'}
                    </h3>
                    {isEditing && (
                        <button
                            onClick={actions.cancelEditing}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            Cancel Editing
                        </button>
                    )}
                </div>

                {/* Section Basic Info */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Section Title *
                        </label>
                        <input
                            type="text"
                            value={currentSection.title}
                            onChange={(e) => setCurrentSection(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Chapter 6: Te-form"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={currentSection.description}
                            onChange={(e) => setCurrentSection(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of this section..."
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent resize-none"
                        />
                    </div>
                </div>

                {/* Grammar Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                            Grammar Points ({currentSection.grammar?.length || 0})
                        </h4>
                        <button
                            onClick={() => setShowGrammarForm(!showGrammarForm)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#e30a5f]/10 text-[#e30a5f] rounded-lg hover:bg-[#e30a5f]/20 transition-all text-sm"
                        >
                            <FaPlus />
                            Add Grammar
                        </button>
                    </div>

                    {showGrammarForm && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={currentGrammar.point}
                                    onChange={(e) => setCurrentGrammar(prev => ({ ...prev, point: e.target.value }))}
                                    placeholder="Grammar point (e.g., て-form + います)"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                                <textarea
                                    value={currentGrammar.explanation}
                                    onChange={(e) => setCurrentGrammar(prev => ({ ...prev, explanation: e.target.value }))}
                                    placeholder="Explanation..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                                />

                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                        Examples (Optional)
                                    </label>
                                    {currentGrammar.examples.map((example, idx) => (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={example}
                                                onChange={(e) => actions.updateExample('grammar', idx, e.target.value)}
                                                placeholder="Example sentence..."
                                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                            />
                                            {currentGrammar.examples.length > 1 && (
                                                <button
                                                    onClick={() => actions.removeExample('grammar', idx)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    <FaTimes className="text-sm" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => actions.addExample('grammar')}
                                        className="text-xs text-[#e30a5f] hover:text-[#f41567]"
                                    >
                                        + Add example
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={actions.addGrammarPoint}
                                        className="px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white rounded-lg text-sm font-medium"
                                    >
                                        Add Grammar Point
                                    </button>
                                    <button
                                        onClick={() => setShowGrammarForm(false)}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentSection.grammar?.length > 0 && (
                        <div className="space-y-2">
                            {currentSection.grammar.map((g) => (
                                <div
                                    key={g.id}
                                    className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                            {g.point}
                                        </h5>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {g.explanation}
                                        </p>
                                        {g.examples?.filter(ex => ex).length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {g.examples.filter(ex => ex).map((ex, idx) => (
                                                    <p key={idx} className="text-xs text-gray-500 dark:text-gray-500 italic">
                                                        • {ex}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => actions.removeGrammarFromSection(g.id)}
                                        className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <FaTrash className="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Vocabulary Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                            Vocabulary ({currentSection.vocabulary?.length || 0})
                        </h4>
                        <button
                            onClick={() => setShowVocabForm(!showVocabForm)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#e30a5f]/10 text-[#e30a5f] rounded-lg hover:bg-[#e30a5f]/20 transition-all text-sm"
                        >
                            <FaPlus />
                            Add Vocabulary
                        </button>
                    </div>

                    {showVocabForm && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={currentVocab.word}
                                        onChange={(e) => setCurrentVocab(prev => ({ ...prev, word: e.target.value }))}
                                        placeholder="Word (e.g., 食べる)"
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                    <input
                                        type="text"
                                        value={currentVocab.reading}
                                        onChange={(e) => setCurrentVocab(prev => ({ ...prev, reading: e.target.value }))}
                                        placeholder="Reading (e.g., たべる)"
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                    <input
                                        type="text"
                                        value={currentVocab.meaning}
                                        onChange={(e) => setCurrentVocab(prev => ({ ...prev, meaning: e.target.value }))}
                                        placeholder="Meaning (e.g., to eat)"
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                        Example Sentences (Optional)
                                    </label>
                                    {currentVocab.examples.map((example, idx) => (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={example}
                                                onChange={(e) => actions.updateExample('vocab', idx, e.target.value)}
                                                placeholder="Example sentence..."
                                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                            />
                                            {currentVocab.examples.length > 1 && (
                                                <button
                                                    onClick={() => actions.removeExample('vocab', idx)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    <FaTimes className="text-sm" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => actions.addExample('vocab')}
                                        className="text-xs text-[#e30a5f] hover:text-[#f41567]"
                                    >
                                        + Add example
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={actions.addVocabulary}
                                        className="px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white rounded-lg text-sm font-medium"
                                    >
                                        Add Vocabulary
                                    </button>
                                    <button
                                        onClick={() => setShowVocabForm(false)}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentSection.vocabulary?.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentSection.vocabulary.map((v) => (
                                <div
                                    key={v.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                {v.word}
                                            </span>
                                            {v.reading && (
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    [{v.reading}]
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                            {v.meaning}
                                        </p>
                                        {v.examples?.filter(ex => ex).length > 0 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">
                                                Ex: {v.examples.filter(ex => ex)[0]}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => actions.removeVocabFromSection(v.id)}
                                        className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <FaTrash className="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Save Section Button */}
                {currentSection.title && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <FaLightbulb className="text-amber-500" />
                                {isEditing ? 'Update this section when ready' : 'Save this section to add it to the learning_material'}
                            </div>
                            <button
                                onClick={actions.saveSection}
                                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                            >
                                <FaCheck />
                                {isEditing ? 'Update Section' : 'Save Section'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();