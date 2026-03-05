import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ResumeData, ResumeConfig, ResumeSectionKey } from '../types';
import { Move } from 'lucide-react';

interface ResumeDocumentProps {
  data: ResumeData;
  config: ResumeConfig;
  sectionOrder?: ResumeSectionKey[];
  showOnlyFirstPage?: boolean;
  isThumbnail?: boolean;
  onConfigChange?: (config: ResumeConfig) => void;
  isPrintMode?: boolean;
}

// A4 尺寸常量 (mm)
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGINATION_EPSILON_PX = 0.5;
const PAGE_HEIGHT_SAFETY_PX = 2;
const MIN_TAIL_PAGE_CONTENT_PX = 6;

/**
 * 递归查找所有“叶子块元素”：
 * 没有块级子元素的块级元素。
 * 分页时会以这些元素作为最小不可拆分单元。
 */
const getLeafBlocks = (container: HTMLElement): HTMLElement[] => {
  const results: HTMLElement[] = [];

  const walk = (el: HTMLElement) => {
    const children = Array.from(el.children).filter(
      (c) => c instanceof HTMLElement
    ) as HTMLElement[];

    // Check whether the current element has block-like child elements.
    const hasBlockChildren = children.some((child) => {
      const display = window.getComputedStyle(child).display;
      return (
        display === 'block' ||
        display === 'list-item' ||
        display === 'flex' ||
        display === 'grid'
      );
    });

    if (!hasBlockChildren && el !== container) {
      // 这是一个叶子块，记录它
      results.push(el);
    } else {
      // 继续向下遍历
      children.forEach((child) => walk(child));
    }
  };

  walk(container);
  return results;
};

const DEFAULT_SECTION_ORDER: ResumeSectionKey[] = ['education', 'projects', 'work', 'skills'];

const ResumeDocument: React.FC<ResumeDocumentProps> = ({ data, config, sectionOrder = DEFAULT_SECTION_ORDER, showOnlyFirstPage = false, isThumbnail = false, onConfigChange, isPrintMode = false }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageOffsets, setPageOffsets] = useState<number[]>([0]);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialConfig, setInitialConfig] = useState(config.avatar);

  // --- Avatar Logic ---
  const getPxPerMm = useCallback(() => {
    if (!measureRef.current) return 3.78;
    return measureRef.current.offsetWidth / A4_WIDTH_MM;
  }, []);

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    if (!onConfigChange) return;
    e.preventDefault();
    e.stopPropagation();

    if (type === 'drag') setIsDragging(true);
    if (type === 'resize') setIsResizing(true);

    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialConfig(config.avatar);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if ((!isDragging && !isResizing) || !onConfigChange) return;

      const pxPerMm = getPxPerMm();
      const deltaX = (e.clientX - dragStart.x) / pxPerMm;
      const deltaY = (e.clientY - dragStart.y) / pxPerMm;

      if (isDragging) {
        onConfigChange({
          ...config,
          avatar: {
            ...config.avatar,
            top: initialConfig.top + deltaY,
            right: initialConfig.right - deltaX,
          }
        });
      } else if (isResizing) {
        const aspectRatio = initialConfig.width / initialConfig.height;
        let newWidth = initialConfig.width - deltaX;
        newWidth = Math.max(10, newWidth);
        const newHeight = newWidth / aspectRatio;

        onConfigChange({
          ...config,
          avatar: {
            ...config.avatar,
            width: newWidth,
            height: newHeight,
          }
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, initialConfig, config, onConfigChange, getPxPerMm]);

  const createMarkup = (htmlContent: string) => {
    const fixedContent = htmlContent
      ? htmlContent.replace(/\uFF08/g, '(').replace(/\uFF09/g, ')')
      : '';
    return { __html: fixedContent };
  };

  // Contact Items Helper
  const contactItems = [
    data.contact.phone,
    data.contact.email ? <a href={`mailto:${data.contact.email}`} className="hover:text-black" style={{ textDecoration: 'none' }}>{data.contact.email}</a> : null,
    data.contact.politicalStatus,
    data.contact.website ? <a href={`https://${data.contact.website}`} target="_blank" rel="noreferrer" className="hover:text-black" style={{ textDecoration: 'none' }}>{data.contact.website}</a> : null,
  ].filter(Boolean);

  const chunkArray = (arr: any[], size: number) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  };
  const contactRows = chunkArray(contactItems, 2);

  // Font Sizes
  const headerFontSize = `${config.baseFontSize * 1.8}pt`;
  const sectionTitleFontSize = `${config.baseFontSize * 1.15}pt`;
  const metaFontSize = `${config.baseFontSize * 0.9}pt`;

  // ====================================================================
  // 简历内容（用于测量容器和每页裁剪显示）
  // ====================================================================
  const normalizedSkillsHtml = (() => {
    if (!data.skills || data.skills.items.length === 0) return '';
    if (data.skills.items.length === 1) return data.skills.items[0];
    return `<ul>${data.skills.items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  })();

  const sectionBlocks: Record<ResumeSectionKey, React.ReactNode> = {
    education: data.education && data.education.length > 0 ? (
      <section className="relative z-10" style={{ marginBottom: `${config.sectionSpacing}mm` }}>
        <div className="flex items-center section-title-bar mb-2">
          <div className="self-stretch bg-black mr-2" style={{ width: '6px' }}></div>
          <h2 className="font-black tracking-wider py-1" style={{ fontSize: sectionTitleFontSize }}>教育背景</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${config.itemSpacing}mm` }}>
          {data.education.map((edu, idx) => (
            <div key={idx} className="relative resume-item">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center flex-wrap">
                  <span className="font-black mr-2">{edu.school}</span>
                  <span className="font-bold mr-2">{edu.degree}</span>
                  <span className="font-bold">{edu.major}</span>
                  <div className="flex gap-1 ml-1">
                    {edu.tags && edu.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="resume-tag px-2 py-0.5 rounded text-center font-normal"
                        style={{
                          fontSize: '0.8em',
                          lineHeight: '1.2',
                          backgroundColor: '#E9F1FF',
                        }}
                      >{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="font-bold text-right shrink-0 ml-2" style={{ fontSize: metaFontSize }}>{edu.duration}</div>
              </div>
              <div dangerouslySetInnerHTML={createMarkup(edu.content)} className="tight-spacing" />
            </div>
          ))}
        </div>
      </section>
    ) : null,
    projects: data.projects && data.projects.length > 0 ? (
      <section className="relative z-10" style={{ marginBottom: `${config.sectionSpacing}mm` }}>
        <div className="flex items-center section-title-bar mb-2">
          <div className="self-stretch bg-black mr-2" style={{ width: '6px' }}></div>
          <h2 className="font-black tracking-wider py-1" style={{ fontSize: sectionTitleFontSize }}>项目经历</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${config.itemSpacing}mm` }}>
          {data.projects.map((proj, idx) => (
            <div key={idx} className="resume-item">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-black">{proj.company}</span>
                <span className="font-bold text-right shrink-0 ml-2" style={{ fontSize: metaFontSize }}>{proj.duration}</span>
              </div>
              <div
                dangerouslySetInnerHTML={createMarkup(proj.content || '')}
                className="tight-spacing"
              />
            </div>
          ))}
        </div>
      </section>
    ) : null,
    work: data.workExperience && data.workExperience.length > 0 ? (
      <section className="relative z-10" style={{ marginBottom: `${config.sectionSpacing}mm` }}>
        <div className="flex items-center section-title-bar mb-2">
          <div className="self-stretch bg-black mr-2" style={{ width: '6px' }}></div>
          <h2 className="font-black tracking-wider py-1" style={{ fontSize: sectionTitleFontSize }}>实习经历</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${config.itemSpacing}mm` }}>
          {data.workExperience.map((work, idx) => (
            <div key={idx} className="resume-item">
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-black">{work.company}</span>
                  {work.role && <span className="font-black">- {work.role}</span>}
                </div>
                <span className="font-bold text-right shrink-0 ml-2" style={{ fontSize: metaFontSize }}>{work.duration}</span>
              </div>
              <div dangerouslySetInnerHTML={createMarkup(work.content)} className="tight-spacing" />
            </div>
          ))}
        </div>
      </section>
    ) : null,
    skills: normalizedSkillsHtml ? (
      <section className="resume-item relative z-10" style={{ marginBottom: `${config.sectionSpacing}mm` }}>
        <div className="flex items-center section-title-bar mb-2">
          <div className="self-stretch bg-black mr-2" style={{ width: '6px' }}></div>
          <h2 className="font-black tracking-wider py-1" style={{ fontSize: sectionTitleFontSize }}>{data.skills.title}</h2>
        </div>
        <div dangerouslySetInnerHTML={createMarkup(normalizedSkillsHtml)} className="tight-spacing" />
      </section>
    ) : null,
  };

  const resumeContent = (
    <div className="resume-inner-content">
      {/* Header */}
      <div className="relative mb-6 z-10">
        <div className="text-center">
          <h1 className="font-black mb-3 tracking-wide" style={{ fontSize: headerFontSize }}>
            {data.name} - {data.title}
          </h1>

          <div className="flex flex-col items-center gap-1" style={{ fontSize: metaFontSize }}>
            {contactRows.map((row, rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-2">
                {row.map((item, itemIdx) => (
                  <React.Fragment key={itemIdx}>
                    <div className="font-bold">{item}</div>
                    {itemIdx < row.length - 1 && <div className="text-gray-400 select-none">|</div>}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {sectionOrder.map((sectionKey) => (
        <React.Fragment key={sectionKey}>
          {sectionBlocks[sectionKey]}
        </React.Fragment>
      ))}
    </div>
  );

  // ====================================================================
  // 行感知分页：测量叶子块位置，在行边界处分页
  // ====================================================================
  useEffect(() => {
    const measure = () => {
      if (!measureRef.current) {
        console.log('[Pagination] measureRef is null');
        return;
      }

      const container = measureRef.current;
      const pxPerMm = container.offsetWidth / A4_WIDTH_MM;
      const pageH = (A4_HEIGHT_MM - 2 * config.pagePaddingY) * pxPerMm - PAGE_HEIGHT_SAFETY_PX;
      const rawTotalH = container.scrollHeight;

      const leafBlocks = getLeafBlocks(container);
      const containerRect = container.getBoundingClientRect();

      const blockPositions = leafBlocks.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
        };
      }).sort((a, b) => a.top - b.top);

      const uniqueBlocks: { top: number; bottom: number }[] = [];
      for (const bp of blockPositions) {
        if (
          uniqueBlocks.length === 0 ||
          Math.abs(bp.top - uniqueBlocks[uniqueBlocks.length - 1].top) > PAGINATION_EPSILON_PX
        ) {
          uniqueBlocks.push(bp);
          continue;
        }

        const last = uniqueBlocks[uniqueBlocks.length - 1];
        last.bottom = Math.max(last.bottom, bp.bottom);
      }

      const maxBlockBottom = uniqueBlocks.reduce((maxBottom, block) => {
        return Math.max(maxBottom, block.bottom);
      }, 0);

      // Prefer actual content bottom to avoid creating blank trailing pages due to container rounding/trailing whitespace.
      const totalH = uniqueBlocks.length > 0 ? maxBlockBottom : rawTotalH;

      console.log('[Pagination]', {
        containerWidth: container.offsetWidth,
        pxPerMm,
        pageH,
        rawTotalH,
        maxBlockBottom,
        totalH,
        needsPagination: totalH > pageH + MIN_TAIL_PAGE_CONTENT_PX,
      });

      if (totalH <= pageH + MIN_TAIL_PAGE_CONTENT_PX) {
        console.log('[Pagination] Content fits on one page');
        setPageOffsets([0]);
        return;
      }

      if (uniqueBlocks.length === 0) {
        console.log('[Pagination] No unique blocks found');
        const fallbackOffsets: number[] = [0];
        let nextStart = pageH;
        while (nextStart < totalH - MIN_TAIL_PAGE_CONTENT_PX) {
          fallbackOffsets.push(nextStart);
          nextStart += pageH;
        }
        setPageOffsets(fallbackOffsets);
        return;
      }

      const offsets: number[] = [0];
      let currentPageStart = 0;

      const maxPages = Math.max(1, Math.ceil(totalH / pageH) + 2);
      let guard = 0;

      while (currentPageStart + pageH < totalH - MIN_TAIL_PAGE_CONTENT_PX && guard < maxPages) {
        const pageBottom = currentPageStart + pageH;
        const overflowBlock = uniqueBlocks.find((block) => (
          block.bottom > pageBottom + PAGINATION_EPSILON_PX &&
          block.top >= currentPageStart - PAGINATION_EPSILON_PX
        ));

        if (!overflowBlock) {
          break;
        }

        let nextStart = overflowBlock.top;
        if (nextStart <= currentPageStart + PAGINATION_EPSILON_PX) {
          nextStart = pageBottom;
        }

        if (nextStart >= totalH - MIN_TAIL_PAGE_CONTENT_PX) {
          break;
        }

        if (nextStart - offsets[offsets.length - 1] <= PAGINATION_EPSILON_PX) {
          break;
        }

        offsets.push(nextStart);
        currentPageStart = nextStart;
        guard += 1;
      }

      // 兜底：若还有剩余高度未覆盖，按页高继续补页，避免漏掉最后几行
      while (
        offsets[offsets.length - 1] + pageH < totalH - MIN_TAIL_PAGE_CONTENT_PX &&
        guard < maxPages
      ) {
        offsets.push(offsets[offsets.length - 1] + pageH);
        guard += 1;
      }

      const normalizedOffsets = offsets.filter((offset, index, arr) => {
        if (index === 0) return true;
        return offset - arr[index - 1] > PAGINATION_EPSILON_PX;
      });

      while (
        normalizedOffsets.length > 1 &&
        totalH - normalizedOffsets[normalizedOffsets.length - 1] <= MIN_TAIL_PAGE_CONTENT_PX
      ) {
        normalizedOffsets.pop();
      }

      console.log('[Pagination] Final offsets:', normalizedOffsets, 'leafBlocks:', leafBlocks.length, 'uniqueBlocks:', uniqueBlocks.length);
      setPageOffsets(normalizedOffsets);
    };

    const scheduleMeasure = () => {
      const fontSet = (document as Document & { fonts?: FontFaceSet }).fonts;
      const run = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(measure);
        });
      };

      if (fontSet) {
        fontSet.ready.then(run).catch(run);
      } else {
        run();
      }
    };

    let timer: number | undefined;
    if (isPrintMode) {
      scheduleMeasure();
    } else {
      timer = window.setTimeout(scheduleMeasure, 50);
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [data, config, isPrintMode]);

  // 计算每页可用内容高度 (px)
  const pxPerMm = measureRef.current
    ? measureRef.current.offsetWidth / A4_WIDTH_MM
    : 3.78;
  const mmPerPx = 1 / pxPerMm;
  const pageContentHeightPx = (A4_HEIGHT_MM - 2 * config.pagePaddingY) * pxPerMm - PAGE_HEIGHT_SAFETY_PX;

  // ====================================================================
  // 样式
  // ====================================================================
  const sharedStyles = (
    <style>{`
      .resume-page, .resume-page * {
        color: #000000 !important;
        border-color: #000000;
        font-synthesis: none;
      }
      .resume-page .resume-tag {
        color: #508CFF !important;
      }
      .resume-content b,
      .resume-content strong {
        font-weight: 700 !important;
      }
      .resume-content ul,
      .resume-content ol {
        margin: 0.2em 0 0.2em 1.1em;
        padding-left: 1.1em;
        list-style-position: outside;
      }
      .resume-content ul {
        list-style-type: disc;
      }
      .resume-content ol {
        list-style-type: decimal;
      }
      .resume-content li {
        display: list-item;
        margin-bottom: 0.1em;
      }
      .resume-content li > ul,
      .resume-content li > ol {
        margin-top: 0.1em;
      }
      .section-title-bar { 
        background-color: #f3f4f6; 
        line-height: 1.5;
      }
      .resume-content p { margin: 0; }
      .tight-spacing { letter-spacing: -0.01em; }
      /* Normalize pasted rich text so mixed inline font sizes don't break visual consistency. */
      .tight-spacing,
      .tight-spacing * {
        font-family: inherit !important;
        font-size: inherit !important;
        line-height: inherit !important;
      }
      .tight-spacing h1,
      .tight-spacing h2,
      .tight-spacing h3,
      .tight-spacing h4,
      .tight-spacing h5,
      .tight-spacing h6 {
        margin: 0;
        font-size: inherit !important;
        line-height: inherit !important;
        font-weight: 700;
      }
      .resume-content a {
        color: #000000 !important;
        text-decoration-line: ${config.linkUnderline ? 'underline' : 'none'};
        text-decoration-style: solid;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
        cursor: pointer;
      }
      .resume-content u {
        text-decoration-line: underline;
        text-decoration-style: solid;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
      }

      /* 隐藏测量容器 */
      .measure-container {
        width: ${A4_WIDTH_MM}mm;
        padding: 0 ${config.pagePaddingX}mm;
        position: absolute;
        left: -9999px;
        top: 0;
        visibility: hidden;
        pointer-events: none;
        font-family: ${config.fontFamily};
        font-size: ${config.baseFontSize}pt;
        line-height: ${config.lineHeight};
        box-sizing: border-box;
      }

      /* A4 页面 */
      .resume-page {
        width: ${A4_WIDTH_MM}mm;
        height: ${A4_HEIGHT_MM}mm;
        background-color: white;
        position: relative;
        box-sizing: border-box;
        font-family: ${config.fontFamily};
        font-size: ${config.baseFontSize}pt;
        line-height: ${config.lineHeight};
        box-shadow: ${isThumbnail ? 'none' : '0 1px 8px rgba(0, 0, 0, 0.10)'};
        overflow: hidden;
      }

      /* 裁剪窗口 */
      .page-viewport {
        position: absolute;
        top: ${config.pagePaddingY}mm;
        left: ${config.pagePaddingX}mm;
        right: ${config.pagePaddingX}mm;
        overflow: hidden;
      }

      .page-gap { height: 40px; }

      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }
        html, body { width: ${A4_WIDTH_MM}mm; margin: 0; padding: 0; }
        .print-hidden { display: none !important; }
        .measure-container { display: none !important; }
        .page-gap { display: none !important; }
        .resume-page {
          width: ${A4_WIDTH_MM}mm !important;
          height: ${A4_HEIGHT_MM}mm !important;
          margin: 0 !important;
          box-shadow: none !important;
          page-break-after: always;
          break-after: page;
        }
        .resume-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .avatar-print-position {
          position: absolute;
          top: ${config.avatar.top}mm;
          right: ${config.avatar.right}mm;
        }
      }
    `}</style>
  );

  // ====================================================================
  // 渲染
  // ====================================================================
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {sharedStyles}

      {/* 隐藏测量容器 */}
      <div ref={measureRef} className="measure-container resume-content">
        {resumeContent}
      </div>

      {/* 多页渲染：每页在行边界处裁剪 */}
      {(showOnlyFirstPage ? pageOffsets.slice(0, 1) : pageOffsets).map((offset, pageIdx) => {
        const globalPageIdx = showOnlyFirstPage ? 0 : pageIdx;
        const nextOffset = globalPageIdx < pageOffsets.length - 1
          ? pageOffsets[globalPageIdx + 1]
          : offset + pageContentHeightPx;
        const clipHeight = nextOffset - offset;
        const clipHeightMm = clipHeight * mmPerPx;
        const offsetMm = offset * mmPerPx;

        return (
          <React.Fragment key={pageIdx}>
            {!showOnlyFirstPage && pageIdx > 0 && <div className="page-gap print-hidden" />}
            <div className="resume-page resume-content select-none">
              {/* 头像：仅第一页显示，直接在页面上，不受 viewport 裁剪 */}
              {pageIdx === 0 && data.avatarUrl && (
                <>
                  <div
                    className="absolute group hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 transition-shadow cursor-move z-20 print-hidden avatar-drag-target"
                    style={{
                      top: `${config.avatar.top}mm`,
                      right: `${config.avatar.right}mm`,
                      width: `${config.avatar.width}mm`,
                      height: `${config.avatar.height}mm`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'drag')}
                  >
                    <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all flex items-center justify-center avatar-handles">
                      <Move className="text-white opacity-0 group-hover:opacity-70 w-8 h-8 drop-shadow-md" />
                    </div>
                    <div
                      className="absolute -bottom-1 -left-1 w-5 h-5 bg-white border border-gray-400 rounded-full shadow cursor-sw-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity avatar-handles z-20 hover:bg-blue-50"
                      onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  {/* 打印用头像 */}
                  <div
                    className="hidden print:block absolute"
                    style={{
                      top: `${config.avatar.top}mm`,
                      right: `${config.avatar.right}mm`,
                      width: `${config.avatar.width}mm`,
                      height: `${config.avatar.height}mm`,
                      zIndex: 10
                    }}
                  >
                    <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover" />
                  </div>
                </>
              )}
              <div className="page-viewport" style={{ height: `${clipHeightMm}mm` }}>
                <div
                  style={{
                    transform: `translateY(-${offsetMm}mm)`,
                  }}
                >
                  {resumeContent}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ResumeDocument;


