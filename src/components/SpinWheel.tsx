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
    const [showTooltip, setShowTooltip] = useState(false);
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

            // Segment - use Christmas colors instead of prize.color
            const christmasColors = [
                '#c41e3a', // Christmas red
                '#165b33', // Christmas green  
                '#bb2528', // Candy red
                '#146b3a', // Holly green
                '#d4af37', // Gold
                '#8b0000', // Dark red
                '#228b22', // Forest green
                '#b8860b', // Dark gold
            ];
            const segmentColor = christmasColors[index % christmasColors.length];

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = segmentColor;
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
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

        const duration = 8000; // 8 seconds
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
            {/* Pointer - Custom Logo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <img
                    src="/pointer.png"
                    alt="Pointer"
                    className="w-12 h-12 sm:w-14 sm:h-14"
                    style={{
                        filter: `
                            drop-shadow(0 0 1px white)
                            drop-shadow(0 0 2px white)
                            drop-shadow(0 0 3px rgba(255,255,255,0.8))
                            drop-shadow(0 4px 6px rgba(0,0,0,0.4))
                        `
                    }}
                />
            </div>

            {/* Wheel */}
            <div className="relative bg-gradient-to-br from-[#1a0a0a] via-[#0d1a0d] to-[#1a0a0a] rounded-full p-3 sm:p-4 shadow-2xl">
                {/* Glow behind wheel */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/20 via-yellow-500/10 to-green-500/20 blur-xl scale-105" />

                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="block w-full max-w-[320px] sm:max-w-[400px] h-auto mx-auto relative z-10"
                />

                {/* Center button */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    {/* Tooltip */}
                    {showTooltip && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg animate-fade-in">
                            Nhập mã hóa đơn để tra cứu lượt quay
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                    )}
                    <button
                        onClick={() => {
                            if (canSpin && !isSpinning && onSpin) {
                                onSpin();
                            } else if (!canSpin && !isSpinning) {
                                setShowTooltip(true);
                                setTimeout(() => setShowTooltip(false), 2000);
                            }
                        }}
                        className={`w-24 h-24 rounded-full font-bold text-sm
                            flex items-center justify-center text-center
                            transition-all duration-300
                            bg-gradient-to-b from-red-600 to-red-800 text-white border-4 border-yellow-400 shadow-lg
                            ${canSpin && !isSpinning
                                ? 'shadow-yellow-400/50 animate-pulse-glow cursor-pointer hover:scale-105'
                                : isSpinning
                                    ? 'cursor-wait opacity-80'
                                    : 'cursor-pointer'
                            }`}
                    >
                        {isSpinning ? (
                            <span className="animate-spin text-2xl">🎄</span>
                        ) : (
                            <span className="whitespace-pre-line leading-tight">QUAY{'\n'}NGAY</span>
                        )}
                    </button>
                </div>

                {/* Outer ring decoration - gold */}
                <div className="absolute inset-0 rounded-full border-[6px] sm:border-8 border-yellow-500 pointer-events-none shadow-[0_0_30px_rgba(234,179,8,0.4)] z-10" />
                <div className="absolute inset-2 rounded-full border-2 sm:border-4 border-yellow-600/40 pointer-events-none z-10" />
            </div>

            {/* Christmas lights around the wheel */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-2 sm:w-3 h-2 sm:h-3 rounded-full ${i % 3 === 0 ? 'bg-red-500' : i % 3 === 1 ? 'bg-green-500' : 'bg-yellow-400'
                            }`}
                        style={{
                            left: `calc(50% + ${Math.cos((i * 18 - 90) * Math.PI / 180) * 190}px)`,
                            top: `calc(50% + ${Math.sin((i * 18 - 90) * Math.PI / 180) * 190}px)`,
                            transform: 'translate(-50%, -50%)',
                            animation: `twinkle 1.5s ease-in-out infinite`,
                            animationDelay: `${i * 100}ms`,
                            boxShadow: i % 3 === 0
                                ? '0 0 10px #ef4444, 0 0 20px #ef4444'
                                : i % 3 === 1
                                    ? '0 0 10px #22c55e, 0 0 20px #22c55e'
                                    : '0 0 10px #facc15, 0 0 20px #facc15',
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes pulse-glow {
                    0%, 100% { 
                        box-shadow: 0 0 20px rgba(234, 179, 8, 0.6), 0 0 40px rgba(234, 179, 8, 0.3);
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 0 30px rgba(234, 179, 8, 0.8), 0 0 60px rgba(234, 179, 8, 0.5);
                        transform: scale(1.05);
                    }
                }
                .animate-pulse-glow {
                    animation: pulse-glow 1.5s ease-in-out infinite;
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
                }
            `}</style>
        </div>
    );
}
