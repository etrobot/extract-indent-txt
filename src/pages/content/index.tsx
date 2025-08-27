import './style.css';

interface ExtractOptions {
  includeHidden: boolean;
  minTextLength: number;
  maxDepth: number;
  skipTags: Set<string>;
}

class TextExtractor {
  private options: ExtractOptions;
  private skipTags = new Set(['script', 'style', 'noscript', 'meta', 'link', 'head']);
  
  constructor(options: Partial<ExtractOptions> = {}) {
    this.options = {
      includeHidden: false,
      minTextLength: 1, // 降低最小文本长度要求
      maxDepth: 10,
      skipTags: this.skipTags,
      ...options
    };
  }

  private isElementVisible(element: Element): boolean {
    if (this.options.includeHidden) return true;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  private getDirectTextContent(element: Element): string {
    let text = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent?.trim() || '';
        if (textContent.length >= this.options.minTextLength) {
          text += textContent + ' ';
        }
      }
    }
    return text.trim();
  }

  private shouldSkipElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return this.options.skipTags.has(tagName) || !this.isElementVisible(element);
  }

  
  // 新增：获取所有直接文本内容的方法（纯文本，不带格式）
  // span元素文本拼接，其他元素换行
  private getAllDirectText(element: Element): string {
    let allText = '';
    
    // 递归遍历所有元素，添加缩进
    const traverse = (el: Element, depth: number = 0) => {
      if (this.shouldSkipElement(el)) {
        return;
      }
      
      // 获取当前元素的直接文本内容
      const directText = this.getDirectTextContent(el);
      const tagName = el.tagName.toLowerCase();
      const isCurrentSpan = tagName === 'span';
      
      if (directText) {
        // 添加缩进空格（每层递归添加一个空格）
        const indent = ' '.repeat(depth);
        
        // 如果是span元素，拼接文本（不换行，不添加缩进）
        if (isCurrentSpan) {
          allText += directText;
        } 
        // 如果是其他元素，添加缩进文本并换行
        else {
          allText += indent + directText + '\n';
        }
      }
      
      // 递归处理子元素，增加深度
      const children = Array.from(el.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          traverse(child as Element, depth + 1);
        }
      }
    };
    
    traverse(element);
    return allText.trim();
  }

  public extractIndentedText(): string {
    const body = document.body;
    if (!body) return 'No content found';
    
    console.log('📊 开始提取页面文本...');
    
    // 查找指定的元素：main标签、id为main的元素、class为main的元素，以及footer标签
    const targetElements = body.querySelectorAll('main, #main, .main, footer');
    
    // 如果找到了指定元素，则只提取这些元素中的文本
    let content = '';
    if (targetElements.length > 0) {
      console.log(`📊 找到${targetElements.length}个目标元素`);
      
      // 创建一个数组来存储唯一的元素
      const uniqueElements: Element[] = [];
      
      // 将NodeList转换为数组并过滤可见元素
      const elementsArray = Array.from(targetElements).filter(el => this.isElementVisible(el));
      
      // 过滤出不重复的元素（避免父元素和子元素都被提取导致重复内容）
      for (let i = 0; i < elementsArray.length; i++) {
        let isChild = false;
        for (let j = 0; j < elementsArray.length; j++) {
          if (i !== j && elementsArray[j].contains(elementsArray[i])) {
            isChild = true;
            break;
          }
        }
        if (!isChild) {
          uniqueElements.push(elementsArray[i]);
        }
      }
      
      // 提取唯一元素的文本内容
      for (const element of uniqueElements) {
        content += this.getAllDirectText(element) + '\n';
      }
    } else {
      // 如果没有找到指定元素，则提取整个body的文本
      console.log('⚠️ 未找到指定元素，提取整个页面文本');
      content = this.getAllDirectText(body);
    }
    
    console.log('=== 提取的文本内容 ===');
    console.log(content);
    console.log('=== 文本内容结束 ===');
    
    console.log('✅ 提取完成，共生成', content.split('\n').length, '行内容');
    
    return content.trim() || 'No content found';
  }
}

function copyToClipboard(text: string): void {
  console.log('=== 提取的Markmap文本内容 ===');
  console.log(text);
  console.log('=== 文本内容结束 ===');
  
  // 尝试多种复制方法
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('✅ 使用 navigator.clipboard 复制成功');
      showNotification('✅ 页面内容已复制到剪贴板！');
    }).catch(err => {
      console.error('❌ navigator.clipboard 复制失败:', err);
      console.error('错误详情:', err.name, err.message);
      fallbackCopyTextToClipboard(text);
    });
  } else {
    console.log('⚠️ navigator.clipboard 不可用，使用备用方法');
    fallbackCopyTextToClipboard(text);
  }
}

function fallbackCopyTextToClipboard(text: string): void {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      console.log('✅ 使用 document.execCommand 复制成功');
      showNotification('✅ 页面内容已复制到剪贴板！');
    } else {
      console.error('❌ document.execCommand 复制失败');
      showNotification('❌ 复制失败，请手动复制控制台中的内容');
    }
  } catch (err) {
    console.error('❌ 备用复制方法也失败了:', err);
    showNotification('❌ 复制失败，请手动复制控制台中的内容');
  }
}

function showNotification(message: string): void {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extractText') {
    try {
      const extractor = new TextExtractor({
        includeHidden: false,
        minTextLength: 1,
        maxDepth: 10
      });
      
      const indentedText = extractor.extractIndentedText();
      copyToClipboard(indentedText);
      sendResponse({ success: true, data: indentedText });
    } catch (error: any) {
      console.error('Text extraction failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

console.log('Markmap text extractor loaded');
