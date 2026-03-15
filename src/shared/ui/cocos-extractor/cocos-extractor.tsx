import { cn } from '@shared/lib/clsx/clsx';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Типы для нашего спрайта
interface SpriteData {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    dataUrl: string;
}

interface CocosExtractorProps {
    initialMinSize?: number;
}

export const CocosExtractor: React.FC = ({ initialMinSize = 10 }: CocosExtractorProps) => {
    const { t } = useTranslation();
    const [minSize, setMinSize] = useState<number>(initialMinSize);
    const [sprites, setSprites] = useState<SpriteData[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [textureName, setTextureName] = useState('texture.png');
    const [flieName, setflieName] = useState('');
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Алгоритм поиска спрайтов по прозрачности
    const processImage = (img: HTMLImageElement, fileName: string, minSize: number) => {
        setTextureName(fileName);
        setImgSize({ w: img.width, h: img.height });

        const canvas = document.createElement('canvas');
        const w = (canvas.width = img.width);
        const h = (canvas.height = img.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const visited = new Uint8Array(w * h);
        const foundSprites: SpriteData[] = [];

        const getIndex = (x: number, y: number) => y * w + x;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = getIndex(x, y);

                // Если пиксель не посещен и он не прозрачный (Alpha > 0)
                if (!visited[idx] && data[idx * 4 + 3] > 0) {
                    let minX = x, maxX = x, minY = y, maxY = y;
                    const queue = [idx];
                    visited[idx] = 1;

                    let qIdx = 0;
                    // Обход в ширину (BFS) для нахождения всех связанных пикселей
                    while (qIdx < queue.length) {
                        const curr = queue[qIdx++];
                        const cx = curr % w;
                        const cy = Math.floor(curr / w);

                        if (cx < minX) minX = cx;
                        if (cx > maxX) maxX = cx;
                        if (cy < minY) minY = cy;
                        if (cy > maxY) maxY = cy;

                        // Проверяем 8 соседей вокруг пикселя
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = cx + dx;
                                const ny = cy + dy;

                                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                    const nIdx = getIndex(nx, ny);
                                    if (!visited[nIdx] && data[nIdx * 4 + 3] > 0) {
                                        visited[nIdx] = 1;
                                        queue.push(nIdx);
                                    }
                                }
                            }
                        }
                    }

                    const rectW = maxX - minX + 1;
                    const rectH = maxY - minY + 1;

                    if (rectW >= minSize && rectH >= minSize) {
                        // Создаем временный канвас для сохранения миниатюры
                        const subCanvas = document.createElement('canvas');
                        subCanvas.width = rectW;
                        subCanvas.height = rectH;
                        const subCtx = subCanvas.getContext('2d');
                        subCtx?.putImageData(ctx.getImageData(minX, minY, rectW, rectH), 0, 0);

                        foundSprites.push({
                            id: `sprite_${foundSprites.length + 1}.png`,
                            x: minX,
                            y: minY,
                            w: rectW,
                            h: rectH,
                            dataUrl: subCanvas.toDataURL(),
                        });
                    }
                }
            }
        }

        setSprites(foundSprites);
        setSelectedIds(new Set(foundSprites.map((s) => s.id))); // По умолчанию выбираем все
        setIsProcessing(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setflieName(file.name.replace(/\.[^/.]+$/, ""));

        setIsProcessing(true);
        setSprites([]);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => processImage(img, file.name, minSize);
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);

        // Сбрасываем значение инпута, чтобы повторный выбор того же файла вызывал onChange
        e.target.value = '';
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const generateAndDownloadPlist = () => {
        const selectedSprites = sprites.filter((s) => selectedIds.has(s.id));

        const framesXml = selectedSprites.map(s => `
        <key>${s.id}</key>
        <dict>
            <key>frame</key>
            <string>{{${s.x},${s.y}},{${s.w},${s.h}}}</string>
            <key>offset</key>
            <string>{0,0}</string>
            <key>rotated</key>
            <false/>
            <key>sourceColorRect</key>
            <string>{{0,0},{${s.w},${s.h}}}</string>
            <key>sourceSize</key>
            <string>{${s.w},${s.h}}</string>
        </dict>`).join('');

        const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>frames</key>
    <dict>${framesXml}
    </dict>
    <key>metadata</key>
    <dict>
        <key>format</key>
        <integer>2</integer>
        <key>realTextureFileName</key>
        <string>${textureName}</string>
        <key>size</key>
        <string>{${imgSize.w},${imgSize.h}}</string>
        <key>textureFileName</key>
        <string>${textureName}</string>
    </dict>
</dict>
</plist>`;

        // Создаем файл и скачиваем
        const blob = new Blob([plistContent], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${flieName}.plist`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md space-y-6 w-full">
            <div className="flex flex-row w-full justify-between items-center gap-4">
                <div className="w-full">
                    <h2 className="text-2xl font-bold text-gray-800">{t('extractor.title')}</h2>
                    <p className="text-xs text-gray-500">{t('extractor.description')}</p>
                </div>

                <div className={cn("flex items-center mr-1 text-nowrap")}>
                    <p className="text-sm text-gray-500 pr-1">{t('extractor.minSize')}</p>
                    <input
                        type="number"
                        min="1"
                        step="10"
                        value={minSize}
                        onChange={(e) => setMinSize(Number(e.target.value))}
                        className={cn("w-16 px-2 py-1 text-sm text-black",
                            "border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        )}
                        disabled={isProcessing}
                    />
                </div>

                <input
                    type="file"
                    accept="image/png"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-nowrap px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
                    disabled={isProcessing}
                >
                    {isProcessing ? t('extractor.processing') : t('extractor.upload')}
                </button>
            </div>

            {
                sprites.length > 0 && (
                    <div className="space-y-4 border-t pt-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-700">
                                {t('extractor.found', { count: sprites.length, selected: selectedIds.size })}
                            </h3>
                            <button
                                onClick={generateAndDownloadPlist}
                                disabled={selectedIds.size === 0}
                                className="px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {t('extractor.download', { fileName: flieName })}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {sprites.map((sprite) => {
                                const isSelected = selectedIds.has(sprite.id);
                                return (
                                    <div
                                        key={sprite.id}
                                        className={`relative p-2 border-2 rounded-lg cursor-pointer flex flex-col items-center justify-between transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                        onClick={() => toggleSelection(sprite.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelection(sprite.id)}
                                            className="absolute top-2 left-2 cursor-pointer w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()} // предотвращаем двойное срабатывание
                                        />
                                        <div className="h-24 w-full flex items-center justify-center checkerboard-bg rounded overflow-hidden mb-2">
                                            {/* Checkerboard паттерн для прозрачности можно добавить через CSS, здесь используем серый фон как заглушку */}
                                            <img
                                                src={sprite.dataUrl}
                                                alt={sprite.id}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>
                                        <div className="text-xs text-gray-600 text-center break-all w-full">
                                            {sprite.w}x{sprite.h} px
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }
        </div >
    );
};