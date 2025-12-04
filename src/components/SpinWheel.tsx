'use client';

import { useEffect, useRef, useState } from 'react';

interface Prize {
    id: string;
    name: string;
    color: string;
    image_url?: string | null;
}

interface SpinWheelProps {
    prizes: Prize[];
    isSpinning: boolean;
    targetIndex: number | null;
    onSpinComplete: () => void;
    canSpin?: boolean;
    onSpin?: () => void;
}

export default function SpinWheel({
    prizes,
    isSpinning,
    targetIndex,
    onSpinComplete,
    canSpin = false,
    onSpin,
}: SpinWheelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentRotation, setCurrentRotation] = useState(0);
    const animationRef = useRef<number | null>(null);

    const segmentAngle = 360 / prizes.length;

    // Draw wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw segments
        prizes.forEach((prize, index) => {
            const startAngle = (index * segmentAngle - 90 + currentRotation) * (Math.PI / 180);
            const endAngle = ((index + 1) * segmentAngle - 90 + currentRotation) * (Math.PI / 180);

            // Segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = prize.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + (segmentAngle / 2) * (Math.PI / 180));
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 3;

            // Truncate long text
            const text = prize.name.length > 15 ? prize.name.slice(0, 12) + '...' : prize.name;
            ctx.fillText(text, radius - 20, 5);
            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#1f2937';
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Center text
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QUAY', centerX, centerY - 5);
        ctx.fillText('NGAY', centerX, centerY + 12);

    }, [prizes, currentRotation, segmentAngle]);

    // Spin animation
    useEffect(() => {
        if (!isSpinning || targetIndex === null) return;

        const startRotation = currentRotation;

        // Calculate exact center of target segment
        // Pointer is at top (0 degrees), segments start from -90 degrees
        // To land on segment N, we need to rotate so segment N's center aligns with the pointer
        const segmentCenterOffset = segmentAngle / 2;
        const targetSegmentAngle = targetIndex * segmentAngle + segmentCenterOffset;

        // Calculate target rotation (5 full spins + position to land in center)
        // We subtract because wheel rotates clockwise
        const targetRotation =
            startRotation +
            360 * 5 + // 5 full rotations for suspense
            (360 - targetSegmentAngle); // Land exactly on center of prize

        const duration = 5000; // 5 seconds
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease out cubic for smooth stop)
            const eased = 1 - Math.pow(1 - progress, 3);

            const rotation = startRotation + (targetRotation - startRotation) * eased;
            setCurrentRotation(rotation % 360);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete - set exact final position
                setCurrentRotation(targetRotation % 360);
                setTimeout(onSpinComplete, 500);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isSpinning, targetIndex, segmentAngle, onSpinComplete]);

    return (
        <div className="relative mx-4 sm:mx-0">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] sm:border-l-[15px] sm:border-r-[15px] sm:border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <div className="relative bg-gradient-to-b from-red-900 to-green-900 rounded-full p-3 sm:p-4 shadow-2xl">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="block w-full max-w-[320px] sm:max-w-[400px] h-auto mx-auto"
                />

                {/* Center button */}
                <button
                    onClick={onSpin}
                    disabled={!canSpin || isSpinning}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-24 h-24 rounded-full font-bold text-sm
                        flex items-center justify-center text-center
                        transition-all duration-300 z-20
                        bg-gradient-to-b from-red-500 to-red-700 text-white border-4 border-yellow-400
                        ${canSpin && !isSpinning
                            ? 'shadow-lg shadow-yellow-400/50 animate-pulse-glow cursor-pointer hover:scale-105'
                            : isSpinning
                                ? 'opacity-80 cursor-wait'
                                : 'opacity-60 cursor-default'
                        }`}
                >
                    {isSpinning ? (
                        <span className="animate-spin text-2xl">🎄</span>
                    ) : (
                        <span className="whitespace-pre-line leading-tight">QUAY{'\n'}NGAY</span>
                    )}
                </button>

                {/* Outer ring decoration - gold */}
                <div className="absolute inset-0 rounded-full border-8 border-yellow-400 pointer-events-none shadow-lg shadow-yellow-400/30" />
                <div className="absolute inset-2 rounded-full border-4 border-yellow-600/50 pointer-events-none" />
            </div>

            {/* Christmas lights around the wheel */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 16 }).map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-3 h-3 rounded-full animate-pulse ${i % 2 === 0 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{
                            left: `calc(50% + ${Math.cos((i * 22.5 - 90) * Math.PI / 180) * 220}px)`,
                            top: `calc(50% + ${Math.sin((i * 22.5 - 90) * Math.PI / 180) * 220}px)`,
                            transform: 'translate(-50%, -50%)',
                            animationDelay: `${i * 150}ms`,
                            boxShadow: i % 2 === 0 ? '0 0 8px #ef4444' : '0 0 8px #22c55e',
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes pulse-glow {
                    0%, 100% { 
                        box-shadow: 0 0 20px rgba(234, 179, 8, 0.6), 0 0 40px rgba(234, 179, 8, 0.3);
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% { 
                        box-shadow: 0 0 30px rgba(234, 179, 8, 0.8), 0 0 60px rgba(234, 179, 8, 0.5);
                        transform: translate(-50%, -50%) scale(1.05);
                    }
                }
                .animate-pulse-glow {
                    animation: pulse-glow 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
