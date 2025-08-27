import React, { useState } from 'react';

export default function Popup() {
  const [status, setStatus] = useState<'idle' | 'extracting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleExtract = async () => {
    setStatus('extracting');
    setMessage('正在提取网页文本...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('无法获取当前标签页');
      }

      chrome.tabs.sendMessage(tab.id, { action: 'extractText' }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('error');
          setMessage('提取失败：' + chrome.runtime.lastError.message);
        } else if (response && response.success) {
          setStatus('success');
          setMessage('文本已成功复制到剪贴板！');
        } else {
          setStatus('error');
          setMessage('提取失败：' + (response?.error || '未知错误'));
        }
      });
    } catch (error) {
      setStatus('error');
      setMessage('提取失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'extracting': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <div className="w-80 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            📊 Markmap文本提取器
          </h1>
          
          <p className="text-sm text-gray-600 mb-6">
            一键提取网页所有文本到markmap格式，DOM嵌套作为层级结构
          </p>

          <button
            onClick={handleExtract}
            disabled={status === 'extracting'}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-colors
              ${status === 'extracting' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }
              text-white
            `}
          >
            {status === 'extracting' ? '提取中...' : '🚀 提取文本到剪贴板'}
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded-lg bg-gray-50 ${getStatusColor()}`}>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              使用方法：点击按钮即可提取当前网页的文本内容，
              并以markmap格式复制到剪贴板
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}