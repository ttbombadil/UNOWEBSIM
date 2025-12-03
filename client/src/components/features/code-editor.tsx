import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Configure Monaco for Arduino C++
    monaco.languages.register({ id: 'arduino-cpp' });

    // Set tokens provider for Arduino C++
    monaco.languages.setMonarchTokensProvider('arduino-cpp', {
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\b(void|int|float|double|char|bool|byte|String|long|short|unsigned)\b/, 'type'],
          [/\b(setup|loop|pinMode|digitalWrite|digitalRead|analogRead|analogWrite|delay|millis|Serial|if|else|for|while|do|switch|case|break|continue|return|HIGH|LOW|INPUT|OUTPUT|LED_BUILTIN)\b/, 'keyword'],
          [/\b\d+\b/, 'number'],
          [/[{}()\[\]]/, 'bracket'],
          [/[<>]=?/, 'operator'],
          [/[+\-*/%=!&|^~]/, 'operator'],
          [/[;,.]/, 'delimiter'],
          [/\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/, 'function'],
        ],
      },
    });

    // Configure theme
    monaco.editor.defineTheme('arduino-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'operator', foreground: 'd4d4d4' },
      ],
      colors: {
        'editor.background': '#121212',
        'editor.foreground': '#fafafa',
        'editorLineNumber.foreground': '#666666',
        'editorLineNumber.activeForeground': '#888888',
        'editor.selectionBackground': '#3d3d3d',
        'editor.lineHighlightBackground': '#1a1a1a',
      },
    });

    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: 'arduino-cpp',
      theme: 'arduino-dark',
      readOnly,
      minimap: { enabled: false },
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: 'on',
      lineNumbersMinChars: 3,
      folding: true,
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: 'line',
      cursorWidth: 2,
    });

    editorRef.current = editor;

    // Set up change listener
    const changeDisposable = editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    // NEW: Custom paste handler to handle large pastes
    const pasteDisposable = editor.onDidPaste((e) => {
      // This event fires after paste, we can use it to detect if paste was truncated
      // But we need to handle it before Monaco processes it
      console.log('Paste event detected', e);
    });

    // Better approach: Add a DOM paste listener directly
    const domNode = editor.getDomNode();
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const text = e.clipboardData?.getData('text/plain');
      if (!text) return;

      // Get current selection
      const selection = editor.getSelection();
      if (!selection) return;

      // Execute edit operation with the full pasted text
      editor.executeEdits('paste', [{
        range: selection,
        text: text,
        forceMoveMarkers: true,
      }]);

      // Move cursor to end of pasted text
      const lines = text.split('\n');
      const endLineNumber = selection.startLineNumber + lines.length - 1;
      const endColumn = lines.length === 1 
        ? selection.startColumn + text.length 
        : lines[lines.length - 1].length + 1;
      
      editor.setPosition({
        lineNumber: endLineNumber,
        column: endColumn,
      });
    };

    if (domNode) {
      domNode.addEventListener('paste', handlePaste);
    }

    return () => {
      changeDisposable.dispose();
      pasteDisposable.dispose();
      if (domNode) {
        domNode.removeEventListener('paste', handlePaste);
      }
      editor.dispose();
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full"
      data-testid="code-editor"
    />
  );
}