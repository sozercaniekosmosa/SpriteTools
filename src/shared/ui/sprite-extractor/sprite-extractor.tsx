import React, { useState, useRef, type ChangeEvent } from 'react';
import JSZip from 'jszip';
import { useTranslation } from 'react-i18next';

interface SpriteExtractorProps {
    initialMinSize?: number;
}

export const SpriteExtractor: React.FC<SpriteExtractorProps> = ({ initialMinSize = 10 }) => {
    const { t } = useTranslation();
    const [minSize, setMinSize] = useState<number>(initialMinSize);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            await processImage(file, minSize);
        } catch (error) {
            console.error(t('spriteExtractor.error'), error);
            alert(t('spriteExtractor.errorAlert'));
        } finally {
            setIsProcessing(false);
            // Очищаем input, чтобы можно было загрузить тот же файл снова
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const processImage = (file: File, minSpriteSize: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = async () => {
                URL.revokeObjectURL(objectUrl);

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas context не поддерживается');

                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Алгоритм поиска спрайтов
                const boundingBoxes = findSprites(imageData, minSpriteSize);

                if (boundingBoxes.length === 0) {
                    alert(t('spriteExtractor.notFound'));
                    return resolve();
                }

                // Создаем архив
                const zip = new JSZip();
                const promises = boundingBoxes.map((box, index) => {
                    return extractSpriteToZip(canvas, box, zip, index);
                });

                await Promise.all(promises);

                // Скачиваем архив
                const content = await zip.generateAsync({ type: 'blob' });
                const downloadUrl = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = 'sprites.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);

                resolve();
            };

            img.onerror = () => reject('Ошибка загрузки изображения');
            img.src = objectUrl;
        });
    };

    // Поиск границ спрайтов (Bounding Boxes)
    const findSprites = (imageData: ImageData, minSize: number) => {
        const { width, height, data } = imageData;
        const visited = new Uint8Array(width * height);
        const boxes = [];

        const getAlpha = (x: number, y: number) => data[(y * width + x) * 4 + 3];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;

                // Если пиксель непрозрачный и еще не посещен
                if (getAlpha(x, y) > 0 && visited[index] === 0) {
                    // Запускаем BFS (Flood Fill)
                    let minX = x, maxX = x;
                    let minY = y, maxY = y;

                    const queue = [{ cx: x, cy: y }];
                    visited[index] = 1;

                    let head = 0; // Оптимизация очереди, чтобы не использовать shift()

                    while (head < queue.length) {
                        const { cx, cy } = queue[head++];

                        // Обновляем границы
                        if (cx < minX) minX = cx;
                        if (cx > maxX) maxX = cx;
                        if (cy < minY) minY = cy;
                        if (cy > maxY) maxY = cy;

                        // Проверяем соседей (вверх, вниз, влево, вправо)
                        const neighbors = [
                            { nx: cx - 1, ny: cy },
                            { nx: cx + 1, ny: cy },
                            { nx: cx, ny: cy - 1 },
                            { nx: cx, ny: cy + 1 }
                        ];

                        for (const { nx, ny } of neighbors) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nIndex = ny * width + nx;
                                if (visited[nIndex] === 0 && getAlpha(nx, ny) > 0) {
                                    visited[nIndex] = 1;
                                    queue.push({ cx: nx, cy: ny });
                                }
                            }
                        }
                    }

                    const spriteWidth = maxX - minX + 1;
                    const spriteHeight = maxY - minY + 1;

                    if (spriteWidth >= minSize && spriteHeight >= minSize) {
                        boxes.push({ x: minX, y: minY, w: spriteWidth, h: spriteHeight });
                    }
                }
            }
        }
        return boxes;
    };

    // Вырезание конкретного спрайта и добавление в ZIP
    const extractSpriteToZip = (
        sourceCanvas: HTMLCanvasElement,
        box: { x: number, y: number, w: number, h: number },
        zip: JSZip,
        index: number
    ): Promise<void> => {
        return new Promise((resolve) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = box.w;
            tempCanvas.height = box.h;
            const tCtx = tempCanvas.getContext('2d');

            tCtx?.drawImage(
                sourceCanvas,
                box.x, box.y, box.w, box.h, // Откуда берем
                0, 0, box.w, box.h          // Куда рисуем
            );

            tempCanvas.toBlob((blob) => {
                if (blob) {
                    zip.file(`sprite_${index + 1}.png`, blob);
                }
                resolve();
            }, 'image/png');
        });
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ marginBottom: '15px' }}>
                <label style={{ marginRight: '10px' }}>
                    {t('spriteExtractor.minSize')}
                    <input
                        type="number"
                        min="1"
                        value={minSize}
                        onChange={(e) => setMinSize(Number(e.target.value))}
                        style={{ marginLeft: '10px', width: '60px', color: '#000' }}
                        disabled={isProcessing}
                    />
                </label>
            </div>

            <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            <button
                onClick={handleButtonClick}
                disabled={isProcessing}
                style={{
                    padding: '10px 20px',
                    backgroundColor: isProcessing ? '#ccc' : '#007BFF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
            >
                {isProcessing ? t('spriteExtractor.processing') : t('spriteExtractor.upload')}
            </button>
        </div>
    );
};