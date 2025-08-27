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
      minTextLength: 1, 
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

  
private getAllDirectText(element: Element): string {
  let allText = '';
  
  // 递归遍历所有元素，按正确顺序处理
  const traverse = (el: Element, depth: number = 0) => {
    if (this.shouldSkipElement(el)) {
      return;
    }
    
    const tagName = el.tagName.toLowerCase();
    const isSpan = tagName === 'span';
    
    // 首先处理当前元素的直接文本内容（只处理直接子文本节点）
    const directText = this.getDirectTextContent(el);
    if (directText) {
      if (isSpan) {
        // span元素：直接拼接，不换行不缩进
        allText += directText;
      } else {
        // 其他元素：添加缩进和换行
        const indent = ' '.repeat(depth);
        allText += indent + directText + '\n';
      }
    }
    
    // 然后按DOM顺序处理子元素
    for (const child of el.children) {
      traverse(child, isSpan ? depth : depth + 1);
    }
  };
  
  traverse(element);
  return allText.trim();
}

  public extractIndentedText(): string {
    const body = document.body;
    if (!body) return 'No content found';
    
    console.log('📊 开始提取页面文本...');
    
    // 获取页面标题
    const title = 'Text extracted from the page: ';
    
    // 查找指定的元素：main标签、id为main的元素、class为main的元素，以及footer标签
    let content = '';
    let foundMain = false;
    let mainElement: Element | null = null;
    
    // 查找main标签元素
    const mainTagElements = body.querySelectorAll('main');
    if (mainTagElements.length > 0) {
      console.log(`📊 找到${mainTagElements.length}个<main>标签元素`);
      Array.from(mainTagElements)
        .filter(el => this.isElementVisible(el))
        .forEach(el => {
          content += this.getAllDirectText(el) + '\n';
          mainElement = el;
        });
      foundMain = true;
    }
    
    // 如果没有找到main标签，查找id为main的元素
    if (!foundMain) {
      const idMainElements = body.querySelectorAll('#main');
      if (idMainElements.length > 0) {
        console.log(`📊 找到${idMainElements.length}个id='main'的元素`);
        Array.from(idMainElements)
          .filter(el => this.isElementVisible(el))
          .forEach(el => {
            content += this.getAllDirectText(el) + '\n';
            mainElement = el;
          });
        foundMain = true;
      }
    }
    
    // 如果没有找到id为main的元素，查找class为main的元素
    if (!foundMain) {
      const classMainElements = body.querySelectorAll('.main');
      if (classMainElements.length > 0) {
        console.log(`📊 找到${classMainElements.length}个class='main'的元素`);
        Array.from(classMainElements)
          .filter(el => this.isElementVisible(el))
          .forEach(el => {
            content += this.getAllDirectText(el) + '\n';
            mainElement = el;
          });
        foundMain = true;
      }
    }
    
    // 查找footer标签元素（如果main元素不包含footer）
    const footerElements = body.querySelectorAll('footer');
    if (footerElements.length > 0) {
      console.log(`📊 找到${footerElements.length}个<footer>标签元素`);
      Array.from(footerElements)
        .filter(el => this.isElementVisible(el))
        // 检查footer是否在main元素内部，如果在就不提取（避免重复）
        .filter(el => !mainElement || !mainElement.contains(el))
        .forEach(el => {
          content += this.getAllDirectText(el) + '\n';
        });
    }
    
    // 如果没有找到任何指定元素，则提取整个body的文本
    if (content.trim() === '') {
      console.log('⚠️ 未找到指定元素，提取整个页面文本');
      content = this.getAllDirectText(body);
    }
    
    // 组合最终输出：标题 + 内容 + 分隔线
    const finalOutput = `# ${title}\n\n${content.trim()}\n\n---`;    
    return finalOutput || 'No content found';
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
    } else {
      console.error('❌ document.execCommand 复制失败');
    }
  } catch (err) {
    console.error('❌ 备用复制方法也失败了:', err);
  }
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