import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

/**
 * Trim transparent whitespace around canvas drawing to eliminate excessive blank margins.
 */
export function trimCanvas(canvas, padding = 8) {
    if (!canvas) return null;
    try {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        let minX = w, minY = h, maxX = 0, maxY = 0;
        let found = false;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const alpha = d[(y * w + x) * 4 + 3];
                if (alpha > 15) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            }
        }

        if (!found || maxX <= minX || maxY <= minY) {
            return canvas.toDataURL('image/png');
        }

        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropW = Math.min(w - cropX, (maxX - minX) + (padding * 2));
        const cropH = Math.min(h - cropY, (maxY - minY) + (padding * 2));

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        return cropCanvas.toDataURL('image/png');
    } catch (e) {
        console.error('Error trimming canvas:', e);
        return canvas.toDataURL('image/png');
    }
}

/**
 * Automatically removes white or off-white background from uploaded signature files,
 * performs edge anti-aliasing, and trims excess padding to produce a crisp transparent PNG.
 */
export function processSignatureImage(source, callback, options = {}) {
    const {
        brightnessThreshold = 220,
        fadeThreshold = 175,
        padding = 8,
    } = options;

    const handleImg = (img) => {
        try {
            const canvas = document.createElement('canvas');
            const w = img.naturalWidth || img.width || 400;
            const h = img.naturalHeight || img.height || 200;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;

            let minX = w, minY = h, maxX = 0, maxY = 0;
            let hasStroke = false;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = (y * w + x) * 4;
                    const r = d[idx];
                    const g = d[idx + 1];
                    const b = d[idx + 2];
                    const a = d[idx + 3];

                    if (a < 10) continue;

                    // Standard perceived brightness (ITU-R BT.601)
                    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                    if (brightness >= brightnessThreshold) {
                        d[idx + 3] = 0; // Completely transparent
                    } else if (brightness > fadeThreshold) {
                        // Smooth anti-aliased edge
                        const factor = (brightnessThreshold - brightness) / (brightnessThreshold - fadeThreshold);
                        d[idx + 3] = Math.round(a * factor);
                        if (d[idx + 3] > 15) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                            hasStroke = true;
                        }
                    } else {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                        hasStroke = true;
                    }
                }
            }

            ctx.putImageData(imgData, 0, 0);

            if (hasStroke && maxX > minX && maxY > minY) {
                const cropX = Math.max(0, minX - padding);
                const cropY = Math.max(0, minY - padding);
                const cropW = Math.min(w - cropX, (maxX - minX) + (padding * 2));
                const cropH = Math.min(h - cropY, (maxY - minY) + (padding * 2));

                // Constrain max dimensions to keep transparent PNG lightweight and sharp
                const maxOutputW = 600;
                const maxOutputH = 250;
                let targetW = cropW;
                let targetH = cropH;
                if (targetW > maxOutputW || targetH > maxOutputH) {
                    const ratio = Math.min(maxOutputW / targetW, maxOutputH / targetH);
                    targetW = Math.max(1, Math.round(targetW * ratio));
                    targetH = Math.max(1, Math.round(targetH * ratio));
                }

                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = targetW;
                cropCanvas.height = targetH;
                const cropCtx = cropCanvas.getContext('2d');
                cropCtx.imageSmoothingEnabled = true;
                cropCtx.imageSmoothingQuality = 'high';
                cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

                callback(cropCanvas.toDataURL('image/png'));
            } else {
                callback(canvas.toDataURL('image/png'));
            }
        } catch (e) {
            console.error('Error processing signature image transparency:', e);
            callback(typeof source === 'string' ? source : null);
        }
    };

    if (typeof source === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => handleImg(img);
        img.onerror = () => callback(source);
        img.src = source;
    } else if (source instanceof File || source instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => handleImg(img);
            img.onerror = () => callback(e.target.result);
            img.src = e.target.result;
        };
        reader.readAsDataURL(source);
    } else {
        callback(null);
    }
}

/**
 * High-precision touch & stylus signature pad.
 * Fully compatible with iPad, Apple Pencil, iPhone, Android, and desktop mouse.
 */
const SignaturePad = forwardRef(({ 
    height = 200, 
    strokeColor = '#0f172a', 
    strokeWidth = 2.5,
    onBegin,
    onEnd,
    onChange
}, ref) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const isDrawingRef = useRef(false);
    const [hasStrokes, setHasStrokes] = useState(false);
    const strokeHistory = useRef([]);
    const currentStroke = useRef([]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        clear: () => clearCanvas(),
        undo: () => undoStroke(),
        isEmpty: () => !hasStrokes,
        toDataURL: (trim = true) => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            return trim ? trimCanvas(canvas) : canvas.toDataURL('image/png');
        }
    }));

    // Setup High-DPI canvas
    const setupCanvas = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Set display size (CSS pixels)
        canvas.style.width = '100%';
        canvas.style.height = `${height}px`;

        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(height * dpr);

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;

        // Redraw existing strokes if any
        redrawStrokes();
    };

    useEffect(() => {
        setupCanvas();

        const handleResize = () => {
            setupCanvas();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [height]);

    // Prevent scrolling on touch screens when drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const preventTouchScroll = (e) => {
            if (e.cancelable) e.preventDefault();
        };

        canvas.addEventListener('touchstart', preventTouchScroll, { passive: false });
        canvas.addEventListener('touchmove', preventTouchScroll, { passive: false });
        canvas.addEventListener('touchend', preventTouchScroll, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', preventTouchScroll);
            canvas.removeEventListener('touchmove', preventTouchScroll);
            canvas.removeEventListener('touchend', preventTouchScroll);
        };
    }, []);

    const getCanvasPoint = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX = 0;
        let clientY = 0;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        isDrawingRef.current = true;
        setIsDrawing(true);
        const point = getCanvasPoint(e);
        currentStroke.current = [point];

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = strokeColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;

        ctx.beginPath();
        ctx.arc(point.x, point.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();

        if (onBegin) onBegin();
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        const point = getCanvasPoint(e);
        currentStroke.current.push(point);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const points = currentStroke.current;
        if (points.length >= 2) {
            const p1 = points[points.length - 2];
            const p2 = points[points.length - 1];

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        setIsDrawing(false);

        if (currentStroke.current.length > 0) {
            strokeHistory.current.push([...currentStroke.current]);
            currentStroke.current = [];
            setHasStrokes(true);

            if (onChange && canvasRef.current) {
                onChange(canvasRef.current.toDataURL('image/png'));
            }
        }

        if (onEnd) onEnd();
    };

    const redrawStrokes = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Clear canvas using logical size
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        strokeHistory.current.forEach(stroke => {
            if (stroke.length === 1) {
                ctx.beginPath();
                ctx.arc(stroke[0].x, stroke[0].y, strokeWidth / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (stroke.length > 1) {
                ctx.beginPath();
                ctx.moveTo(stroke[0].x, stroke[0].y);
                for (let i = 1; i < stroke.length; i++) {
                    ctx.lineTo(stroke[i].x, stroke[i].y);
                }
                ctx.stroke();
            }
        });
    };

    const undoStroke = () => {
        if (strokeHistory.current.length === 0) return;
        strokeHistory.current.pop();
        redrawStrokes();

        const remaining = strokeHistory.current.length > 0;
        setHasStrokes(remaining);

        if (onChange && canvasRef.current) {
            onChange(remaining ? canvasRef.current.toDataURL('image/png') : null);
        }
    };

    const clearCanvas = () => {
        strokeHistory.current = [];
        currentStroke.current = [];
        setHasStrokes(false);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }

        if (onChange) onChange(null);
    };

    return (
        <div className="w-full flex flex-col space-y-2 select-none" ref={containerRef}>
            {/* Canvas Container with Guide Line and iPad Touch Styling */}
            <div 
                className="relative w-full rounded-2xl border-2 border-dashed border-purple-200 bg-linear-to-b from-slate-50/60 to-white overflow-hidden shadow-inner cursor-crosshair touch-none"
                style={{ height: `${height}px` }}
            >
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full block"
                />

                {/* Subtle Signature Baseline */}
                <div className="absolute bottom-8 left-8 right-8 border-b border-dotted border-purple-300 pointer-events-none flex items-center justify-between text-[11px] text-purple-400 font-sans">
                    <span>✍️ ลงลายมือชื่อบนเส้นประนี้</span>
                    <span className="opacity-70">สัมผัสหน้าจอ / ใช้ปากกา Stylus / นิ้วมือ</span>
                </div>

                {/* Empty State Prompt */}
                {!hasStrokes && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs">
                        <span className="text-2xl mb-1 opacity-70">✒️</span>
                        <p className="font-medium text-slate-500">เซ็นสดผ่านหน้าจอสัมผัส (มือถือ / iPad / แท็บเล็ต / เมาส์)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ระบบจะบันทึกเส้นสายอย่างคมชัดระดับความละเอียดสูง</p>
                    </div>
                )}
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    รองรับแรงกดและเส้นสัมผัสต่อเนื่อง
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={undoStroke}
                        disabled={!hasStrokes}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
                    >
                        ↩️ ย้อนกลับ
                    </button>
                    <button
                        type="button"
                        onClick={clearCanvas}
                        disabled={!hasStrokes}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
                    >
                        🗑️ ล้างลายเซ็น
                    </button>
                </div>
            </div>
        </div>
    );
});

export default SignaturePad;
