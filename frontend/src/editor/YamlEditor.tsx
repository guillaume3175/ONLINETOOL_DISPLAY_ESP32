import React from 'react';
import Editor from '@monaco-editor/react';

interface YamlEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export const YamlEditor: React.FC<YamlEditorProps> = ({ value, onChange }) => {
  return (
    <div className="w-full h-full bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="yaml"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2
        }}
      />
    </div>
  );
};
