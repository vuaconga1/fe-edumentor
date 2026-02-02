import React, { useEffect, useRef, useLayoutEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const RichTextEditor = ({ content, onChange, placeholder = "Start writing..." }) => {
    const wrapperRef = useRef(null);
    const quillRef = useRef(null);
    const onChangeRef = useRef(onChange);

    // Keep onChange ref updated
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Initialize Quill only once
    useLayoutEffect(() => {
        if (!wrapperRef.current) return;

        // Clear wrapper first to prevent duplicates
        wrapperRef.current.innerHTML = '';
        
        // Create editor container
        const editorDiv = document.createElement('div');
        wrapperRef.current.appendChild(editorDiv);

        const quill = new Quill(editorDiv, {
            theme: 'snow',
            placeholder,
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'code'],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }, 'blockquote'],
                    ['link'],
                    ['clean'],
                ],
            },
        });

        // Set initial content
        if (content) {
            quill.root.innerHTML = content;
        }

        quill.on('text-change', () => {
            const html = quill.root.innerHTML;
            const isEmpty = html === '<p><br></p>' || !quill.getText().trim();
            onChangeRef.current(isEmpty ? '' : html);
        });

        quillRef.current = quill;

        return () => {
            quillRef.current = null;
        };
    }, []);

    return (
        <div className="rich-text-editor">
            <div ref={wrapperRef} />

            <style>{`
                .rich-text-editor .ql-toolbar {
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                    border-color: rgb(229 231 235);
                    background-color: rgb(249 250 251);
                }
                .rich-text-editor .ql-container {
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    border-color: rgb(229 231 235);
                    font-size: 16px;
                }
                .rich-text-editor .ql-editor {
                    min-height: 150px;
                    padding: 1rem;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                    color: rgb(156 163 175);
                    font-style: normal;
                    left: 1rem;
                    right: 1rem;
                }
                /* Dark mode support */
                .dark .rich-text-editor .ql-toolbar {
                    border-color: rgb(64 64 64);
                    background-color: rgb(38 38 38);
                }
                .dark .rich-text-editor .ql-container {
                    border-color: rgb(64 64 64);
                    background-color: rgb(23 23 23);
                    color: white;
                }
                .dark .rich-text-editor .ql-toolbar .ql-stroke {
                    stroke: rgb(163 163 163);
                }
                .dark .rich-text-editor .ql-toolbar .ql-fill {
                    fill: rgb(163 163 163);
                }
                .dark .rich-text-editor .ql-toolbar .ql-picker {
                    color: rgb(163 163 163);
                }
                .dark .rich-text-editor .ql-toolbar .ql-picker-options {
                    background-color: rgb(38 38 38);
                    border-color: rgb(64 64 64);
                }
                .dark .rich-text-editor .ql-toolbar button:hover .ql-stroke,
                .dark .rich-text-editor .ql-toolbar .ql-picker-label:hover .ql-stroke {
                    stroke: rgb(255 255 255);
                }
                .dark .rich-text-editor .ql-toolbar button:hover .ql-fill,
                .dark .rich-text-editor .ql-toolbar .ql-picker-label:hover .ql-fill {
                    fill: rgb(255 255 255);
                }
                .dark .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
                    stroke: rgb(59 130 246);
                }
                .dark .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
                    fill: rgb(59 130 246);
                }
                .dark .rich-text-editor .ql-editor.ql-blank::before {
                    color: rgb(115 115 115);
                }
                /* Link styling */
                .rich-text-editor .ql-editor a {
                    color: rgb(37 99 235);
                }
                .rich-text-editor .ql-editor a:hover {
                    text-decoration: underline;
                }
                /* Blockquote styling */
                .rich-text-editor .ql-editor blockquote {
                    border-left: 4px solid rgb(59 130 246);
                    padding-left: 1rem;
                    margin-left: 0;
                    margin-right: 0;
                    color: rgb(107 114 128);
                }
                .dark .rich-text-editor .ql-editor blockquote {
                    color: rgb(163 163 163);
                }
                /* Code styling */
                .rich-text-editor .ql-editor code {
                    background-color: rgb(243 244 246);
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-family: ui-monospace, monospace;
                }
                .dark .rich-text-editor .ql-editor code {
                    background-color: rgb(64 64 64);
                }
                /* Heading styling */
                .rich-text-editor .ql-editor h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }
                .rich-text-editor .ql-editor h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }
                /* List styling */
                .rich-text-editor .ql-editor ol,
                .rich-text-editor .ql-editor ul {
                    padding-left: 1.5rem;
                }
                /* Snow tooltip (link input) dark mode */
                .dark .ql-snow .ql-tooltip {
                    background-color: rgb(38 38 38);
                    border-color: rgb(64 64 64);
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
                }
                .dark .ql-snow .ql-tooltip input[type="text"] {
                    background-color: rgb(23 23 23);
                    border-color: rgb(64 64 64);
                    color: white;
                }
                .dark .ql-snow .ql-tooltip a {
                    color: rgb(96 165 250);
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
