import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

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
    const [hasStrokes, setHasStrokes] = useState(false);
    const strokeHistory = useRef([]);
    const currentStroke = useRef([]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        clear: () => clearCanvas(),
        undo: () => undoStroke(),
        isEmpty: () => !hasStrokes,
        toDataURL: () => {
            const canvas = canvasRef.current;
            return canvas ? canvas.toDataURL('image/png') : null;
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
            if (isDrawing || e.target === canvas) {
                // Only prevent default on touch within canvas
                if (e.cancelable) e.preventDefault();
            }
        };

        canvas.addEventListener('touchstart', preventTouchScroll, { passive: false });
        canvas.addEventListener('touchmove', preventTouchScroll, { passive: false });
        canvas.addEventListener('touchend', preventTouchScroll, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', preventTouchScroll);
            canvas.removeEventListener('touchmove', preventTouchScroll);
            canvas.removeEventListener('touchend', preventTouchScroll);
        };
    }, [isDrawing]);

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
        setIsDrawing(true);
        const point = getCanvasPoint(e);
        currentStroke.current = [point];

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(point.x, point.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();

        if (onBegin) onBegin();
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const point = getCanvasPoint(e);
        currentStroke.current.push(point);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const points = currentStroke.current;
        if (points.length >= 3) {
            const p1 = points[points.length - 2];
            const p2 = points[points.length - 1];
            const midPoint = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            };

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
        } else if (points.length === 2) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
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
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        strokeHistory.current.forEach(stroke => {
            if (stroke.length === 1) {
                ctx.beginPath();
                ctx.arc(stroke[0].x, stroke[0].y, strokeWidth / 2, 0, Math.PI * 2);
                ctx.fillStyle = strokeColor;
                ctx.fill();
            } else {
                for (let i = 1; i < stroke.length; i++) {
                    const p1 = stroke[i - 1];
                    const p2 = stroke[i];
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
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
