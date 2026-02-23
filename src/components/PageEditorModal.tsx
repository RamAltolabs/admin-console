import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiSave, FiImage, FiType, FiAlignLeft, FiAlignCenter, FiAlignRight, FiCode, FiEye, FiLayout } from 'react-icons/fi';

interface PageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pageData: any) => Promise<void>;
    page: any;
    merchantId: string;
}

type EditorMode = 'visual' | 'code';

const PageEditorModal: React.FC<PageEditorModalProps> = ({ isOpen, onClose, onSave, page, merchantId }) => {
    const [pageName, setPageName] = useState('');
    const [pageType, setPageType] = useState('');
    const [status, setStatus] = useState('active');
    const [content, setContent] = useState<any[]>([]);
    const [rawContent, setRawContent] = useState('');
    const [selectedElement, setSelectedElement] = useState<number | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [editorMode, setEditorMode] = useState<EditorMode>('visual');
    const [saving, setSaving] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    // Helper function to extract image URL from HTML content
    const extractImageFromHTML = (htmlString: string): string | null => {
        if (!htmlString) return null;

        // Try to extract src from img tag
        const imgMatch = htmlString.match(/src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
            return imgMatch[1];
        }

        return null;
    };

    // Parse existing page content
    useEffect(() => {
        if (page) {
            setPageName(page.pageName || '');
            setPageType(page.pageType || 'custom-template');
            setStatus(page.status || 'active');

            // Parse content based on structure
            if (Array.isArray(page.content) && page.content.length > 0) {
                const firstContent = page.content[0];

                // Check if it's HTML data (image-only page)
                if (firstContent.data) {
                    const imageUrl = extractImageFromHTML(firstContent.data);
                    if (imageUrl) {
                        // Create a visual element for the image
                        setContent([{
                            id: Date.now(),
                            type: 'image',
                            src: imageUrl,
                            alt: page.pageName || 'Page image',
                            width: '100%'
                        }]);
                    }
                    setRawContent(firstContent.data);
                    setEditorMode('code'); // Default to code mode for HTML pages
                }
                // Check if it's JSON template data
                else if (firstContent.json) {
                    setRawContent(firstContent.json);
                    setEditorMode('code');
                    setContent([]);
                }
                // Visual builder content
                else if (Array.isArray(page.content)) {
                    setContent(page.content);
                    setEditorMode('visual');
                }
            } else {
                setContent([]);
                setRawContent('');
            }
        }
    }, [page]);

    const handleSave = async () => {
        setSaving(true);
        try {
            let finalContent;

            if (editorMode === 'code') {
                // Save raw HTML/JSON content
                if (pageType === 'custom-landingPage') {
                    finalContent = [{ data: rawContent }];
                } else {
                    finalContent = [{ json: rawContent }];
                }
            } else {
                // Save visual builder content
                finalContent = content;
            }

            const pageData = {
                pageId: page.pageId,
                pageTemplateId: page.pageTemplateId,
                merchantId,
                pageName,
                pageType,
                status,
                content: finalContent,
            };

            await onSave(pageData);
            onClose();
        } catch (error) {
            console.error('Failed to save page:', error);
        } finally {
            setSaving(false);
        }
    };

    const addElement = (type: string) => {
        const newElement: any = {
            id: Date.now(),
            type,
        };

        switch (type) {
            case 'heading':
                newElement.content = 'New Heading';
                newElement.level = 1;
                newElement.align = 'left';
                break;
            case 'text':
                newElement.content = 'Enter your text here...';
                newElement.align = 'left';
                break;
            case 'image':
                newElement.src = '';
                newElement.alt = 'Image';
                newElement.width = '100%';
                break;
            case 'button':
                newElement.text = 'Click Me';
                newElement.link = '#';
                newElement.style = 'primary';
                break;
            case 'divider':
                newElement.style = 'solid';
                break;
        }

        setContent([...content, newElement]);
        setSelectedElement(content.length);
    };

    const updateElement = (index: number, updates: any) => {
        const newContent = [...content];
        newContent[index] = { ...newContent[index], ...updates };
        setContent(newContent);
    };

    const deleteElement = (index: number) => {
        const newContent = content.filter((_, i) => i !== index);
        setContent(newContent);
        setSelectedElement(null);
    };

    const moveElement = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === content.length - 1)
        ) {
            return;
        }

        const newContent = [...content];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newContent[index], newContent[targetIndex]] = [newContent[targetIndex], newContent[index]];
        setContent(newContent);
        setSelectedElement(targetIndex);
    };

    const renderElement = (element: any, index: number) => {
        switch (element.type) {
            case 'heading':
                const HeadingTag = `h${element.level || 1}` as keyof JSX.IntrinsicElements;
                return (
                    <HeadingTag
                        className={`font-bold mb-2 ${element.level === 1 ? 'text-3xl' : element.level === 2 ? 'text-2xl' : 'text-xl'}`}
                        style={{ textAlign: element.align || 'left' }}
                    >
                        {element.content}
                    </HeadingTag>
                );
            case 'text':
                return (
                    <p className="mb-2" style={{ textAlign: element.align || 'left' }}>
                        {element.content}
                    </p>
                );
            case 'image':
                return element.src ? (
                    <img
                        src={element.src}
                        alt={element.alt || 'Image'}
                        className="mb-2 rounded-lg max-w-full"
                        style={{ width: element.width || '100%' }}
                    />
                ) : (
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-2">
                        <FiImage className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-500">No image selected</p>
                    </div>
                );
            case 'button':
                return (
                    <button
                        className={`px-6 py-2 rounded-lg font-semibold mb-2 ${element.style === 'primary'
                            ? 'bg-blue-900 text-white hover:bg-blue-900'
                            : element.style === 'secondary'
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : 'border-2 border-blue-900 text-blue-900 hover:bg-blue-50'
                            }`}
                    >
                        {element.text}
                    </button>
                );
            case 'divider':
                return (
                    <hr
                        className={`my-4 ${element.style === 'solid'
                            ? 'border-gray-300'
                            : element.style === 'dashed'
                                ? 'border-dashed border-gray-300'
                                : 'border-dotted border-gray-300'
                            }`}
                    />
                );
            default:
                return null;
        }
    };

    const renderElementEditor = (element: any, index: number) => {
        switch (element.type) {
            case 'heading':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Heading Text</label>
                            <input
                                type="text"
                                value={element.content}
                                onChange={(e) => updateElement(index, { content: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Level</label>
                            <select
                                value={element.level || 1}
                                onChange={(e) => updateElement(index, { level: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            >
                                <option value={1}>H1</option>
                                <option value={2}>H2</option>
                                <option value={3}>H3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Alignment</label>
                            <div className="flex gap-2">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => updateElement(index, { align })}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${element.align === align
                                            ? 'bg-blue-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {align === 'left' ? <FiAlignLeft className="mx-auto" /> : align === 'center' ? <FiAlignCenter className="mx-auto" /> : <FiAlignRight className="mx-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Text Content</label>
                            <textarea
                                value={element.content}
                                onChange={(e) => updateElement(index, { content: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Alignment</label>
                            <div className="flex gap-2">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => updateElement(index, { align })}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${element.align === align
                                            ? 'bg-blue-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {align === 'left' ? <FiAlignLeft className="mx-auto" /> : align === 'center' ? <FiAlignCenter className="mx-auto" /> : <FiAlignRight className="mx-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'image':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Image URL</label>
                            <input
                                type="text"
                                value={element.src || ''}
                                onChange={(e) => updateElement(index, { src: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Alt Text</label>
                            <input
                                type="text"
                                value={element.alt || ''}
                                onChange={(e) => updateElement(index, { alt: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Width</label>
                            <input
                                type="text"
                                value={element.width || '100%'}
                                onChange={(e) => updateElement(index, { width: e.target.value })}
                                placeholder="100% or 500px"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            />
                        </div>
                    </div>
                );
            case 'button':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Button Text</label>
                            <input
                                type="text"
                                value={element.text}
                                onChange={(e) => updateElement(index, { text: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Link URL</label>
                            <input
                                type="text"
                                value={element.link}
                                onChange={(e) => updateElement(index, { link: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Style</label>
                            <select
                                value={element.style || 'primary'}
                                onChange={(e) => updateElement(index, { style: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            >
                                <option value="primary">Primary</option>
                                <option value="secondary">Secondary</option>
                                <option value="outline">Outline</option>
                            </select>
                        </div>
                    </div>
                );
            case 'divider':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Style</label>
                            <select
                                value={element.style || 'solid'}
                                onChange={(e) => updateElement(index, { style: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                            >
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-blue-900 tracking-tight">Page Editor</h2>
                            <p className="text-sm text-gray-500 mt-1">Design your landing page with ease</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Mode Switcher */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setEditorMode('visual')}
                                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${editorMode === 'visual'
                                        ? 'bg-white text-blue-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <FiLayout size={16} />
                                    Visual
                                </button>
                                <button
                                    onClick={() => setEditorMode('code')}
                                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${editorMode === 'code'
                                        ? 'bg-white text-blue-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <FiCode size={16} />
                                    Code
                                </button>
                            </div>

                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${previewMode
                                    ? 'bg-blue-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <FiEye size={16} />
                                {previewMode ? 'Edit Mode' : 'Preview'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                <FiSave size={16} />
                                {saving ? 'Saving...' : 'Save Page'}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page Settings */}
                {!previewMode && (
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">Page Name</label>
                                <input
                                    type="text"
                                    value={pageName}
                                    onChange={(e) => setPageName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                                    placeholder="Enter page name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">Page Type</label>
                                <select
                                    value={pageType}
                                    onChange={(e) => setPageType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                                >
                                    <option value="custom-template">Custom Template</option>
                                    <option value="custom-landingPage">Landing Page</option>
                                    <option value="custom-email">Email</option>
                                    <option value="predefined-email">Predefined Email</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex">
                    {editorMode === 'visual' ? (
                        <>
                            {/* Toolbar */}
                            {!previewMode && (
                                <div className="w-64 border-r border-gray-100 bg-white p-4 overflow-y-auto">
                                    <h3 className="text-xs font-black text-gray-700 mb-3 tracking-widest uppercase">Add Elements</h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => addElement('heading')}
                                            className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-900 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 border border-gray-200 hover:border-blue-200"
                                        >
                                            <FiType size={18} />
                                            Heading
                                        </button>
                                        <button
                                            onClick={() => addElement('text')}
                                            className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-900 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 border border-gray-200 hover:border-blue-200"
                                        >
                                            <FiAlignLeft size={18} />
                                            Text
                                        </button>
                                        <button
                                            onClick={() => addElement('image')}
                                            className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-900 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 border border-gray-200 hover:border-blue-200"
                                        >
                                            <FiImage size={18} />
                                            Image
                                        </button>
                                        <button
                                            onClick={() => addElement('button')}
                                            className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-900 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 border border-gray-200 hover:border-blue-200"
                                        >
                                            <FiCode size={18} />
                                            Button
                                        </button>
                                        <button
                                            onClick={() => addElement('divider')}
                                            className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-900 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 border border-gray-200 hover:border-blue-200"
                                        >
                                            <FiCode size={18} />
                                            Divider
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Canvas */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8" ref={editorRef}>
                                    {content.length === 0 ? (
                                        <div className="text-center py-20">
                                            <FiType className="mx-auto text-gray-300 mb-4" size={48} />
                                            <h3 className="text-lg font-bold text-gray-600 mb-2">Start Building Your Page</h3>
                                            <p className="text-sm text-gray-400">Add elements from the toolbar to get started</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {content.map((element, index) => (
                                                <div
                                                    key={element.id}
                                                    className={`relative group ${!previewMode && selectedElement === index
                                                        ? 'ring-2 ring-blue-500 rounded-lg p-3'
                                                        : previewMode
                                                            ? ''
                                                            : 'hover:ring-2 hover:ring-gray-300 rounded-lg p-3 cursor-pointer'
                                                        }`}
                                                    onClick={() => !previewMode && setSelectedElement(index)}
                                                >
                                                    {renderElement(element, index)}
                                                    {!previewMode && (
                                                        <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    moveElement(index, 'up');
                                                                }}
                                                                disabled={index === 0}
                                                                className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-30"
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    moveElement(index, 'down');
                                                                }}
                                                                disabled={index === content.length - 1}
                                                                className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-30"
                                                            >
                                                                ↓
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteElement(index);
                                                                }}
                                                                className="px-2 py-1 bg-red-50 border border-red-300 text-red-600 rounded text-xs hover:bg-red-100"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Properties Panel */}
                            {!previewMode && selectedElement !== null && content[selectedElement] && (
                                <div className="w-80 border-l border-gray-100 bg-white p-4 overflow-y-auto">
                                    <h3 className="text-xs font-black text-gray-700 mb-3 tracking-widest uppercase">Element Properties</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <p className="text-xs font-bold text-gray-600 mb-1">Type</p>
                                        <p className="text-sm font-semibold text-blue-900 capitalize">{content[selectedElement].type}</p>
                                    </div>
                                    {renderElementEditor(content[selectedElement], selectedElement)}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Code Editor Mode */
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                                {previewMode ? (
                                    <div dangerouslySetInnerHTML={{ __html: rawContent }} />
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2">
                                            {pageType === 'custom-landingPage' ? 'HTML Content' : 'JSON Template'}
                                        </label>
                                        <textarea
                                            value={rawContent}
                                            onChange={(e) => setRawContent(e.target.value)}
                                            className="w-full h-[600px] px-4 py-3 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-900"
                                            placeholder={pageType === 'custom-landingPage'
                                                ? '<p><img src="https://example.com/image.jpg" /></p>'
                                                : '{"message": {"type": "TEXT", "template": "Your message here"}}'
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageEditorModal;
