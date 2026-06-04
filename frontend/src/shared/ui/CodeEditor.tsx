// Monaco Editor 封装组件

import { useRef, useEffect, useCallback } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

// 加载 Monaco Editor 中文语言包
// 设置全局语言标识为 zh-cn，然后动态导入中文翻译消息
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any)._VSCODE_NLS_LANGUAGE = 'zh-cn'
  // 动态加载中文 NLS 消息文件
  import('monaco-editor/esm/nls.messages.zh-cn.js')
    .then(() => {
      // 中文消息已注册到 globalThis._VSCODE_NLS_MESSAGES
    })
    .catch(() => {
      // 加载中文语言包失败，Monaco 将回退到英文
    })
}

interface CodeEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  language?: string
  height?: string
  readOnly?: boolean
  theme?: string
  placeholder?: string
}

export function CodeEditor({
  value,
  onChange,
  language = 'plaintext',
  height = '200px',
  readOnly = false,
  theme,
  placeholder,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    // 注册快捷键: Ctrl/Cmd + S 用于保存
    editor.addAction({
      id: 'save-request',
      label: '保存请求',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        // 触发保存逻辑（由父组件通过键盘事件处理）
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          metaKey: true,
        }))
      },
    })

    // 注册快捷键: Ctrl/Cmd + Enter 发送请求
    editor.addAction({
      id: 'send-request',
      label: '发送请求',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          metaKey: true,
        }))
      },
    })

    // 注册快捷键: Alt + Shift + F 格式化 JSON
    editor.addAction({
      id: 'format-json',
      label: '格式化 JSON',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: () => {
        editor.getAction('editor.action.formatDocument')?.run()
      },
    })

    // 设置 placeholder
    if (placeholder && editor) {
      const model = editor.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [language, placeholder])

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current
      const model = editor.getModel()
      if (model) {
        import('monaco-editor').then((monaco) => {
          monaco.editor.setModelLanguage(model, language)
        }).catch(() => {})
      }
    }
  }, [language])

  return (
    <div className="border border-dark-border rounded overflow-hidden" style={{ height }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          fontSize: 13,
          fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
          wordWrap: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          placeholder: placeholder,
        }}
        theme={theme || 'vs-dark'}
        loading={
          <div className="flex items-center justify-center h-full bg-dark-bg text-dark-text-secondary text-xs">
            编辑器加载中...
          </div>
        }
      />
    </div>
  )
}
