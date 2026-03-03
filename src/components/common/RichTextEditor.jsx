import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

const RichTextEditor = ({ content, onChange, placeholder = "Start writing..." }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2],
                },
                underline: false,
                link: false,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            const html = editor.isEmpty ? '' : editor.getHTML();
            onChange?.(html);
        },
    });

    // Update content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '');
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="rich-text-editor">
            <div className="toolbar">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={editor.isActive('underline') ? 'is-active' : ''}
                >
                    <u>U</u>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={editor.isActive('code') ? 'is-active' : ''}
                >
                    {'</>'}
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                >
                    H1
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                >
                    •
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                >
                    1.
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                >
                    "
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const url = window.prompt('URL');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    className={editor.isActive('link') ? 'is-active' : ''}
                >
                    Link
                </button>
            </div>

            <EditorContent editor={editor} />

            <style>{`
                .rich-text-editor .toolbar {
                    display: flex;
                    gap: 0.25rem;
                    padding: 0.5rem;
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                    border: 1px solid rgb(229 231 235);
                    border-bottom: none;
                    background-color: rgb(249 250 251);
                    flex-wrap: wrap;
                }
                .rich-text-editor .toolbar button {
                    padding: 0.375rem 0.75rem;
                    border: 1px solid rgb(229 231 235);
                    border-radius: 0.375rem;
                    background-color: white;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.15s;
                }
                .rich-text-editor .toolbar button:hover {
                    background-color: rgb(243 244 246);
                }
                .rich-text-editor .toolbar button.is-active {
                    background-color: rgb(59 130 246);
                    color: white;
                    border-color: rgb(59 130 246);
                }
                .rich-text-editor .ProseMirror {
                    min-height: 150px;
                    padding: 1rem;
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    border: 1px solid rgb(229 231 235);
                    font-size: 16px;
                    outline: none;
                }
                .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
                    color: rgb(156 163 175);
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                /* Dark mode support */
                .dark .rich-text-editor .toolbar {
                    border-color: rgb(64 64 64);
                    background-color: rgb(38 38 38);
                }
                .dark .rich-text-editor .toolbar button {
                    border-color: rgb(64 64 64);
                    background-color: rgb(23 23 23);
                    color: rgb(163 163 163);
                }
                .dark .rich-text-editor .toolbar button:hover {
                    background-color: rgb(38 38 38);
                }
                .dark .rich-text-editor .ProseMirror {
                    border-color: rgb(64 64 64);
                    background-color: rgb(23 23 23);
                    color: white;
                }
                /* Content styling */
                .rich-text-editor .ProseMirror h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin: 0.67em 0;
                }
                .rich-text-editor .ProseMirror h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 0.75em 0;
                }
                .rich-text-editor .ProseMirror ul,
                .rich-text-editor .ProseMirror ol {
                    padding-left: 1.5rem;
                }
                .rich-text-editor .ProseMirror blockquote {
                    border-left: 3px solid rgb(229 231 235);
                    padding-left: 1rem;
                    margin-left: 0;
                    color: rgb(107 114 128);
                }
                .dark .rich-text-editor .ProseMirror blockquote {
                    border-left-color: rgb(64 64 64);
                    color: rgb(156 163 175);
                }
                .rich-text-editor .ProseMirror a {
                    color: rgb(59 130 246);
                    text-decoration: underline;
                }
                .rich-text-editor .ProseMirror code {
                    background-color: rgb(243 244 246);
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-family: monospace;
                }
                .dark .rich-text-editor .ProseMirror code {
                    background-color: rgb(38 38 38);
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
