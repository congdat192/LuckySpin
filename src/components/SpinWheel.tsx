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
}

export default function SpinWheel({
    prizes,
    isSpinning,
    targetIndex,
    onSpinComplete
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
        // Calculate target rotation (5 full spins + target position)
        // Prize at top = -90 degrees offset
        const targetRotation =
            startRotation +
            360 * 5 + // 5 full rotations
            (360 - (targetIndex * segmentAngle) - segmentAngle / 2); // Land on prize

        const duration = 5000; // 5 seconds
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            const rotation = startRotation + (targetRotation - startRotation) * eased;
            setCurrentRotation(rotation % 360);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete
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
        <div className="relative">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-full p-4 shadow-2xl">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="block"
                />

                {/* Outer ring decoration */}
                <div className="absolute inset-0 rounded-full border-8 border-yellow-400/50 pointer-events-none" />
                <div className="absolute inset-2 rounded-full border-4 border-gray-600 pointer-events-none" />
            </div>

            {/* Lights around the wheel */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-3 h-3 rounded-full bg-yellow-400 animate-pulse"
                        style={{
                            left: `calc(50% + ${Math.cos((i * 30 - 90) * Math.PI / 180) * 220}px)`,
                            top: `calc(50% + ${Math.sin((i * 30 - 90) * Math.PI / 180) * 220}px)`,
                            transform: 'translate(-50%, -50%)',
                            animationDelay: `${i * 100}ms`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
